import { useState } from 'react';
import { Plus, Pencil, Clock, CheckCircle2, Trash2 } from 'lucide-react';
import { useMasters, useCreateMaster, useUpdateMaster, useUpdateMasterSchedule, useDeleteMaster } from '@/hooks';
import { MasterAvatar } from '@/components/ui/MasterAvatar';
import { DAY_NAMES, DAY_NAMES_FULL } from '@/utils';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { Master, WorkSchedule } from '@/types';

const COLORS = ['#FF6B9D', '#A78BFA', '#34D399', '#60A5FA', '#FB923C', '#F472B6'];

// Default schedule: Mon–Sat 09:00–20:00, Sun day-off
const DEFAULT_SCHEDULE = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
  dayOfWeek: day,
  startTime: '09:00',
  endTime: '20:00',
  isDayOff: day === 0, // Sunday off by default
}));

type ScheduleDay = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isDayOff: boolean;
};

export default function MastersPage() {
  const { data: masters = [], isLoading } = useMasters();
  const createMaster = useCreateMaster();
  const updateMaster = useUpdateMaster();
  const updateSchedule = useUpdateMasterSchedule();
  const deleteMaster = useDeleteMaster();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Master | null>(null);
  const [step, setStep] = useState<1 | 2>(1); // 1=basic info, 2=schedule

  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', color: COLORS[0] });
  const [schedule, setSchedule] = useState<ScheduleDay[]>(DEFAULT_SCHEDULE);
  const [createdMasterId, setCreatedMasterId] = useState<string | null>(null);

  const resetForm = () => {
    setForm({ name: '', phone: '', email: '', password: '', color: COLORS[0] });
    setSchedule(DEFAULT_SCHEDULE);
    setEditing(null);
    setCreatedMasterId(null);
    setStep(1);
    setShowForm(false);
  };

  // Step 1: save master basic info
  const handleSaveMaster = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateMaster.mutateAsync({ id: editing.id, data: form });
        setCreatedMasterId(editing.id);
        toast.success('Основная информация сохранена');
      } else {
        const newMaster = await createMaster.mutateAsync(form);
        setCreatedMasterId(newMaster.id);
        toast.success('Мастер создан — теперь настройте расписание');
      }
      setStep(2);
    } catch {
      toast.error('Ошибка при сохранении мастера');
    }
  };

  // Step 2: save schedule
  const handleSaveSchedule = async () => {
    if (!createdMasterId) return;
    try {
      await updateSchedule.mutateAsync({ masterId: createdMasterId, schedule });
      toast.success('Расписание сохранено');
      resetForm();
    } catch {
      toast.error('Ошибка при сохранении расписания');
    }
  };

  const toggleDay = (dayOfWeek: number) => {
    setSchedule((prev) =>
      prev.map((d) =>
        d.dayOfWeek === dayOfWeek ? { ...d, isDayOff: !d.isDayOff } : d
      )
    );
  };

  const setDayTime = (dayOfWeek: number, field: 'startTime' | 'endTime', value: string) => {
    setSchedule((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, [field]: value } : d))
    );
  };

  // Order: Mon Tue Wed Thu Fri Sat Sun
  const orderedDays = [1, 2, 3, 4, 5, 6, 0];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Мастера</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{masters.length} мастеров</p>
        </div>
        <button
          id="add-master-btn"
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 hover:-translate-y-0.5 active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Добавить</span>
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-card rounded-3xl border border-border/50 shadow-sm p-6 lg:p-8 space-y-6">
          {/* Step indicator */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 text-sm font-medium ${step === 1 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 1 ? 'bg-primary text-primary-foreground' : step > 1 ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                {step > 1 ? <CheckCircle2 className="h-3.5 w-3.5" /> : '1'}
              </div>
              Основная информация
            </div>
            <div className="flex-1 h-px bg-border" />
            <div className={`flex items-center gap-2 text-sm font-medium ${step === 2 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                2
              </div>
              Рабочее расписание
            </div>
          </div>

          {/* ── Step 1: Basic info ── */}
          {step === 1 && (
            <form onSubmit={handleSaveMaster} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Имя *</label>
                <input
                  type="text"
                  required
                  placeholder="Имя мастера"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Телефон</label>
                <input
                  type="tel"
                  placeholder="+7 (XXX) XXX-XX-XX"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {!editing && (
                <div className="border-t border-border pt-4 mt-2">
                  <p className="text-sm font-semibold mb-3">Доступ в систему (для входа мастера)</p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Email *</label>
                      <input
                        type="email"
                        required={!editing}
                        placeholder="master@studio.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Пароль *</label>
                      <input
                        type="password"
                        required={!editing}
                        minLength={6}
                        placeholder="Минимум 6 символов"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t border-border pt-4 mt-2">
                <label className="block text-sm font-medium mb-2">Цвет в календаре</label>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm({ ...form, color: c })}
                      className={`h-8 w-8 rounded-full transition-transform ${form.color === c ? 'scale-125 ring-2 ring-offset-2 ring-primary' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 rounded-xl border border-border px-5 py-3 text-sm hover:bg-accent transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={createMaster.isPending || updateMaster.isPending}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-opacity"
                >
                  {(createMaster.isPending || updateMaster.isPending) && (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  )}
                  Далее →
                </button>
              </div>
            </form>
          )}

          {/* ── Step 2: Work schedule ── */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Выберите рабочие дни и укажите часы работы. Слоты для записи генерируются на основе этого расписания.
              </p>

              <div className="space-y-2">
                {orderedDays.map((dayOfWeek) => {
                  const daySchedule = schedule.find((d) => d.dayOfWeek === dayOfWeek)!;
                  const isWorking = !daySchedule.isDayOff;
                  return (
                    <div
                      key={dayOfWeek}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                        isWorking
                          ? 'border-primary/30 bg-primary/5'
                          : 'border-border bg-transparent opacity-60'
                      }`}
                    >
                      {/* Toggle */}
                      <button
                        type="button"
                        onClick={() => toggleDay(dayOfWeek)}
                        className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
                          isWorking ? 'bg-primary' : 'bg-muted-foreground/30'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 h-4 w-4 bg-white rounded-full shadow transition-transform ${
                            isWorking ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>

                      {/* Day name */}
                      <span className="text-sm font-medium w-20 flex-shrink-0">
                        {DAY_NAMES_FULL[dayOfWeek]}
                      </span>

                      {/* Time inputs */}
                      {isWorking ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <input
                            type="time"
                            value={daySchedule.startTime}
                            onChange={(e) => setDayTime(dayOfWeek, 'startTime', e.target.value)}
                            className="rounded-lg border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-24"
                          />
                          <span className="text-muted-foreground text-sm">—</span>
                          <input
                            type="time"
                            value={daySchedule.endTime}
                            onChange={(e) => setDayTime(dayOfWeek, 'endTime', e.target.value)}
                            className="rounded-lg border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-24"
                          />
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground flex-1">Выходной</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Working days count info */}
              <p className="text-xs text-muted-foreground text-center">
                Рабочих дней: {schedule.filter((d) => !d.isDayOff).length} из 7
              </p>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-xl border border-border px-5 py-3 text-sm hover:bg-accent transition-colors"
                >
                  ← Назад
                </button>
                <button
                  type="button"
                  onClick={handleSaveSchedule}
                  disabled={updateSchedule.isPending || schedule.every((d) => d.isDayOff)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-opacity"
                >
                  {updateSchedule.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  Сохранить расписание
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Master list */}
      <div className="bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : masters.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            Нет мастеров. Добавьте первого!
          </p>
        ) : (
          <div className="divide-y divide-border">
            {masters.map((master: Master) => {
              const workingDays = master.workSchedules?.filter((s) => !s.isDayOff) ?? [];
              const hasSchedule = workingDays.length > 0;
              return (
                <div key={master.id} className="flex items-center justify-between px-6 py-5 hover:bg-accent/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <MasterAvatar name={master.name} color={master.color} size="md" />
                    <div>
                      <p className="font-medium text-sm">{master.name}</p>
                      <p className="text-xs text-muted-foreground">{master.phone || 'Нет телефона'}</p>
                      {hasSchedule ? (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          <span className="font-medium text-green-600 dark:text-green-400">
                            {workingDays.map((s) => DAY_NAMES[s.dayOfWeek]).join(', ')}
                          </span>
                          {' · '}
                          {workingDays[0]?.startTime}–{workingDays[0]?.endTime}
                        </p>
                      ) : (
                        <p className="text-xs text-orange-500 font-medium mt-0.5">
                          ⚠ Расписание не настроено — запись невозможна
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <button
                      onClick={() => {
                        setEditing(master);
                        setForm({ name: master.name, phone: master.phone || '', email: '', password: '', color: master.color });
                        if (master.workSchedules && master.workSchedules.length > 0) {
                          const existingSchedule = [0, 1, 2, 3, 4, 5, 6].map((day) => {
                            const found = master.workSchedules!.find((s) => s.dayOfWeek === day);
                            return found
                              ? { dayOfWeek: day, startTime: found.startTime, endTime: found.endTime, isDayOff: found.isDayOff }
                              : { dayOfWeek: day, startTime: '09:00', endTime: '20:00', isDayOff: true };
                          });
                          setSchedule(existingSchedule);
                        } else {
                          setSchedule(DEFAULT_SCHEDULE);
                        }
                        setCreatedMasterId(master.id);
                        setStep(1);
                        setShowForm(true);
                      }}
                      className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Вы уверены, что хотите удалить этого мастера?')) {
                          deleteMaster.mutate(master.id, {
                            onSuccess: () => toast.success('Мастер удален'),
                            onError: () => toast.error('Ошибка при удалении'),
                          });
                        }
                      }}
                      className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors ml-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
