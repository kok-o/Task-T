import { useState, useCallback, useEffect } from 'react';
import {
  Calendar,
  dateFnsLocalizer,
  type View,
  type SlotInfo,
} from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useAppointments, useMasters } from '@/hooks';
import { MasterAvatar } from '@/components/ui/MasterAvatar';
import { cn } from '@/utils';
import type { Appointment, Master } from '@/types';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales: { ru },
});

const messages = {
  next: 'Следующий',
  previous: 'Предыдущий',
  today: 'Сегодня',
  month: 'Месяц',
  week: 'Неделя',
  day: 'День',
  agenda: 'Список',
  date: 'Дата',
  time: 'Время',
  event: 'Запись',
  noEventsInRange: 'Нет записей',
  allDay: 'Весь день',
};

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Appointment;
  color: string;
}

export default function CalendarPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>('week');
  const [date, setDate] = useState(new Date());
  const [selectedMasters, setSelectedMasters] = useState<string[]>([]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setView('day');
      } else {
        setView('week');
      }
    };
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { data: masters = [] } = useMasters();
  const { data: appointments = [] } = useAppointments();

  const events: CalendarEvent[] = appointments
    .filter((a) =>
      selectedMasters.length === 0 || selectedMasters.includes(a.masterId)
    )
    .map((a) => ({
      id: a.id,
      title: `${a.client.name} · ${a.service.name}`,
      start: new Date(a.startsAt),
      end: new Date(a.endsAt),
      resource: a,
      color: a.master.color,
    }));

  const toggleMaster = (id: string) => {
    setSelectedMasters((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleSelectEvent = useCallback(
    (event: CalendarEvent) => {
      navigate(`/appointments/${event.id}`);
    },
    [navigate]
  );

  const handleSelectSlot = useCallback(
    (slot: SlotInfo) => {
      const dateStr = format(slot.start, 'yyyy-MM-dd');
      const timeStr = format(slot.start, 'HH:mm');
      navigate(`/appointments/new?date=${dateStr}&time=${timeStr}`);
    },
    [navigate]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Календарь</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Расписание всех мастеров</p>
      </div>

      {/* Master Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">Фильтр:</span>
        {masters.map((master: Master) => (
          <button
            key={master.id}
            id={`filter-master-${master.id}`}
            onClick={() => toggleMaster(master.id)}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-all',
              selectedMasters.includes(master.id)
                ? 'text-white border-transparent shadow-sm'
                : 'bg-card border-border text-muted-foreground hover:text-foreground'
            )}
            style={
              selectedMasters.includes(master.id)
                ? { backgroundColor: master.color, borderColor: master.color }
                : {}
            }
          >
            <MasterAvatar name={master.name} color={master.color} size="sm" />
            {master.name}
          </button>
        ))}
      </div>

      {/* Calendar */}
      <div className="bg-card rounded-3xl border border-border/50 shadow-sm p-2 sm:p-4 overflow-hidden" style={{ height: 'calc(100vh - 240px)', minHeight: '500px' }}>
        <Calendar
          localizer={localizer}
          culture="ru"
          messages={messages}
          events={events}
          view={view}
          date={date}
          onView={setView}
          onNavigate={setDate}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          step={15}
          timeslots={4}
          min={new Date(0, 0, 0, 8, 0)}
          max={new Date(0, 0, 0, 21, 0)}
          eventPropGetter={(event: CalendarEvent) => ({
            style: {
              backgroundColor: event.color,
              border: 'none',
            },
          })}
          formats={{
            timeGutterFormat: 'HH:mm',
            eventTimeRangeFormat: ({ start, end }) =>
              `${format(start, 'HH:mm')} – ${format(end, 'HH:mm')}`,
          }}
        />
      </div>
    </div>
  );
}
