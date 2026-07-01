import { Router, Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { authenticateJWT, authorize } from '../middleware/auth.middleware';
import { sendTestNotification } from '../services/notifications.service';

export const notificationsRouter = Router();
notificationsRouter.use(authenticateJWT);

// GET /notifications (OWNER)
notificationsRouter.get(
  '/',
  authorize(Role.OWNER),
  async (_req, res, next) => {
    try {
      const notifications = await prisma.notification.findMany({
        include: {
          appointment: {
            include: {
              client: { select: { name: true, phone: true } },
              master: { select: { name: true } },
            },
          },
        },
        orderBy: { scheduledAt: 'desc' },
        take: 100,
      });
      res.json(notifications);
    } catch (err) {
      next(err);
    }
  }
);

// POST /notifications/test (OWNER)
notificationsRouter.post(
  '/test',
  authorize(Role.OWNER),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { channel, recipient } = req.body;
      await sendTestNotification(channel, recipient);
      res.json({ message: 'Test notification sent' });
    } catch (err) {
      next(err);
    }
  }
);
