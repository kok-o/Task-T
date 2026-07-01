import { Loader2 } from 'lucide-react';
import type { Master } from '@/types';

export function MasterForm({
  form,
  setForm,
  editing,
  COLORS,
  resetForm,
  handleSaveMaster,
  isPending,
}: any) {
  return (
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
          {COLORS.map((c: string) => (
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
          disabled={isPending}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-opacity"
        >
          {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
          Далее →
        </button>
      </div>
    </form>
  );
}
