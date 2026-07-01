import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Phone, X } from 'lucide-react';
import { useClients, useCreateClient, useDebounce } from '@/hooks';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatPhoneNumber } from '@/utils';

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const { data: clients = [], isLoading } = useClients(debouncedSearch || undefined);
  const createClient = useCreateClient();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '' });

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      toast.error('Введите имя и телефон');
      return;
    }
    try {
      await createClient.mutateAsync({
        name: form.name,
        phone: form.phone,
        email: form.email || undefined,
        notes: form.notes || undefined,
      });
      toast.success('Клиент добавлен');
      setShowForm(false);
      setForm({ name: '', phone: '', email: '', notes: '' });
    } catch (error: any) {
      const errorMsg = error?.response?.data?.error || 'Не удалось создать клиента';
      toast.error(errorMsg);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Клиенты</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{clients.length} клиентов</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-semibold hover:bg-accent hover:-translate-y-0.5 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Новый клиент</span>
          </button>
          <Link
            to="/appointments/new"
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 hover:-translate-y-0.5 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            Запись
          </Link>
        </div>
      </div>

      {/* New Client Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-2xl shadow-xl p-6 w-full max-w-md mx-4 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">Новый клиент</h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Имя *</label>
                <input
                  required
                  type="text"
                  placeholder="Имя клиента"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Телефон *</label>
                <input
                  required
                  type="tel"
                  placeholder="+7-XXX-XXX-XX-XX"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: formatPhoneNumber(e.target.value) })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Email (необязательно)</label>
                <input
                  type="email"
                  placeholder="client@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Примечания (необязательно)</label>
                <textarea
                  rows={2}
                  placeholder="Особые пожелания, предпочтения..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={createClient.isPending}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-opacity"
                >
                  {createClient.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          id="client-search"
          type="text"
          placeholder="Поиск по имени или телефону..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl border border-border/50 shadow-sm bg-card pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
        />
      </div>

      <div className="bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : clients.length === 0 ? (
          <p className="px-5 py-8 text-center text-muted-foreground text-sm">
            {search ? 'Клиенты не найдены' : 'Нет клиентов'}
          </p>
        ) : (
          <div className="divide-y divide-border">
            {clients.map((client) => (
              <Link
                key={client.id}
                to={`/clients/${client.id}`}
                className="flex items-center justify-between px-6 py-5 hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                    {client.name[0]}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{client.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {client.phone}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">→</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
