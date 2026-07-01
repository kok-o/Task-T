import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { prisma } from '../utils/prisma';
import {
  authenticateJWT,
  authorize,
} from '../middleware/auth.middleware';

export const servicesRouter = Router();
servicesRouter.use(authenticateJWT);

const serviceSchema = z.object({
  name: z.string().min(1),
  durationMinutes: z.number().int().min(15).max(480),
  price: z.number().min(0),
});

// GET /services
servicesRouter.get('/', async (_req, res, next) => {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    res.json(services);
  } catch (err) {
    next(err);
  }
});

// POST /services (OWNER)
servicesRouter.post(
  '/',
  authorize(Role.OWNER),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = serviceSchema.parse(req.body);
      const service = await prisma.service.create({ data });
      res.status(201).json(service);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /services/:id (OWNER)
servicesRouter.patch(
  '/:id',
  authorize(Role.OWNER),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = serviceSchema.partial().parse(req.body);
      const service = await prisma.service.update({
        where: { id: req.params.id as string },
        data,
      });
      res.json(service);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /services/:id (OWNER) - soft delete
servicesRouter.delete(
  '/:id',
  authorize(Role.OWNER),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await prisma.service.update({
        where: { id: req.params.id as string },
        data: { isActive: false },
      });
      res.json({ message: 'Service deactivated' });
    } catch (err) {
      next(err);
    }
  }
);
