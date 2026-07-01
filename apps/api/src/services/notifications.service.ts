import nodemailer from 'nodemailer';
import { prisma } from '../utils/prisma';
import { NotificationChannel, NotificationStatus } from '@prisma/client';


// ─── Transport ────────────────────────────────────────────────────────────────

const emailTransport = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT || 587),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─── Telegram ─────────────────────────────────────────────────────────────────

async function sendTelegramMessage(
  chatId: string,
  message: string
): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn('[Telegram] Bot token not configured');
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
    });
    const data = (await res.json()) as { ok: boolean };
    return data.ok;
  } catch (err) {
    console.error('[Telegram] Send error:', err);
    return false;
  }
}

// ─── Email ────────────────────────────────────────────────────────────────────

async function sendEmail(
  to: string,
  subject: string,
  text: string
): Promise<boolean> {
  try {
    await emailTransport.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text,
    });
    return true;
  } catch (err) {
    console.error('[Email] Send error:', err);
    return false;
  }
}

// ─── Schedule Notifications ───────────────────────────────────────────────────

export async function scheduleAppointmentNotifications(
  appointmentId: string,
  startsAt: Date
): Promise<void> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      client: true,
      master: true,
      service: true,
    },
  });
  if (!appointment) return;

  const { client, master, service } = appointment;

  const studioName = process.env.STUDIO_NAME || 'Студия маникюра';
  const startsAtFormatted = startsAt.toLocaleString('ru-RU', {
    timeZone: process.env.STUDIO_TIMEZONE || 'UTC',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  // ── Notification for master (immediate) ───────────────────────────────────
  if (master.phone) {
    await prisma.notification.create({
      data: {
        appointmentId,
        recipientType: 'MASTER',
        channel: NotificationChannel.WHATSAPP,
        scheduledAt: new Date(),
        status: NotificationStatus.PENDING,
        message: `📅 Новая запись!\nКлиент: ${client.name} (${client.phone})\nУслуга: ${service.name}\nВремя: ${startsAtFormatted}`,
      },
    });
  }

  // ── Notification for client (immediate) ───────────────────────────────────
  if (client.phone) {
    await prisma.notification.create({
      data: {
        appointmentId,
        recipientType: 'CLIENT',
        channel: NotificationChannel.WHATSAPP,
        scheduledAt: new Date(),
        status: NotificationStatus.PENDING,
        message: `✅ Вы успешно записаны!\n${studioName}\n\nМастер: ${master.name}\nУслуга: ${service.name}\nВремя: ${startsAtFormatted}`,
      },
    });
  }

  // ── Client reminder: 24 hours before ──────────────────────────────────────
  const remind24h = new Date(startsAt.getTime() - 24 * 60 * 60 * 1000);
  if (remind24h > new Date()) {
    if (client.phone) {
      await prisma.notification.create({
        data: {
          appointmentId,
          recipientType: 'CLIENT',
          channel: NotificationChannel.WHATSAPP,
          scheduledAt: remind24h,
          status: NotificationStatus.PENDING,
          message: `💅 Напоминание!\n${studioName}\n\nЗавтра у вас запись:\nМастер: ${master.name}\nУслуга: ${service.name}\nВремя: ${startsAtFormatted}\n\nПожалуйста, приходите вовремя 🙏`,
        },
      });
    }
  }

  // ── Client reminder: 2 hours before ───────────────────────────────────────
  const remind2h = new Date(startsAt.getTime() - 2 * 60 * 60 * 1000);
  if (remind2h > new Date()) {
    if (client.phone) {
      await prisma.notification.create({
        data: {
          appointmentId,
          recipientType: 'CLIENT',
          channel: NotificationChannel.WHATSAPP,
          scheduledAt: remind2h,
          status: NotificationStatus.PENDING,
          message: `⏰ Через 2 часа ваша запись!\n${studioName}\n\nМастер: ${master.name}\nУслуга: ${service.name}\nВремя: ${startsAtFormatted}`,
        },
      });
    }
  }
}

// ─── Process Pending Notifications ────────────────────────────────────────────

export async function processPendingNotifications(): Promise<void> {
  const now = new Date();

  const pending = await prisma.notification.findMany({
    where: {
      status: NotificationStatus.PENDING,
      scheduledAt: { lte: now },
    },
    include: {
      appointment: {
        include: { client: true, master: true },
      },
    },
    take: 50, // Process in batches
  });

  console.log(`[Cron] Processing ${pending.length} pending notifications`);

  for (const notification of pending) {
    let success = false;
    const { appointment } = notification;

    try {
      if (notification.channel === NotificationChannel.TELEGRAM) {
        const chatId =
          notification.recipientType === 'CLIENT'
            ? appointment.client.telegramChatId
            : appointment.master.telegramChatId;

        if (chatId) {
          success = await sendTelegramMessage(chatId, notification.message);
        }
      } else if (notification.channel === NotificationChannel.EMAIL) {
        // Message is JSON for email notifications
        const payload = JSON.parse(notification.message) as {
          to: string;
          subject: string;
          text: string;
        };
        success = await sendEmail(payload.to, payload.subject, payload.text);
      } else if (notification.channel === NotificationChannel.WHATSAPP) {
        const phone =
          notification.recipientType === 'CLIENT'
            ? appointment.client.phone
            : appointment.master.phone;
        
        if (phone) {
          console.log(`[WhatsApp Mock] Sending message to ${phone}: ${notification.message}`);
          success = true;
        }
      }
    } catch (err) {
      console.error(`[Notification] Failed to send ${notification.id}:`, err);
    }

    // Update notification status (idempotent)
    await prisma.notification.update({
      where: { id: notification.id },
      data: {
        status: success ? NotificationStatus.SENT : NotificationStatus.FAILED,
        sentAt: success ? new Date() : undefined,
      },
    });
  }
}

// ─── Test Notification ────────────────────────────────────────────────────────

export async function sendTestNotification(
  channel: string,
  recipient: string
): Promise<void> {
  const message = '✅ Тестовое уведомление от системы управления записями студии маникюра!';
  if (channel === 'TELEGRAM') {
    await sendTelegramMessage(recipient, message);
  } else if (channel === 'EMAIL') {
    await sendEmail(recipient, 'Тестовое уведомление', message);
  } else if (channel === 'WHATSAPP') {
    console.log(`[WhatsApp Mock] Test message to ${recipient}: ${message}`);
  }
}
