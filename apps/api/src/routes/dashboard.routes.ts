import { Router } from 'express';
import { z } from 'zod';
import { AppointmentStatus } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { authenticateJWT } from '../middleware/auth.middleware';

export const dashboardRouter = Router();
dashboardRouter.use(authenticateJWT);

// GET /dashboard/today
dashboardRouter.get('/today', async (req, res, next) => {
  try {
    const tz = process.env.STUDIO_TIMEZONE || 'UTC';
    const now = new Date();

    // Calculate start/end of today in studio timezone
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: tz }); // YYYY-MM-DD
    const startOfDay = new Date(`${todayStr}T00:00:00`);
    const endOfDay = new Date(`${todayStr}T23:59:59`);

    const appointments = await prisma.appointment.findMany({
      where: {
        startsAt: { gte: startOfDay, lte: endOfDay },
        status: { not: AppointmentStatus.CANCELLED },
      },
      include: {
        master: { select: { id: true, name: true, color: true } },
        client: { select: { id: true, name: true, phone: true } },
        service: { select: { id: true, name: true, durationMinutes: true } },
      },
      orderBy: { startsAt: 'asc' },
    });

    const stats = {
      total: appointments.length,
      confirmed: appointments.filter(
        (a) => a.status === AppointmentStatus.CONFIRMED
      ).length,
      completed: appointments.filter(
        (a) => a.status === AppointmentStatus.COMPLETED
      ).length,
      noShow: appointments.filter(
        (a) => a.status === AppointmentStatus.NO_SHOW
      ).length,
    };

    res.json({ date: todayStr, stats, appointments });
  } catch (err) {
    next(err);
  }
});
