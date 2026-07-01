import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppointmentStatus, CancelledBy, Role } from '@prisma/client';
import { prisma } from '../utils/prisma';
import {
  authenticateJWT,
  authorize,
} from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import { checkDoubleBooking } from '../services/slots.service';
import { scheduleAppointmentNotifications } from '../services/notifications.service';

export const appointmentsRouter = Router();
appointmentsRouter.use(authenticateJWT);

const createAppointmentSchema = z.object({
  masterId: z.string().uuid(),
  clientId: z.string().uuid(),
  serviceId: z.string().uuid(),
  startsAt: z.string().datetime(),
  notes: z.string().optional(),
});

const updateAppointmentSchema = z.object({
  masterId: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional(),
  startsAt: z.string().datetime().optional(),
  notes: z.string().optional(),
});

// GET /appointments?date=YYYY-MM-DD&masterId=xxx&status=CONFIRMED
appointmentsRouter.get('/', async (req, res, next) => {
  try {
    const { date, masterId, status } = z
      .object({
        date: z.string().date().optional(),
        masterId: z.string().uuid().optional(),
        status: z.nativeEnum(AppointmentStatus).optional(),
      })
      .parse(req.query);

    // Masters can only see their own appointments
    let filterMasterId = masterId;
    if (req.user!.role === Role.MASTER) {
      const masterRecord = await prisma.master.findFirst({
        where: { userId: req.user!.userId },
      });
      filterMasterId = masterRecord?.id;
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        ...(filterMasterId ? { masterId: filterMasterId } : {}),
        // Merge status filter: if caller requests a specific status, use it;
        // otherwise exclude cancelled appointments.
        ...(status
          ? { status }
          : { status: { not: AppointmentStatus.CANCELLED } }),
        ...(date
          ? {
              startsAt: {
                gte: new Date(`${date}T00:00:00.000Z`),
                lt: new Date(`${date}T23:59:59.999Z`),
              },
            }
          : {}),
      },
      include: {
        master: { select: { id: true, name: true, color: true } },
        client: { select: { id: true, name: true, phone: true } },
        service: { select: { id: true, name: true, durationMinutes: true, price: true } },
      },
      orderBy: { startsAt: 'asc' },
    });

    res.json(appointments);
  } catch (err) {
    next(err);
  }
});

// GET /appointments/:id
appointmentsRouter.get('/:id', async (req, res, next) => {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.id as string },
      include: {
        master: true,
        client: true,
        service: true,
        notifications: { orderBy: { scheduledAt: 'asc' } },
      },
    });
    if (!appointment) throw new AppError(404, 'Appointment not found');
    res.json(appointment);
  } catch (err) {
    next(err);
  }
});

// POST /appointments — Create with double-booking protection
appointmentsRouter.post(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = createAppointmentSchema.parse(req.body);

      const service = await prisma.service.findUnique({
        where: { id: data.serviceId },
      });
      if (!service) throw new AppError(404, 'Service not found');

      const startsAt = new Date(data.startsAt);
      const endsAt = new Date(
        startsAt.getTime() + service.durationMinutes * 60 * 1000
      );

      // ── Double-booking protection (transaction + pessimistic check) ─────
      const appointment = await prisma.$transaction(async (tx) => {
        await checkDoubleBooking(tx, data.masterId, startsAt, endsAt, null);

        return tx.appointment.create({
          data: {
            ...data,
            startsAt,
            endsAt,
            status: AppointmentStatus.CONFIRMED,
          },
          include: { master: true, client: true, service: true },
        });
      });

      // Schedule reminder notifications
      await scheduleAppointmentNotifications(appointment.id, startsAt);

      res.status(201).json(appointment);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /appointments/:id — Reschedule/update
appointmentsRouter.patch(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = updateAppointmentSchema.parse(req.body);
      const existing = await prisma.appointment.findUnique({
        where: { id: req.params.id as string },
        include: { service: true },
      });
      if (!existing) throw new AppError(404, 'Appointment not found');
      if (existing.status === AppointmentStatus.CANCELLED) {
        throw new AppError(400, 'Cannot update a cancelled appointment');
      }

      let startsAt = existing.startsAt;
      let endsAt = existing.endsAt;
      const masterId = data.masterId ?? existing.masterId;

      if (data.startsAt || data.serviceId) {
        startsAt = data.startsAt ? new Date(data.startsAt) : existing.startsAt;

        const service = data.serviceId
          ? await prisma.service.findUnique({ where: { id: data.serviceId } })
          : (existing as any).service;
        if (!service) throw new AppError(404, 'Service not found');

        endsAt = new Date(
          startsAt.getTime() + service.durationMinutes * 60 * 1000
        );
      }

      const updated = await prisma.$transaction(async (tx) => {
        if (data.startsAt || data.masterId) {
          await checkDoubleBooking(tx, masterId, startsAt, endsAt, req.params.id as string);
        }

        // Invalidate old notifications
        await tx.notification.updateMany({
          where: { appointmentId: req.params.id as string, status: 'PENDING' },
          data: { status: 'FAILED' },
        });

        return tx.appointment.update({
          where: { id: req.params.id as string },
          data: { ...data, startsAt, endsAt },
          include: { master: true, client: true, service: true },
        });
      });

      // Reschedule notifications
      await scheduleAppointmentNotifications(updated.id, startsAt);

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// POST /appointments/:id/cancel
appointmentsRouter.post(
  '/:id/cancel',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reason, cancelledBy } = z
        .object({
          reason: z.string().optional(),
          cancelledBy: z.nativeEnum(CancelledBy).default(CancelledBy.OWNER),
        })
        .parse(req.body);

      const appointment = await prisma.appointment.update({
        where: { id: req.params.id as string },
        data: {
          status: AppointmentStatus.CANCELLED,
          cancelReason: reason,
          cancelledBy,
        },
        include: { master: true, client: true, service: true },
      });

      // Cancel pending notifications
      await prisma.notification.updateMany({
        where: { appointmentId: req.params.id as string, status: 'PENDING' },
        data: { status: 'FAILED' },
      });

      res.json(appointment);
    } catch (err) {
      next(err);
    }
  }
);

// POST /appointments/:id/complete
appointmentsRouter.post(
  '/:id/complete',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const appointment = await prisma.appointment.update({
        where: { id: req.params.id as string },
        data: { status: AppointmentStatus.COMPLETED },
      });
      res.json(appointment);
    } catch (err) {
      next(err);
    }
  }
);

// POST /appointments/:id/no-show
appointmentsRouter.post(
  '/:id/no-show',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const appointment = await prisma.appointment.update({
        where: { id: req.params.id as string },
        data: { status: AppointmentStatus.NO_SHOW },
      });
      res.json(appointment);
    } catch (err) {
      next(err);
    }
  }
);
