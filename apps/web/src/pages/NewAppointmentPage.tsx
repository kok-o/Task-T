import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Search, Plus } from 'lucide-react';
import { format } from 'date-fns';
import {
  useMasters,
  useServices,
  useClients,
  useSlots,
  useCreateAppointment,
  useCreateClient,
} from '@/hooks';
import { MasterAvatar } from '@/components/ui/MasterAvatar';
import { formatPrice, formatPhoneNumber } from '@/utils';
import type { Client, TimeSlot } from '@/types';

const schema = z.object({
  masterId: z.string().uuid('Выберите мастера'),
  serviceId: z.string().uuid('Выберите услугу'),
  date: z.string().min(1, 'Выберите дату'),
  startsAt: z.string().min(1, 'Выберите время'),
  clientId: z.string().uuid('Выберите клиента'),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const newClientSchema = z.object({
  name: z.string().min(1, 'Введите имя'),
  phone: z.string().min(7, 'Введите телефон'),
});
type NewClientData = z.infer<typeof newClientSchema>;

export default function NewAppointmentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showNewClientForm, setShowNewClientForm] = useState(false);

  const { data: masters = [] } = useMasters();
  const { data: services = [] } = useServices();
  const { data: clients = [] } = useClients(clientSearch);

  const createAppointment = useCreateAppointment();
  const createClient = useCreateClient();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: searchParams.get('date') || '',
    },
  });

  const watchedMasterId = watch('masterId');
  const watchedServiceId = watch('serviceId');
  const watchedDate = watch('date');
  const watchedStartsAt = watch('startsAt');

  const { data: slots = [], isLoading: slotsLoading } = useSlots(
    watchedMasterId,
    watchedDate,
    watchedServiceId
  );

  const {
    register: regClient,
    handleSubmit: handleClientSubmit,
    formState: { errors: clientErrors },
  } = useForm<NewClientData>({ resolver: zodResolver(newClientSchema) });

  const handleCreateClient = async (data: NewClientData) => {
    try {
      const client = await createClient.mutateAsync(data);
      setSelectedClient(client);
      setValue('clientId', client.id);
      setShowNewClientForm(false);
      toast.success('Клиент успешно создан');
    } catch (error: any) {
      const errorMsg = error?.response?.data?.error || 'Не удалось создать клиента';
      toast.error(errorMsg);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      await createAppointment.mutateAsync({
        masterId: data.masterId,
        clientId: data.clientId,
        serviceId: data.serviceId,
        startsAt: data.startsAt,
        notes: data.notes,
      });
      toast.success('Запись успешно создана');
      navigate('/calendar');
    } catch (error) {
      // Error is handled in the UI below via createAppointment.error
      toast.error('Ошибка при создании записи');
    }
  };

  const availableSlots = slots.filter((s: TimeSlot) => s.available);

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-full bg-card shadow-sm hover:shadow hover:-translate-y-0.5 transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Новая запись</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Заполните форму записи</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Step 1: Master */}
        <section className="bg-card rounded-3xl border border-border/50 shadow-sm p-6 lg:p-8 space-y-5">
          <h2 className="font-bold text-base uppercase tracking-wider text-muted-foreground/80">
            1. Выберите мастера
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {masters.map((master) => (
              <button
                key={master.id}
                type="button"
                onClick={() => setValue('masterId', master.id)}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  watchedMasterId === master.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <MasterAvatar name={master.name} color={master.color} size="lg" />
                <span className="text-xs font-medium text-center">{master.name}</span>
              </button>
            ))}
          </div>
          {errors.masterId && (
            <p className="text-xs text-destructive">{errors.masterId.message}</p>
          )}
        </section>

        {/* Step 2: Service */}
        <section className="bg-card rounded-3xl border border-border/50 shadow-sm p-6 lg:p-8 space-y-5">
          <h2 className="font-bold text-base uppercase tracking-wider text-muted-foreground/80">
            2. Выберите услугу
          </h2>
          <div className="space-y-3">
            {services.map((svc) => (
              <button
                key={svc.id}
                type="button"
                onClick={() => {
                  setValue('serviceId', svc.id);
                  setValue('startsAt', ''); // reset slot
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all text-left ${
                  watchedServiceId === svc.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div>
                  <p className="text-sm font-medium">{svc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {svc.durationMinutes} мин
                  </p>
                </div>
                <span className="text-sm font-semibold text-primary">
                  {formatPrice(svc.price)}
                </span>
              </button>
            ))}
          </div>
          {errors.serviceId && (
            <p className="text-xs text-destructive">{errors.serviceId.message}</p>
          )}
        </section>

        {/* Step 3: Date & Slot */}
        <section className="bg-card rounded-3xl border border-border/50 shadow-sm p-6 lg:p-8 space-y-5">
          <h2 className="font-bold text-base uppercase tracking-wider text-muted-foreground/80">
            3. Выберите дату и время
          </h2>
          <div>
            <label className="block text-sm font-medium mb-1.5">Дата</label>
            <input
              type="date"
              {...register('date')}
              min={format(new Date(), 'yyyy-MM-dd')}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          {watchedDate && watchedMasterId && watchedServiceId && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Доступное время
                {slotsLoading && (
                  <Loader2 className="inline h-3 w-3 ml-2 animate-spin" />
                )}
              </label>
              {availableSlots.length === 0 && !slotsLoading ? (
                <p className="text-sm text-muted-foreground">
                  Нет свободных слотов на выбранную дату
                </p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {availableSlots.map((slot: TimeSlot) => {
                    const timeLabel = format(new Date(slot.startsAt), 'HH:mm');
                    return (
                      <button
                        key={slot.startsAt}
                        type="button"
                        onClick={() => setValue('startsAt', slot.startsAt)}
                        className={`py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                          watchedStartsAt === slot.startsAt
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        {timeLabel}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {errors.startsAt && (
            <p className="text-xs text-destructive">{errors.startsAt.message}</p>
          )}
        </section>

        {/* Step 4: Client */}
        <section className="bg-card rounded-3xl border border-border/50 shadow-sm p-6 lg:p-8 space-y-5">
          <h2 className="font-bold text-base uppercase tracking-wider text-muted-foreground/80">
            4. Клиент
          </h2>

          {selectedClient ? (
            <div className="flex items-center justify-between p-3 bg-primary/5 border-2 border-primary rounded-lg">
              <div>
                <p className="font-medium text-sm">{selectedClient.name}</p>
                <p className="text-xs text-muted-foreground">{selectedClient.phone}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedClient(null);
                  setValue('clientId', '');
                }}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                Сменить
              </button>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Поиск по имени или телефону..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              {clients.length > 0 && (
                <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
                  {clients.slice(0, 5).map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => {
                        setSelectedClient(client);
                        setValue('clientId', client.id);
                        setClientSearch('');
                      }}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent text-left transition-colors"
                    >
                      <p className="text-sm font-medium">{client.name}</p>
                      <p className="text-xs text-muted-foreground">{client.phone}</p>
                    </button>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowNewClientForm(!showNewClientForm)}
                className="flex items-center gap-2 text-sm text-primary hover:opacity-80 transition-opacity"
              >
                <Plus className="h-4 w-4" />
                Новый клиент
              </button>
              {showNewClientForm && (
                <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/30">
                  <p className="text-sm font-medium">Добавить клиента</p>
                  {/* NOTE: No nested <form> here — it's inside the outer appointment form.
                       Using a plain div + onClick to avoid invalid HTML nesting. */}
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Имя клиента"
                      {...regClient('name')}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    {clientErrors.name && (
                      <p className="text-xs text-destructive">{clientErrors.name.message}</p>
                    )}
                    <input
                      type="tel"
                      placeholder="Телефон"
                      {...regClient('phone')}
                      onChange={(e) => {
                        const formatted = formatPhoneNumber(e.target.value);
                        regClient('phone').onChange(e); // allow react-hook-form to get event
                        e.target.value = formatted;     // visually update it
                      }}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    {clientErrors.phone && (
                      <p className="text-xs text-destructive">{clientErrors.phone.message}</p>
                    )}
                    <button
                      type="button"
                      onClick={handleClientSubmit(handleCreateClient)}
                      disabled={createClient.isPending}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-60"
                    >
                      {createClient.isPending && (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      )}
                      Добавить
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          {errors.clientId && (
            <p className="text-xs text-destructive">{errors.clientId.message}</p>
          )}
        </section>

        {/* Notes */}
        <section className="bg-card rounded-3xl border border-border/50 shadow-sm p-6 lg:p-8 space-y-5">
          <h2 className="font-bold text-base uppercase tracking-wider text-muted-foreground/80">
            Примечания (необязательно)
          </h2>
          <textarea
            {...register('notes')}
            placeholder="Дополнительные пожелания..."
            rows={3}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </section>

        {/* Error from server */}
        {createAppointment.error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            {(createAppointment.error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
              'Не удалось создать запись. Возможно, время уже занято.'}
          </div>
        )}

        {/* Submit */}
        <button
          id="submit-appointment"
          type="submit"
          disabled={isSubmitting || createAppointment.isPending}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-4 text-base font-semibold text-primary-foreground shadow-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {(isSubmitting || createAppointment.isPending) && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          Создать запись
        </button>
      </form>
    </div>
  );
}
