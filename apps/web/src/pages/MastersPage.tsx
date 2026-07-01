import { useState } from 'react';
import { Plus, CheckCircle2 } from 'lucide-react';
import { useMasters, useCreateMaster, useUpdateMaster, useUpdateMasterSchedule, useDeleteMaster } from '@/hooks';
import { toast } from 'sonner';
import type { Master } from '@/types';
import { MasterForm } from '@/components/masters/MasterForm';
import { MasterSchedule } from '@/components/masters/MasterSchedule';
import { MasterList } from '@/components/masters/MasterList';

const COLORS = ['#FF6B9D', '#A78BFA', '#34D399', '#60A5FA', '#FB923C', '#F472B6'];

const DEFAULT_SCHEDULE = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
  dayOfWeek: day,
  startTime: '09:00',
  endTime: '20:00',
  isDayOff: day === 0,
}));

export default function MastersPage() {
  const { data: masters = [], isLoading } = useMasters();
  const createMaster = useCreateMaster();
  const updateMaster = useUpdateMaster();
  const updateSchedule = useUpdateMasterSchedule();
  const deleteMaster = useDeleteMaster();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Master | null>(null);
  const [step, setStep] = useState<1 | 2>(1);

  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', color: COLORS[0] });
  const [schedule, setSchedule] = useState<any[]>(DEFAULT_SCHEDULE);
  const [createdMasterId, setCreatedMasterId] = useState<string | null>(null);

  const resetForm = () => {
    setForm({ name: '', phone: '', email: '', password: '', color: COLORS[0] });
    setSchedule(DEFAULT_SCHEDULE);
    setEditing(null);
    setCreatedMasterId(null);
    setStep(1);
    setShowForm(false);
  };

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
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, isDayOff: !d.isDayOff } : d))
    );
  };

  const setDayTime = (dayOfWeek: number, field: 'startTime' | 'endTime', value: string) => {
    setSchedule((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, [field]: value } : d))
    );
  };

  const handleEdit = (master: Master) => {
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
  };

  const handleDelete = (master: Master) => {
    if (confirm('Вы уверены, что хотите удалить этого мастера?')) {
      deleteMaster.mutate(master.id, {
        onSuccess: () => toast.success('Мастер удален'),
        onError: () => toast.error('Ошибка при удалении'),
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Мастера</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{masters.length} мастеров</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 hover:-translate-y-0.5 active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Добавить</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-card rounded-[24px] border border-border/50 shadow-sm p-6 lg:p-8 space-y-6">
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

          {step === 1 ? (
            <MasterForm
              form={form}
              setForm={setForm}
              editing={editing}
              COLORS={COLORS}
              resetForm={resetForm}
              handleSaveMaster={handleSaveMaster}
              isPending={createMaster.isPending || updateMaster.isPending}
            />
          ) : (
            <MasterSchedule
              schedule={schedule}
              toggleDay={toggleDay}
              setDayTime={setDayTime}
              handleSaveSchedule={handleSaveSchedule}
              isPending={updateSchedule.isPending}
              onBack={() => setStep(1)}
            />
          )}
        </div>
      )}

      <MasterList
        masters={masters}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
