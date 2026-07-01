import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { prisma } from '../utils/prisma';
import {
  authenticateJWT,
  authorize,
} from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import { getAvailableSlots } from '../services/slots.service';

export const mastersRouter = Router();
mastersRouter.use(authenticateJWT);

const masterSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional().or(z.literal('')),
  telegramChatId: z.string().optional().or(z.literal('')),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  email: z.string().email().optional().or(z.literal('')),
  password: z.string().min(6).optional().or(z.literal('')),
});

const scheduleSchema = z.array(
  z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    isDayOff: z.boolean().default(false),
  })
);

// GET /masters
mastersRouter.get('/', async (_req, res, next) => {
  try {
    const masters = await prisma.master.findMany({
      where: { isActive: true },
      include: { workSchedules: true },
      orderBy: { name: 'asc' },
    });
    res.json(masters);
  } catch (err) {
    next(err);
  }
});

// GET /masters/:id
mastersRouter.get('/:id', async (req, res, next) => {
  try {
    const master = await prisma.master.findUnique({
      where: { id: req.params.id },
      include: { workSchedules: true, dayOffs: { orderBy: { date: 'asc' } } },
    });
    if (!master) throw new AppError(404, 'Master not found');
    res.json(master);
  } catch (err) {
    next(err);
  }
});

// POST /masters (OWNER only)
mastersRouter.post(
  '/',
  authorize(Role.OWNER),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, ...masterData } = masterSchema.parse(req.body);

      // If email and password are provided, create a user and link to master
      if (email && password) {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
          throw new AppError(400, 'User with this email already exists');
        }
        
        const bcrypt = require('bcryptjs');
        const passwordHash = await bcrypt.hash(password, 10);

        const result = await prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: {
              email,
              passwordHash,
              role: Role.MASTER,
            },
          });
          const master = await tx.master.create({
            data: { ...masterData, userId: user.id },
          });
          return master;
        });
        res.status(201).json(result);
      } else {
        const master = await prisma.master.create({ data: masterData });
        res.status(201).json(master);
      }
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /masters/:id
mastersRouter.patch(
  '/:id',
  authorize(Role.OWNER),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, ...masterData } = masterSchema.partial().parse(req.body);
      
      // Note: Updating email/password for existing master is complex (might not have a user yet).
      // For MVP, we'll only update master fields here.
      const master = await prisma.master.update({
        where: { id: req.params.id },
        data: masterData,
      });
      res.json(master);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /masters/:id (soft delete)
mastersRouter.delete(
  '/:id',
  authorize(Role.OWNER),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await prisma.master.update({
        where: { id: req.params.id },
        data: { isActive: false },
      });
      res.json({ message: 'Master deactivated' });
    } catch (err) {
      next(err);
    }
  }
);

// GET /masters/:id/schedule
mastersRouter.get('/:id/schedule', async (req, res, next) => {
  try {
    const schedules = await prisma.workSchedule.findMany({
      where: { masterId: req.params.id },
      orderBy: { dayOfWeek: 'asc' },
    });
    res.json(schedules);
  } catch (err) {
    next(err);
  }
});

// PUT /masters/:id/schedule (OWNER)
mastersRouter.put(
  '/:id/schedule',
  authorize(Role.OWNER),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = scheduleSchema.parse(req.body);
      const masterId = req.params.id;

      // Upsert each day
      const schedules = await prisma.$transaction(
        data.map((day) =>
          prisma.workSchedule.upsert({
            where: { masterId_dayOfWeek: { masterId, dayOfWeek: day.dayOfWeek } },
            update: {
              startTime: day.startTime,
              endTime: day.endTime,
              isDayOff: day.isDayOff,
            },
            create: { masterId, ...day },
          })
        )
      );

      res.json(schedules);
    } catch (err) {
      next(err);
    }
  }
);

// POST /masters/:id/day-offs
mastersRouter.post(
  '/:id/day-offs',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { date, reason } = z
        .object({ date: z.string().date(), reason: z.string().optional() })
        .parse(req.body);

      const dayOff = await prisma.dayOff.create({
        data: { masterId: req.params.id, date: new Date(date), reason },
      });
      res.status(201).json(dayOff);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /masters/:id/day-offs/:dayOffId (OWNER)
mastersRouter.delete(
  '/:id/day-offs/:dayOffId',
  authorize(Role.OWNER),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await prisma.dayOff.delete({ where: { id: req.params.dayOffId } });
      res.json({ message: 'Day off removed' });
    } catch (err) {
      next(err);
    }
  }
);

// GET /masters/:id/slots?date=YYYY-MM-DD&serviceId=xxx
mastersRouter.get('/:id/slots', async (req, res, next) => {
  try {
    const { date, serviceId } = z
      .object({ date: z.string().date(), serviceId: z.string().uuid() })
      .parse(req.query);

    const slots = await getAvailableSlots(req.params.id, date, serviceId);
    res.json(slots);
  } catch (err) {
    next(err);
  }
});
