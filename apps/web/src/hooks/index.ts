import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mastersApi, servicesApi, clientsApi, appointmentsApi, dashboardApi } from '@/api';
import type { Appointment, Master, Service, Client } from '@/types';
export { useDebounce } from './useDebounce';

// ─── Masters ──────────────────────────────────────────────────────────────────
export function useMasters() {
  return useQuery({
    queryKey: ['masters'],
    queryFn: mastersApi.list,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMaster(id: string) {
  return useQuery({
    queryKey: ['masters', id],
    queryFn: () => mastersApi.get(id),
    enabled: !!id,
  });
}

export function useCreateMaster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Master>) => mastersApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['masters'] }),
  });
}

export function useUpdateMaster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Master> }) =>
      mastersApi.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['masters'] });
      qc.invalidateQueries({ queryKey: ['masters', id] });
    },
  });
}

export function useDeleteMaster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mastersApi.deactivate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['masters'] });
    },
  });
}

export function useUpdateMasterSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ masterId, schedule }: {
      masterId: string;
      schedule: Array<{
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        isDayOff: boolean;
      }>;
    }) => mastersApi.updateSchedule(masterId, schedule as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['masters'] });
      qc.invalidateQueries({ queryKey: ['slots'] });
    },
  });
}

export function useSlots(masterId: string, date: string, serviceId: string) {
  return useQuery({
    queryKey: ['slots', masterId, date, serviceId],
    queryFn: () => mastersApi.getSlots(masterId, date, serviceId),
    enabled: !!masterId && !!date && !!serviceId,
    staleTime: 10 * 1000,
  });
}

// ─── Services ─────────────────────────────────────────────────────────────────
export function useServices() {
  return useQuery({
    queryKey: ['services'],
    queryFn: servicesApi.list,
  });
}

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Service>) => servicesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Service> }) =>
      servicesApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  });
}

// ─── Clients ──────────────────────────────────────────────────────────────────
export function useClients(search?: string) {
  return useQuery({
    queryKey: ['clients', search],
    queryFn: () => clientsApi.list(search),
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: () => clientsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Client>) => clientsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
}

// ─── Appointments ─────────────────────────────────────────────────────────────
export function useAppointments(params?: {
  date?: string;
  masterId?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['appointments', params],
    queryFn: () => appointmentsApi.list(params),
    refetchInterval: 30_000, // poll every 30s for real-time feel
    staleTime: 30 * 1000,
  });
}

export function useAppointment(id: string) {
  return useQuery({
    queryKey: ['appointments', id],
    queryFn: () => appointmentsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: appointmentsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['slots'] });
    },
  });
}

export function useCancelAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason, cancelledBy }: { id: string; reason?: string; cancelledBy?: string }) =>
      appointmentsApi.cancel(id, reason, cancelledBy),
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: ['appointments'] });
      qc.setQueriesData({ queryKey: ['appointments'] }, (old: any) => {
        if (!old) return old;
        return old.map((a: any) => (a.id === id ? { ...a, status: 'CANCELLED' } : a));
      });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useCompleteAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => appointmentsApi.complete(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['appointments'] });
      qc.setQueriesData({ queryKey: ['appointments'] }, (old: any) => {
        if (!old) return old;
        return old.map((a: any) => (a.id === id ? { ...a, status: 'COMPLETED' } : a));
      });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useNoShowAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => appointmentsApi.noShow(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.today,
    refetchInterval: 60_000, // refresh every minute
  });
}
