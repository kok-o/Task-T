import { Prisma, AppointmentStatus } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';

type PrismaTransactionClient = Omit<
  Prisma.TransactionClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

/**
 * Checks for double-booking within a transaction.
 * Throws AppError 409 if conflict found.
 */
export async function checkDoubleBooking(
  tx: PrismaTransactionClient,
  masterId: string,
  startsAt: Date,
  endsAt: Date,
  excludeAppointmentId: string | null
): Promise<void> {
  const conflicting = await tx.appointment.findFirst({
    where: {
      masterId,
      id: excludeAppointmentId ? { not: excludeAppointmentId } : undefined,
      status: {
        in: [AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING],
      },
      // Overlap check: existing.startsAt < new.endsAt AND existing.endsAt > new.startsAt
      AND: [
        { startsAt: { lt: endsAt } },
        { endsAt: { gt: startsAt } },
      ],
    },
  });

  if (conflicting) {
    throw new AppError(
      409,
      `Time slot conflict: master already has an appointment from ${conflicting.startsAt.toISOString()} to ${conflicting.endsAt.toISOString()}`
    );
  }
}

interface TimeSlot {
  startsAt: string; // ISO string
  endsAt: string;
  available: boolean;
}

export async function getAvailableSlots(
  masterId: string,
  date: string, // YYYY-MM-DD
  serviceId: string
): Promise<TimeSlot[]> {
  const { prisma } = await import('../utils/prisma');

  // Treat date as UTC midnight to get the correct Day of Week
  const targetDate = new Date(`${date}T00:00:00.000Z`);
  const dayOfWeek = targetDate.getUTCDay(); // 0=Sun ... 6=Sat

  // 1. Check day-off
  const dayOff = await prisma.dayOff.findFirst({
    where: {
      masterId,
      date: {
        gte: new Date(`${date}T00:00:00.000Z`),
        lt: new Date(`${date}T23:59:59.999Z`),
      },
    },
  });
  if (dayOff) return [];

  // 2. Get work schedule for this day
  const schedule = await prisma.workSchedule.findFirst({
    where: { masterId, dayOfWeek },
  });
  if (!schedule || schedule.isDayOff) return [];

  // 3. Get service duration
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) return [];
  const durationMs = service.durationMinutes * 60 * 1000;

  // 4. Parse working hours in the server's LOCAL timezone
  // This automatically handles the offset (e.g. +5 for Almaty) if the server runs locally
  const workStart = new Date(`${date}T${schedule.startTime}:00`);
  const workEnd = new Date(`${date}T${schedule.endTime}:00`);

  // 5. Get existing appointments for the day
  const existingAppointments = await prisma.appointment.findMany({
    where: {
      masterId,
      status: { in: [AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING] },
      startsAt: { gte: workStart, lt: workEnd },
    },
    orderBy: { startsAt: 'asc' },
  });

  // 6. Generate 15-minute interval slots
  const slots: TimeSlot[] = [];
  const INTERVAL_MS = 15 * 60 * 1000; // 15 min steps

  const now = new Date(); // Current absolute time

  let current = workStart.getTime();
  const endMs = workEnd.getTime();

  while (current + durationMs <= endMs) {
    const slotStart = new Date(current);
    const slotEnd = new Date(current + durationMs);

    // Skip slots that have already started (relevant when booking for today)
    if (slotStart.getTime() <= now.getTime()) {
      current += INTERVAL_MS;
      continue;
    }

    // Check if this slot overlaps with any existing appointment
    const isBlocked = existingAppointments.some(
      (a) =>
        a.startsAt.getTime() < slotEnd.getTime() &&
        a.endsAt.getTime() > slotStart.getTime()
    );

    slots.push({
      startsAt: slotStart.toISOString(),
      endsAt: slotEnd.toISOString(),
      available: !isBlocked,
    });

    current += INTERVAL_MS;
  }

  return slots;
}
