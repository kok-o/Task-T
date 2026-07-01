import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Search, Plus, ChevronRight, Check } from 'lucide-react';
import { format } from 'date-fns';
import {
  useMasters,
  useServices,
  useClients,
  useSlots,
  useCreateAppointment,
  useCreateClient,
  useDebounce,
} from '@/hooks';
import { MasterAvatar } from '@/components/ui/MasterAvatar';
import { formatPrice, formatPhoneNumber, cn } from '@/utils';
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

const STEPS = [
  { id: 1, title: 'Мастер' },
  { id: 2, title: 'Услуга' },
  { id: 3, title: 'Время' },
  { id: 4, title: 'Клиент' },
];

export default function NewAppointmentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  
  const [clientSearch, setClientSearch] = useState('');
  const debouncedClientSearch = useDebounce(clientSearch, 300);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showNewClientForm, setShowNewClientForm] = useState(false);

  const { data: masters = [] } = useMasters();
  const { data: services = [] } = useServices();
  const { data: clients = [] } = useClients(debouncedClientSearch);

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
  const watchedClientId = watch('clientId');

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
      toast.error('Ошибка при создании записи');
    }
  };

  const availableSlots = slots.filter((s: TimeSlot) => s.available);

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const isNextDisabled = () => {
    if (currentStep === 1) return !watchedMasterId;
    if (currentStep === 2) return !watchedServiceId;
    if (currentStep === 3) return !watchedStartsAt;
    if (currentStep === 4) return !watchedClientId;
    return false;
  };

  // Auto-advance on selection
  useEffect(() => {
    if (currentStep === 1 && watchedMasterId) handleNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedMasterId]);

  useEffect(() => {
    if (currentStep === 2 && watchedServiceId) handleNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedServiceId]);

  useEffect(() => {
    if (currentStep === 3 && watchedStartsAt) handleNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedStartsAt]);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => (currentStep === 1 ? navigate(-1) : handleBack())}
          className="p-2.5 rounded-full bg-card shadow-sm hover:shadow hover:-translate-y-0.5 transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Новая запись</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Шаг {currentStep} из 4</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between relative px-2">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-border rounded-full -z-10" />
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full -z-10 transition-all duration-300"
          style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
        />
        {STEPS.map((step) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          return (
            <div key={step.id} className="flex flex-col items-center gap-2 bg-background px-2">
              <div 
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors",
                  isCompleted ? "bg-primary text-primary-foreground" : 
                  isCurrent ? "bg-primary text-primary-foreground ring-4 ring-primary/20" : 
                  "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : step.id}
              </div>
              <span className={cn("text-xs font-medium", isCurrent ? "text-foreground" : "text-muted-foreground")}>
                {step.title}
              </span>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col">
        <div className="bg-card rounded-[24px] border border-border/50 shadow-sm p-6 lg:p-8 flex-1">
          {/* Step 1: Master */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="font-bold text-xl">Выберите мастера</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {masters.map((master) => (
                  <button
                    key={master.id}
                    type="button"
                    onClick={() => setValue('masterId', master.id)}
                    className={cn(
                      "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all hover:-translate-y-1",
                      watchedMasterId === master.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/30 hover:shadow-sm"
                    )}
                  >
                    <MasterAvatar name={master.name} color={master.color} size="lg" />
                    <span className="text-sm font-semibold text-center">{master.name}</span>
                  </button>
                ))}
              </div>
              {errors.masterId && (
                <p className="text-sm text-destructive">{errors.masterId.message}</p>
              )}
            </div>
          )}

          {/* Step 2: Service */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="font-bold text-xl">Выберите услугу</h2>
              <div className="space-y-3">
                {services.map((svc) => (
                  <button
                    key={svc.id}
                    type="button"
                    onClick={() => {
                      setValue('serviceId', svc.id);
                      setValue('startsAt', ''); // reset slot
                    }}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left",
                      watchedServiceId === svc.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/30"
                    )}
                  >
                    <div>
                      <p className="font-semibold">{svc.name}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {svc.durationMinutes} мин
                      </p>
                    </div>
                    <span className="font-bold text-primary text-lg">
                      {formatPrice(svc.price)}
                    </span>
                  </button>
                ))}
              </div>
              {errors.serviceId && (
                <p className="text-sm text-destructive">{errors.serviceId.message}</p>
              )}
            </div>
          )}

          {/* Step 3: Date & Slot */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="font-bold text-xl">Выберите дату и время</h2>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Дата визита</label>
                <input
                  type="date"
                  {...register('date')}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="w-full rounded-xl border-2 border-input bg-background px-4 py-3 font-medium focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              
              {watchedDate && (
                <div className="space-y-3 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Доступное время
                    </label>
                    {slotsLoading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                  </div>
                  
                  {availableSlots.length === 0 && !slotsLoading ? (
                    <div className="p-4 rounded-xl bg-muted/50 text-center text-sm text-muted-foreground border border-border">
                      Нет свободных слотов на выбранную дату
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {availableSlots.map((slot: TimeSlot) => {
                        const timeLabel = format(new Date(slot.startsAt), 'HH:mm');
                        return (
                          <button
                            key={slot.startsAt}
                            type="button"
                            onClick={() => setValue('startsAt', slot.startsAt)}
                            className={cn(
                              "py-3 rounded-xl font-bold border-2 transition-all",
                              watchedStartsAt === slot.startsAt
                                ? "border-primary bg-primary text-primary-foreground shadow-md scale-105"
                                : "border-border hover:border-primary/50 text-foreground"
                            )}
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
                <p className="text-sm text-destructive">{errors.startsAt.message}</p>
              )}
            </div>
          )}

          {/* Step 4: Client & Submit */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="font-bold text-xl">Детали записи</h2>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Клиент</label>
                {selectedClient ? (
                  <div className="flex items-center justify-between p-4 bg-primary/5 border-2 border-primary rounded-xl">
                    <div>
                      <p className="font-bold">{selectedClient.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedClient.phone}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedClient(null);
                        setValue('clientId', '');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-background text-xs font-semibold text-muted-foreground hover:text-destructive border border-border shadow-sm transition-colors"
                    >
                      Изменить
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Поиск по имени или телефону..."
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        className="w-full rounded-xl border-2 border-input bg-background pl-11 pr-4 py-3 font-medium focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    
                    {clients.length > 0 && (
                      <div className="border border-border rounded-xl divide-y divide-border overflow-hidden bg-card shadow-sm max-h-60 overflow-y-auto">
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
                            <p className="font-semibold text-sm">{client.name}</p>
                            <p className="text-sm text-muted-foreground">{client.phone}</p>
                          </button>
                        ))}
                      </div>
                    )}
                    
                    <button
                      type="button"
                      onClick={() => setShowNewClientForm(!showNewClientForm)}
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed border-primary/40 text-primary font-medium hover:bg-primary/5 hover:border-primary/60 transition-colors"
                    >
                      <Plus className="h-5 w-5" />
                      Создать нового клиента
                    </button>

                    {showNewClientForm && (
                      <div className="border border-border rounded-xl p-5 space-y-4 bg-muted/20">
                        <p className="font-bold text-sm">Добавить клиента</p>
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <input
                              type="text"
                              placeholder="Имя клиента"
                              {...regClient('name')}
                              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                            />
                            {clientErrors.name && (
                              <p className="text-xs text-destructive">{clientErrors.name.message}</p>
                            )}
                          </div>
                          
                          <div className="space-y-1">
                            <input
                              type="tel"
                              placeholder="Телефон"
                              {...regClient('phone')}
                              onChange={(e) => {
                                const formatted = formatPhoneNumber(e.target.value);
                                regClient('phone').onChange(e); 
                                e.target.value = formatted;
                              }}
                              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                            />
                            {clientErrors.phone && (
                              <p className="text-xs text-destructive">{clientErrors.phone.message}</p>
                            )}
                          </div>
                          
                          <button
                            type="button"
                            onClick={handleClientSubmit(handleCreateClient)}
                            disabled={createClient.isPending}
                            className="w-full flex items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-3 text-sm font-semibold text-background hover:opacity-90 transition-opacity disabled:opacity-60"
                          >
                            {createClient.isPending && (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                            Сохранить клиента
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {errors.clientId && (
                  <p className="text-sm text-destructive mt-1">{errors.clientId.message}</p>
                )}
              </div>

              <div className="space-y-1.5 pt-4">
                <label className="text-sm font-medium text-muted-foreground">
                  Примечания (необязательно)
                </label>
                <textarea
                  {...register('notes')}
                  placeholder="Дополнительные пожелания..."
                  rows={3}
                  className="w-full rounded-xl border-2 border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                />
              </div>

              {createAppointment.error && (
                <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive font-medium">
                  {(createAppointment.error as any)?.response?.data?.error ||
                    'Не удалось создать запись. Возможно, время уже занято.'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="mt-6 flex items-center gap-4 justify-between bg-card p-4 rounded-[24px] border border-border/50 shadow-sm">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="px-6 py-3 rounded-xl font-semibold bg-muted hover:bg-muted/80 transition-colors"
            >
              Назад
            </button>
          ) : (
            <div /> // Spacer
          )}
          
          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={isNextDisabled()}
              className="px-8 py-3 rounded-xl font-bold bg-foreground text-background flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Далее
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              id="submit-appointment"
              type="submit"
              disabled={isSubmitting || createAppointment.isPending || !watchedClientId}
              className="flex-1 max-w-[200px] flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground shadow-[0_4px_14px_rgba(212,47,98,0.35)] hover:scale-105 transition-transform disabled:opacity-60 disabled:pointer-events-none disabled:transform-none"
            >
              {(isSubmitting || createAppointment.isPending) && (
                <Loader2 className="h-5 w-5 animate-spin" />
              )}
              Создать запись
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
