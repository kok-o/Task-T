import { Bell, Smartphone, Mail } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Настройки</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Параметры студии и уведомлений</p>
      </div>

      {/* Notification channels */}
      <div className="bg-card rounded-3xl border border-border/50 shadow-sm p-6 lg:p-8 space-y-6">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-lg">Уведомления</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Настройте каналы доставки напоминаний клиентам и мастерам.
        </p>

        {/* WhatsApp Setup */}
        <div className="space-y-4">
          <div className="flex flex-col p-5 rounded-2xl border border-border/50 bg-background/50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <Smartphone className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium">WhatsApp</p>
                  <p className="text-xs text-muted-foreground">Интеграция с WhatsApp Web</p>
                </div>
              </div>
              <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full font-medium">
                Скоро
              </span>
            </div>

            {/* Placeholder */}
            <div className="pt-4 border-t border-border/50 flex flex-col items-center justify-center space-y-3">
              <p className="text-sm font-medium text-muted-foreground text-center py-4">
                Тут будет WhatsApp интеграция (v2)
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-background/50">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-xs text-muted-foreground">Требуется EMAIL_USER / EMAIL_PASS в .env</p>
              </div>
            </div>
            <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">Резерв</span>
          </div>
        </div>
      </div>

      {/* Reminders */}
      <div className="bg-card rounded-2xl shadow-sm p-6 lg:p-8 space-y-4">
        <h2 className="font-semibold text-lg">Напоминания клиентам</h2>
        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <span>Моментально</span>
            <span className="font-medium text-foreground">При создании записи</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <span>Первое напоминание</span>
            <span className="font-medium text-foreground">За 24 часа</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span>Второе напоминание</span>
            <span className="font-medium text-foreground">За 2 часа</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground pt-2">
          Крон-задача запускается каждые 15 минут для рассылки напоминаний.
        </p>
      </div>
    </div>
  );
}
