import { Loader2, Pencil, Trash2 } from 'lucide-react';
import { MasterAvatar } from '@/components/ui/MasterAvatar';
import { DAY_NAMES } from '@/utils';
import type { Master } from '@/types';

export function MasterList({
  masters,
  isLoading,
  onEdit,
  onDelete,
}: {
  masters: Master[];
  isLoading: boolean;
  onEdit: (master: Master) => void;
  onDelete: (master: Master) => void;
}) {
  return (
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
                    onClick={() => onEdit(master)}
                    className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(master)}
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
  );
}
