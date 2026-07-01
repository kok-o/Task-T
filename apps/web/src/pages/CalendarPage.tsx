import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Calendar,
  dateFnsLocalizer,
  type View,
  type SlotInfo,
} from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X, Clock, User, Scissors } from 'lucide-react';
import { useAppointments, useMasters } from '@/hooks';
import { MasterAvatar } from '@/components/ui/MasterAvatar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { cn, formatTime, formatPrice } from '@/utils';
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

function CustomToolbar({ onNavigate, label, onView, view }: any) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold capitalize">{label}</h2>
        <div className="flex bg-muted/50 p-1 rounded-lg">
          <button
            onClick={() => onNavigate('PREV')}
            className="p-1 hover:bg-card rounded-md transition-colors text-muted-foreground hover:text-foreground hover:shadow-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => onNavigate('TODAY')}
            className="px-3 py-1 text-sm font-medium hover:bg-card rounded-md transition-colors text-muted-foreground hover:text-foreground hover:shadow-sm"
          >
            Сегодня
          </button>
          <button
            onClick={() => onNavigate('NEXT')}
            className="p-1 hover:bg-card rounded-md transition-colors text-muted-foreground hover:text-foreground hover:shadow-sm"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="flex bg-muted/50 p-1 rounded-lg">
        <button
          onClick={() => onView('week')}
          className={cn(
            'px-4 py-1.5 text-sm font-medium rounded-md transition-all',
            view === 'week'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Неделя
        </button>
        <button
          onClick={() => onView('day')}
          className={cn(
            'px-4 py-1.5 text-sm font-medium rounded-md transition-all',
            view === 'day'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          День
        </button>
      </div>
    </div>
  );
}

function CustomEvent({ event }: any) {
  return (
    <div className="p-1.5 h-full w-full flex flex-col justify-start">
      <div className="font-semibold text-xs leading-tight mb-0.5 truncate">
        {event.resource.client.name}
      </div>
      <div className="text-[10px] leading-tight opacity-90 truncate">
        {event.resource.service.name}
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>('week');
  const [date, setDate] = useState(new Date());
  const [selectedMasters, setSelectedMasters] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setView('day');
      } else {
        setView('week');
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { data: masters = [] } = useMasters();
  const { data: appointments = [] } = useAppointments();

  const events: CalendarEvent[] = useMemo(() => {
    return appointments
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
  }, [appointments, selectedMasters]);

  const toggleMaster = (id: string) => {
    setSelectedMasters((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleSelectEvent = useCallback(
    (event: CalendarEvent) => {
      setSelectedEvent(event);
    },
    []
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
    <div className="relative h-[calc(100vh-8rem)] flex flex-col space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Календарь</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Расписание всех мастеров</p>
      </div>

      {/* Master Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">Фильтр:</span>
        <button
          onClick={() => setSelectedMasters([])}
          className={cn(
            'px-4 py-1.5 rounded-full text-xs font-medium transition-all',
            selectedMasters.length === 0
              ? 'bg-foreground text-background shadow-sm'
              : 'bg-card text-muted-foreground border border-border hover:border-foreground/50'
          )}
        >
          Все мастера
        </button>
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
      <div className="flex-1 bg-card rounded-[24px] border border-border/50 shadow-sm p-4 sm:p-6 overflow-hidden">
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
          components={{
            toolbar: CustomToolbar,
            event: CustomEvent,
          }}
          eventPropGetter={(event: CalendarEvent) => ({
            style: {
              backgroundColor: event.color,
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: 0,
            },
          })}
          formats={{
            timeGutterFormat: 'HH:mm',
            eventTimeRangeFormat: ({ start, end }) =>
              `${format(start, 'HH:mm')} – ${format(end, 'HH:mm')}`,
          }}
        />
      </div>

      {/* Event Drawer Overlay */}
      {selectedEvent && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm animate-in fade-in transition-opacity"
            onClick={() => setSelectedEvent(null)}
          />
          <div className="fixed top-0 right-0 z-50 w-full max-w-sm h-full bg-card shadow-2xl border-l border-border/50 p-6 flex flex-col animate-in slide-in-from-right transition-transform">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold">Детали записи</h2>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6 flex-1">
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: selectedEvent.color }}
                >
                  {selectedEvent.resource.client.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold">{selectedEvent.resource.client.name}</h3>
                  <p className="text-muted-foreground">{selectedEvent.resource.client.phone}</p>
                </div>
              </div>

              <div className="space-y-4 py-6 border-y border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {format(selectedEvent.start, 'd MMMM yyyy')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(selectedEvent.resource.startsAt)} - {formatTime(selectedEvent.resource.endsAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Scissors className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{selectedEvent.resource.service.name}</p>
                    <p className="text-xs text-muted-foreground">{formatPrice(selectedEvent.resource.service.price)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{selectedEvent.resource.master.name}</p>
                    <p className="text-xs text-muted-foreground">Мастер</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <StatusBadge status={selectedEvent.resource.status} />
              </div>
            </div>

            <div className="pt-6 border-t border-border/50 mt-auto">
              <Link
                to={`/appointments/${selectedEvent.id}`}
                className="w-full flex items-center justify-center bg-primary text-primary-foreground py-3 px-4 rounded-xl font-semibold shadow-sm hover:opacity-90 transition-opacity"
              >
                Управление записью
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
