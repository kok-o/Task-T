import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Clock, User, Scissors, AlertCircle, CheckCircle2, XCircle, UserX } from 'lucide-react';
import { useAppointment, useCancelAppointment, useCompleteAppointment, useNoShowAppointment } from '@/hooks';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { MasterAvatar } from '@/components/ui/MasterAvatar';
import { formatDateTime, formatPrice } from '@/utils';
import { toast } from 'sonner';
import { useState } from 'react';

export default function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: appointment, isLoading } = useAppointment(id!);
  const cancelMutation = useCancelAppointment();
  const completeMutation = useCompleteAppointment();
  const noShowMutation = useNoShowAppointment();
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelForm, setShowCancelForm] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }
  if (!appointment) {
    return <div className="text-center py-12 text-muted-foreground">Запись не найдена</div>;
  }

  const isCancellable = ['CONFIRMED', 'PENDING'].includes(appointment.status);
  const isCompletable = appointment.status === 'CONFIRMED';

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync({
        id: appointment.id,
        reason: cancelReason,
        cancelledBy: 'OWNER',
      });
      toast.success('Запись отменена');
      navigate('/calendar');
    } catch (err) {
      toast.error('Не удалось отменить запись');
    }
  };

  const handleComplete = async () => {
    try {
      await completeMutation.mutateAsync(appointment.id);
      toast.success('Визит завершен');
      navigate('/calendar');
    } catch (err) {
      toast.error('Не удалось завершить визит');
    }
  };

  return (
    <div className="max-w-xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-accent transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Детали записи</h1>
        </div>
        <StatusBadge status={appointment.status} />
      </div>

      {/* Client */}
      <div className="bg-card rounded-2xl shadow-sm p-6 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Клиент</h2>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold">{appointment.client.name}</p>
            <a href={`tel:${appointment.client.phone}`} className="flex items-center gap-1 text-sm text-primary hover:underline">
              <Phone className="h-3 w-3" />
              {appointment.client.phone}
            </a>
          </div>
        </div>
      </div>

      {/* Master & Service */}
      <div className="bg-card rounded-2xl shadow-sm p-6 space-y-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Мастер и услуга</h2>
        <div className="flex items-center gap-3">
          <MasterAvatar name={appointment.master.name} color={appointment.master.color} size="md" />
          <div>
            <p className="font-medium">{appointment.master.name}</p>
            <p className="text-xs text-muted-foreground">Мастер</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
            <Scissors className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">{appointment.service.name}</p>
            <p className="text-xs text-muted-foreground">
              {appointment.service.durationMinutes} мин · {formatPrice(appointment.service.price)}
            </p>
          </div>
        </div>
      </div>

      {/* Time */}
      <div className="bg-card rounded-2xl shadow-sm p-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Время</h2>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold">{formatDateTime(appointment.startsAt)}</p>
            <p className="text-xs text-muted-foreground">
              До {formatDateTime(appointment.endsAt).split(', ')[1]}
            </p>
          </div>
        </div>
      </div>

      {/* Notes */}
      {appointment.notes && (
        <div className="bg-card rounded-2xl shadow-sm p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Примечания</h2>
          <p className="text-sm">{appointment.notes}</p>
        </div>
      )}

      {/* Actions */}
      {isCancellable && (
        <div className="space-y-3">
          {isCompletable && (
            <button
              id="complete-appointment"
              onClick={handleComplete}
              disabled={completeMutation.isPending}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
            >
              <CheckCircle2 className="h-4 w-4" />
              Завершить визит
            </button>
          )}

          {isCompletable && (
            <button
              id="no-show-appointment"
              onClick={async () => {
                try {
                  await noShowMutation.mutateAsync(appointment.id);
                  toast.success('Отмечено: клиент не пришёл');
                  navigate('/calendar');
                } catch {
                  toast.error('Не удалось обновить статус');
                }
              }}
              disabled={noShowMutation.isPending}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
            >
              <UserX className="h-4 w-4" />
              Клиент не пришёл
            </button>
          )}

          {!showCancelForm ? (
            <button
              id="cancel-appointment"
              onClick={() => setShowCancelForm(true)}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-destructive text-destructive px-4 py-2.5 text-sm font-semibold hover:bg-destructive/5 transition-colors"
            >
              <XCircle className="h-4 w-4" />
              Отменить запись
            </button>
          ) : (
            <div className="bg-card rounded-2xl border border-destructive/30 p-6 space-y-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm font-medium">Причина отмены</p>
              </div>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Опционально..."
                rows={2}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCancelForm(false)}
                  className="flex-1 rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent transition-colors"
                >
                  Нет
                </button>
                <button
                  onClick={handleCancel}
                  disabled={cancelMutation.isPending}
                  className="flex-1 rounded-lg bg-destructive text-white px-4 py-2 text-sm font-semibold hover:bg-destructive/90 transition-colors"
                >
                  Подтвердить
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
