import { Clock, Loader2 } from 'lucide-react';
import { DAY_NAMES_FULL } from '@/utils';

export function MasterSchedule({
  schedule,
  toggleDay,
  setDayTime,
  handleSaveSchedule,
  isPending,
  onBack,
}: any) {
  const orderedDays = [1, 2, 3, 4, 5, 6, 0];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Выберите рабочие дни и укажите часы работы. Слоты для записи генерируются на основе этого расписания.
      </p>

      <div className="space-y-2">
        {orderedDays.map((dayOfWeek) => {
          const daySchedule = schedule.find((d: any) => d.dayOfWeek === dayOfWeek)!;
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
              <span className="text-sm font-medium w-20 flex-shrink-0">
                {DAY_NAMES_FULL[dayOfWeek]}
              </span>
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
      <p className="text-xs text-muted-foreground text-center">
        Рабочих дней: {schedule.filter((d: any) => !d.isDayOff).length} из 7
      </p>
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-xl border border-border px-5 py-3 text-sm hover:bg-accent transition-colors"
        >
          ← Назад
        </button>
        <button
          type="button"
          onClick={handleSaveSchedule}
          disabled={isPending || schedule.every((d: any) => d.isDayOff)}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-opacity"
        >
          {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
          Сохранить расписание
        </button>
      </div>
    </div>
  );
}
