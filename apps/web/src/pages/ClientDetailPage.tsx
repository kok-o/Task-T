import { Link, useParams } from 'react-router-dom';
import { Phone, Mail, FileText, Plus, CalendarDays } from 'lucide-react';
import { useClient } from '@/hooks';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { MasterAvatar } from '@/components/ui/MasterAvatar';
import { formatDateTime, formatPrice } from '@/utils';

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: client, isLoading } = useClient(id!);

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-2xl">
        <div className="h-24 bg-muted animate-pulse rounded-xl" />
        <div className="h-48 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Клиент не найден
      </div>
    );
  }

  const appointments = client.appointments ?? [];

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
            {client.name[0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{client.name}</h1>
            <p className="text-sm text-muted-foreground">Клиент с {new Date(client.createdAt).getFullYear()} года</p>
          </div>
        </div>
        <Link
          to={`/appointments/new`}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          Записать
        </Link>
      </div>

      {/* Contact Info */}
      <div className="bg-card rounded-2xl shadow-sm p-6 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Контакты
        </h2>
        <div className="space-y-2">
          <a
            href={`tel:${client.phone}`}
            className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
          >
            <Phone className="h-4 w-4 text-muted-foreground" />
            {client.phone}
          </a>
          {client.email && (
            <a
              href={`mailto:${client.email}`}
              className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
            >
              <Mail className="h-4 w-4 text-muted-foreground" />
              {client.email}
            </a>
          )}
          {client.notes && (
            <div className="flex items-start gap-3 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
              <p className="text-muted-foreground">{client.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl shadow-sm p-6 text-center">
          <p className="text-2xl font-bold">{appointments.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Всего визитов</p>
        </div>
        <div className="bg-card rounded-2xl shadow-sm p-6 text-center">
          <p className="text-2xl font-bold text-green-600">
            {appointments.filter((a) => a.status === 'COMPLETED').length}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Завершено</p>
        </div>
        <div className="bg-card rounded-2xl shadow-sm p-6 text-center">
          <p className="text-2xl font-bold text-red-500">
            {appointments.filter((a) => a.status === 'NO_SHOW').length}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Не пришли</p>
        </div>
      </div>

      {/* Appointment History */}
      <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-border/40 flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">История визитов</h2>
          <span className="ml-auto text-xs text-muted-foreground">{appointments.length}</span>
        </div>

        {appointments.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            Нет записей
          </p>
        ) : (
          <div className="divide-y divide-border">
            {appointments.map((a) => (
              <Link
                key={a.id}
                to={`/appointments/${a.id}`}
                className="flex items-center gap-4 px-6 py-5 hover:bg-accent/30 transition-colors"
              >
                <div
                  className="h-10 w-1 rounded-full flex-shrink-0"
                  style={{ backgroundColor: a.master.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.service.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <MasterAvatar
                      name={a.master.name}
                      color={a.master.color}
                      size="sm"
                    />
                    <p className="text-xs text-muted-foreground">{a.master.name}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(a.startsAt)}
                  </p>
                  <p className="text-xs font-semibold text-primary mt-0.5">
                    {formatPrice(a.service.price)}
                  </p>
                  <StatusBadge status={a.status} className="mt-1" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
