import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, CheckCircle2, XCircle, Clock, TrendingUp, MoreVertical, X } from 'lucide-react';
import { useDashboard, useCompleteAppointment, useCancelAppointment } from '@/hooks';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { MasterAvatar } from '@/components/ui/MasterAvatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatTime, formatPrice } from '@/utils';
import { useAuthStore } from '@/store/auth.store';

function formatWaitTime(diffMs: number) {
  if (diffMs <= 0) return 'прямо сейчас';
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `через ${mins} мин`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `через ${hours} ч ${remainingMins} мин`;
}

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
    <div className="bg-card rounded-2xl shadow-sm p-5 sm:p-6 flex items-center gap-4 transition-all duration-300 hover:shadow-md hover:-translate-y-1 border border-border/30">
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
  const completeAppt = useCompleteAppointment();
  const cancelAppt = useCancelAppointment();
  const [nowDate, setNowDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNowDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const { upcoming, past } = useMemo(() => {
    if (!data) return { upcoming: [], past: [] };
    const now = new Date();
    return {
      upcoming: data.appointments.filter(
        (a: any) => new Date(a.startsAt) > now && a.status === 'CONFIRMED'
      ).sort((a: any, b: any) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()),
      past: data.appointments.filter(
        (a: any) => new Date(a.startsAt) <= now
      ).sort((a: any, b: any) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
        <Skeleton className="h-48 rounded-[24px] w-full" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
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

  const nextAppointment = upcoming.length > 0 ? upcoming[0] : null;

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4" />
          Новая запись
        </Link>
      </div>

      {/* Hero: Next Appointment */}
      <div className="bg-primary text-primary-foreground rounded-[24px] p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center relative overflow-hidden shadow-[0_4px_14px_rgba(212,47,98,0.35)]">
        <div className="relative z-10">
          <h2 className="text-primary-foreground/80 text-sm uppercase tracking-wider font-semibold mb-2">
            Следующая запись
          </h2>
          {nextAppointment ? (
            <>
              <div className="text-4xl sm:text-5xl font-bold mb-2">
                {formatWaitTime(new Date(nextAppointment.startsAt).getTime() - nowDate.getTime())}
              </div>
              <p className="text-primary-foreground/90 text-lg flex items-center gap-2">
                <span className="font-semibold">{formatTime(nextAppointment.startsAt)}</span>
                <span>·</span>
                <span>{nextAppointment.client.name}</span>
                <span>·</span>
                <span>{nextAppointment.service.name}</span>
              </p>
            </>
          ) : (
            <div className="text-2xl font-semibold py-4">На сегодня записей больше нет 🎉</div>
          )}
        </div>
        {nextAppointment && (
          <Link
            to={`/appointments/${nextAppointment.id}`}
            className="mt-6 sm:mt-0 relative z-10 bg-white text-primary px-6 py-3 rounded-xl font-semibold shadow-sm hover:scale-105 transition-transform whitespace-nowrap"
          >
            Перейти к записи
          </Link>
        )}
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Clock className="w-64 h-64" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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

      {/* Appointments List */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming */}
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-border/50 bg-muted/20">
            <h2 className="font-semibold text-lg">Предстоящие</h2>
            <p className="text-xs text-muted-foreground">{upcoming.length} записей</p>
          </div>
          <div className="divide-y divide-border/50 flex-1">
            {upcoming.length === 0 && (
              <div className="flex flex-col items-center justify-center p-10 text-muted-foreground">
                <Clock className="h-10 w-10 mb-3 opacity-20" />
                <p className="text-sm">Нет предстоящих записей</p>
              </div>
            )}
            {upcoming.map((a) => (
              <div
                key={a.id}
                className="group flex items-center gap-4 px-6 py-4 hover:bg-accent/30 transition-colors relative"
              >
                <div
                  className="h-12 w-1 rounded-full flex-shrink-0"
                  style={{ backgroundColor: a.master.color }}
                />
                <div className="flex-1 min-w-0">
                  <Link to={`/appointments/${a.id}`} className="block hover:underline">
                    <p className="font-semibold text-sm truncate">{a.client.name}</p>
                  </Link>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {a.service.name}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-bold">{formatTime(a.startsAt)}</p>
                    <p className="text-xs text-muted-foreground">{formatPrice(a.service.price)}</p>
                  </div>
                  
                  {/* Quick Actions (visible on hover) */}
                  <div className="hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity gap-1 ml-2">
                    <button
                      title="Завершить визит"
                      onClick={(e) => { e.preventDefault(); completeAppt.mutate(a.id); }}
                      disabled={completeAppt.isPending}
                      className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <button
                      title="Отменить визит"
                      onClick={(e) => { e.preventDefault(); cancelAppt.mutate({ id: a.id, cancelledBy: 'MASTER' }); }}
                      disabled={cancelAppt.isPending}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Past */}
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-border/50 bg-muted/20">
            <h2 className="font-semibold text-lg">Прошедшие сегодня</h2>
            <p className="text-xs text-muted-foreground">{past.length} записей</p>
          </div>
          <div className="divide-y divide-border/50 flex-1">
            {past.length === 0 && (
              <div className="flex flex-col items-center justify-center p-10 text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 mb-3 opacity-20" />
                <p className="text-sm">Пока нет завершённых</p>
              </div>
            )}
            {past.map((a) => (
              <Link
                key={a.id}
                to={`/appointments/${a.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-accent/30 transition-colors"
              >
                <MasterAvatar
                  name={a.master.name}
                  color={a.master.color}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{a.client.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {a.service.name}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <p className="text-xs font-medium text-muted-foreground">{formatTime(a.startsAt)}</p>
                  <StatusBadge status={a.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
