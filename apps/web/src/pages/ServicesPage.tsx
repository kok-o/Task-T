import { useState } from 'react';
import { Plus, Pencil, Clock, Banknote } from 'lucide-react';
import { useServices, useCreateService, useUpdateService } from '@/hooks';
import { formatPrice } from '@/utils';
import { toast } from 'sonner';
import type { Service } from '@/types';

export default function ServicesPage() {
  const { data: services = [], isLoading } = useServices();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState({ name: '', durationMinutes: 60, price: 0 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateService.mutateAsync({ id: editing.id, data: form });
        toast.success('Услуга обновлена');
      } else {
        await createService.mutateAsync(form);
        toast.success('Услуга добавлена');
      }
      setShowForm(false);
      setEditing(null);
      setForm({ name: '', durationMinutes: 60, price: 0 });
    } catch (err) {
      toast.error('Произошла ошибка при сохранении');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Услуги</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Прейскурант студии</p>
        </div>
        <button
          id="add-service-btn"
          onClick={() => { setShowForm(true); setEditing(null); }}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 hover:-translate-y-0.5 active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Добавить</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-card rounded-3xl border border-border/50 shadow-sm p-6 lg:p-8 space-y-5">
          <h2 className="font-semibold">{editing ? 'Редактировать услугу' : 'Новая услуга'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Название</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Длительность (мин)</label>
                <input
                  type="number"
                  required min={15} max={480} step={15}
                  value={form.durationMinutes}
                  onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Цена (₸)</label>
                <input
                  type="number"
                  required min={0}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 rounded-xl border border-border px-5 py-3 text-sm hover:bg-accent transition-colors">
                Отмена
              </button>
              <button type="submit" disabled={createService.isPending || updateService.isPending}
                className="flex-1 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
                Сохранить
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {services.map((svc: Service) => (
              <div key={svc.id} className="flex items-center justify-between px-6 py-5 hover:bg-accent/30 transition-colors">
                <div>
                  <p className="font-medium text-sm">{svc.name}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> {svc.durationMinutes} мин
                    </span>
                    <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                      <Banknote className="h-3 w-3" /> {formatPrice(svc.price)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEditing(svc);
                    setForm({ name: svc.name, durationMinutes: svc.durationMinutes, price: Number(svc.price) });
                    setShowForm(true);
                  }}
                  className="p-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
