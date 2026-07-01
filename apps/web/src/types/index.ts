// ─── API Types ────────────────────────────────────────────────────────────────

export type Role = 'OWNER' | 'MASTER';

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'NO_SHOW';

export type CancelledBy = 'CLIENT' | 'MASTER' | 'OWNER';

export type NotificationChannel = 'EMAIL' | 'TELEGRAM' | 'SMS';

export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED';

// ─── Entities ─────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
  master?: Pick<Master, 'id' | 'name' | 'color'> | null;
}

export interface Master {
  id: string;
  userId?: string | null;
  name: string;
  phone?: string | null;
  telegramChatId?: string | null;
  color: string;
  isActive: boolean;
  createdAt: string;
  workSchedules?: WorkSchedule[];
}

export interface WorkSchedule {
  id: string;
  masterId: string;
  dayOfWeek: number; // 0=Sun ... 6=Sat
  startTime: string;
  endTime: string;
  isDayOff: boolean;
}

export interface DayOff {
  id: string;
  masterId: string;
  date: string;
  reason?: string | null;
}

export interface Service {
  id: string;
  name: string;
  durationMinutes: number;
  price: string | number;
  isActive: boolean;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  telegramChatId?: string | null;
  notes?: string | null;
  createdAt: string;
  appointments?: Appointment[];
}

export interface Appointment {
  id: string;
  masterId: string;
  clientId: string;
  serviceId: string;
  startsAt: string; // ISO UTC
  endsAt: string;   // ISO UTC
  status: AppointmentStatus;
  notes?: string | null;
  cancelledBy?: CancelledBy | null;
  cancelReason?: string | null;
  createdAt: string;
  master: Pick<Master, 'id' | 'name' | 'color'>;
  client: Pick<Client, 'id' | 'name' | 'phone'>;
  service: Pick<Service, 'id' | 'name' | 'durationMinutes' | 'price'>;
}

export interface Notification {
  id: string;
  appointmentId: string;
  recipientType: 'CLIENT' | 'MASTER';
  channel: NotificationChannel;
  scheduledAt: string;
  sentAt?: string | null;
  status: NotificationStatus;
  message: string;
}

// ─── Slot ─────────────────────────────────────────────────────────────────────

export interface TimeSlot {
  startsAt: string;
  endsAt: string;
  available: boolean;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardToday {
  date: string;
  stats: {
    total: number;
    confirmed: number;
    completed: number;
    noShow: number;
  };
  appointments: Appointment[];
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}
