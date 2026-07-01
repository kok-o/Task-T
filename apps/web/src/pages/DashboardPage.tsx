import { Link } from 'react-router-dom';
import { Plus, CheckCircle2, XCircle, Clock, TrendingUp } from 'lucide-react';
import { useDashboard } from '@/hooks';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { MasterAvatar } from '@/components/ui/MasterAvatar';
import { formatTime, formatPrice } from '@/utils';
import { useAuthStore } from '@/store/auth.store';

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-card rounded-3xl shadow-sm p-5 sm:p-6 flex items-center gap-4 transition-all duration-300 hover:shadow-md hover:-translate-y-1 border border-border/30">
      <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboard();
  const { user } = useAuthStore();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Не удалось загрузить данные
      </div>
    );
  }

  const now = new Date();
  const upcoming = data.appointments.filter(
    (a) => new Date(a.startsAt) > now && a.status === 'CONFIRMED'
  );
  const past = data.appointments.filter(
    (a) => new Date(a.startsAt) <= now
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Привет{user?.master?.name ? `, ${user.master.name}` : ''}! 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {new Date().toLocaleDateString('ru-RU', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
        </div>
        <Link
          to="/appointments/new"
          id="new-appointment-btn"
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4" />
          Новая запись
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          icon={TrendingUp}
          label="Всего записей"
          value={data.stats.total}
          color="bg-primary/10 text-primary"
        />
        <StatCard
          icon={Clock}
          label="Подтверждено"
          value={data.stats.confirmed}
          color="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
        />
        <StatCard
          icon={CheckCircle2}
          label="Завершено"
          value={data.stats.completed}
          color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <StatCard
          icon={XCircle}
          label="Не пришли"
          value={data.stats.noShow}
          color="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
        />
      </div>

      {/* Appointments */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming */}
        <div className="bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold">Предстоящие</h2>
            <p className="text-xs text-muted-foreground">{upcoming.length} записей</p>
          </div>
          <div className="divide-y divide-border">
            {upcoming.length === 0 && (
              <p className="px-5 py-6 text-sm text-muted-foreground text-center">
                Нет предстоящих записей
              </p>
            )}
            {upcoming.map((a) => (
              <Link
                key={a.id}
                to={`/appointments/${a.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-accent/50 transition-colors"
              >
                <div
                  className="h-10 w-1 rounded-full flex-shrink-0"
                  style={{ backgroundColor: a.master.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{a.client.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {a.service.name} · {a.master.name}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold">{formatTime(a.startsAt)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatPrice(a.service.price)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Past */}
        <div className="bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-border/40">
            <h2 className="font-semibold">Прошедшие сегодня</h2>
            <p className="text-xs text-muted-foreground">{past.length} записей</p>
          </div>
          <div className="divide-y divide-border">
            {past.length === 0 && (
              <p className="px-5 py-6 text-sm text-muted-foreground text-center">
                Пока нет
              </p>
            )}
            {past.map((a) => (
              <Link
                key={a.id}
                to={`/appointments/${a.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-accent/50 transition-colors"
              >
                <MasterAvatar
                  name={a.master.name}
                  color={a.master.color}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{a.client.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.service.name}
                  </p>
                </div>
                <StatusBadge status={a.status} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
