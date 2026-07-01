import { api } from './client';
import type {
  Appointment,
  AuthTokens,
  Client,
  DashboardToday,
  DayOff,
  Master,
  Notification,
  Service,
  TimeSlot,
  WorkSchedule,
} from '@/types';

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthTokens>('/auth/login', { email, password }).then((r) => r.data),
  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),
  me: () => api.get('/auth/me').then((r) => r.data),
};

// ─── Masters ──────────────────────────────────────────────────────────────────
export const mastersApi = {
  list: () => api.get<Master[]>('/masters').then((r) => r.data),
  get: (id: string) => api.get<Master>(`/masters/${id}`).then((r) => r.data),
  create: (data: Partial<Master>) =>
    api.post<Master>('/masters', data).then((r) => r.data),
  update: (id: string, data: Partial<Master>) =>
    api.patch<Master>(`/masters/${id}`, data).then((r) => r.data),
  deactivate: (id: string) => api.delete(`/masters/${id}`),
  getSchedule: (id: string) =>
    api.get<WorkSchedule[]>(`/masters/${id}/schedule`).then((r) => r.data),
  updateSchedule: (id: string, data: Partial<WorkSchedule>[]) =>
    api.put<WorkSchedule[]>(`/masters/${id}/schedule`, data).then((r) => r.data),
  addDayOff: (id: string, date: string, reason?: string) =>
    api.post<DayOff>(`/masters/${id}/day-offs`, { date, reason }).then((r) => r.data),
  removeDayOff: (masterId: string, dayOffId: string) =>
    api.delete(`/masters/${masterId}/day-offs/${dayOffId}`),
  getSlots: (masterId: string, date: string, serviceId: string) =>
    api
      .get<TimeSlot[]>(`/masters/${masterId}/slots`, {
        params: { date, serviceId },
      })
      .then((r) => r.data),
};

// ─── Services ─────────────────────────────────────────────────────────────────
export const servicesApi = {
  list: () => api.get<Service[]>('/services').then((r) => r.data),
  create: (data: Partial<Service>) =>
    api.post<Service>('/services', data).then((r) => r.data),
  update: (id: string, data: Partial<Service>) =>
    api.patch<Service>(`/services/${id}`, data).then((r) => r.data),
  deactivate: (id: string) => api.delete(`/services/${id}`),
};

// ─── Clients ──────────────────────────────────────────────────────────────────
export const clientsApi = {
  list: (search?: string) =>
    api
      .get<Client[]>('/clients', { params: search ? { search } : {} })
      .then((r) => r.data),
  get: (id: string) => api.get<Client>(`/clients/${id}`).then((r) => r.data),
  create: (data: Partial<Client>) =>
    api.post<Client>('/clients', data).then((r) => r.data),
  update: (id: string, data: Partial<Client>) =>
    api.patch<Client>(`/clients/${id}`, data).then((r) => r.data),
};

// ─── Appointments ─────────────────────────────────────────────────────────────
export const appointmentsApi = {
  list: (params?: { date?: string; masterId?: string; status?: string }) =>
    api
      .get<Appointment[]>('/appointments', { params })
      .then((r) => r.data),
  get: (id: string) =>
    api.get<Appointment>(`/appointments/${id}`).then((r) => r.data),
  create: (data: {
    masterId: string;
    clientId: string;
    serviceId: string;
    startsAt: string;
    notes?: string;
  }) => api.post<Appointment>('/appointments', data).then((r) => r.data),
  update: (id: string, data: Partial<Appointment>) =>
    api.patch<Appointment>(`/appointments/${id}`, data).then((r) => r.data),
  cancel: (id: string, reason?: string, cancelledBy?: string) =>
    api
      .post<Appointment>(`/appointments/${id}/cancel`, { reason, cancelledBy })
      .then((r) => r.data),
  complete: (id: string) =>
    api.post<Appointment>(`/appointments/${id}/complete`).then((r) => r.data),
  noShow: (id: string) =>
    api.post<Appointment>(`/appointments/${id}/no-show`).then((r) => r.data),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardApi = {
  today: () =>
    api.get<DashboardToday>('/dashboard/today').then((r) => r.data),
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationsApi = {
  list: () =>
    api.get<Notification[]>('/notifications').then((r) => r.data),
  test: (channel: string, recipient: string) =>
    api.post('/notifications/test', { channel, recipient }),
};
