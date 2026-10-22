import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { useUIStore } from '@/stores/uiStore';
import { addAndNotify, getAll, subscribe } from '@/lib/db';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { CalendarEvent } from '@/types';

export function MarketingCalendar() {
  const { setCurrentPageTitle, showToast } = useUIStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [events, setEvents] = useState(() => getAll('calendarEvents') as CalendarEvent[]);
  const [eventDraft, setEventDraft] = useState({ title: '', type: 'social' as CalendarEvent['type'], startDate: '', endDate: '', description: '' });

  useEffect(() => { setCurrentPageTitle('Calendrier Éditorial'); }, [setCurrentPageTitle]);
  useEffect(() => subscribe('calendarEvents', () => setEvents([...(getAll('calendarEvents') as CalendarEvent[])])), []);

  const openEventForm = (date = selectedDate ?? new Date()) => {
    const start = new Date(date);
    start.setHours(9, 0, 0, 0);
    const end = new Date(start);
    end.setHours(end.getHours() + 1);
    const toLocalInput = (date: Date) => {
      const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
      return local.toISOString().slice(0, 16);
    };
    setEventDraft({ title: '', type: 'social', startDate: toLocalInput(start), endDate: toLocalInput(end), description: '' });
    setShowEventForm(true);
  };

  const saveEvent = () => {
    if (!eventDraft.title.trim() || !eventDraft.startDate || !eventDraft.endDate) {
      showToast('Renseignez le titre et les deux dates.', 'error');
      return;
    }
    const start = new Date(eventDraft.startDate);
    const end = new Date(eventDraft.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
      showToast('La date de fin doit être postérieure à la date de début.', 'error');
      return;
    }
    addAndNotify('calendarEvents', {
      id: `evt-${crypto.randomUUID()}`,
      title: eventDraft.title.trim(),
      type: eventDraft.type,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      description: eventDraft.description.trim(),
      assignees: [],
      color: eventDraft.type === 'meeting' ? '#1F7A63' : '#1FB472',
    });
    setCurrentDate(start);
    setSelectedDate(start);
    setShowEventForm(false);
    showToast('Événement créé.', 'success');
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const getEventsForDay = (date: Date) => {
    return events.filter(e => {
      const start = new Date(e.startDate);
      const end = new Date(e.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return date >= start && date <= end;
    });
  };

  const selectedEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 rounded-lg hover:bg-white/5">
            <ChevronLeft size={18} className="text-[var(--text-muted)]" />
          </button>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] min-w-[200px] text-center">
            {format(currentDate, 'MMMM yyyy', { locale: fr })}
          </h2>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 rounded-lg hover:bg-white/5">
            <ChevronRight size={18} className="text-[var(--text-muted)]" />
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-xs bg-[var(--bg-elevated)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            Aujourd&apos;hui
          </button>
        </div>
        <button onClick={() => { const today = new Date(); setSelectedDate(today); openEventForm(today); }} className="btn-primary h-9"><Plus size={16} /> Événement</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Calendar Grid */}
        <GlassCard className="lg:col-span-3">
          <div className="p-4">
            {/* Week day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map(d => (
                <div key={d} className="text-center text-xs text-[var(--text-muted)] font-medium uppercase py-2">{d}</div>
              ))}
            </div>
            {/* Days */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((d, i) => {
                const isCurrentMonth = isSameMonth(d, monthStart);
                const isToday = isSameDay(d, new Date());
                const dayEvents = getEventsForDay(d);
                return (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => { setSelectedDate(d); }}
                    className={`min-h-[80px] p-1.5 rounded-lg text-left transition-colors ${
                      isCurrentMonth ? 'bg-[var(--bg-elevated)]/50' : 'bg-transparent opacity-40'
                    } ${isToday ? 'ring-2 ring-[var(--accent-primary)]' : ''} ${
                      selectedDate && isSameDay(d, selectedDate) ? 'bg-white/5' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <span className={`text-xs font-medium ${isToday ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}>
                      {format(d, 'd')}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {dayEvents.slice(0, 2).map((ev, ei) => (
                        <div key={ei} className="h-5 rounded px-1 truncate text-[10px] text-white font-medium" style={{ backgroundColor: ev.color }}>
                          {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-[10px] text-[var(--text-muted)] pl-1">+{dayEvents.length - 2}</div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </GlassCard>

        {/* Side Panel */}
        <div className="space-y-4">
          <GlassCard>
            <div className="p-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                {selectedDate ? format(selectedDate, 'EEEE dd MMMM', { locale: fr }) : 'Sélectionnez une date'}
              </h3>
              {selectedEvents.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)]">Aucun événement</p>
              ) : (
                <div className="space-y-2">
                  {selectedEvents.map(ev => (
                    <div key={ev.id} className="p-2.5 rounded-lg bg-[var(--bg-elevated)]">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ev.color }} />
                        <span className="text-xs font-medium text-[var(--text-primary)]">{ev.title}</span>
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)]">{ev.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </GlassCard>

          <GlassCard>
            <div className="p-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Légende</h3>
              <div className="space-y-2">
                {[
                  { label: 'Réseau social', color: '#3B82F6' },
                  { label: 'Blog', color: '#2DD4A8' },
                  { label: 'Newsletter', color: '#8B5CF6' },
                  { label: 'Événement', color: '#F59E0B' },
                  { label: 'Réunion', color: '#EF4444' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-[var(--text-secondary)]">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* New Event Modal */}
      {showEventForm && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowEventForm(false)} />
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="fixed right-0 top-0 bottom-0 w-full max-w-md border-l border-[var(--glass-border)] bg-[var(--bg-card)] z-50 max-h-screen overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold text-[var(--text-primary)]">Nouvel Événement</h2><button type="button" onClick={() => setShowEventForm(false)} aria-label="Fermer le formulaire" className="p-2 rounded-lg hover:bg-white/5"><X size={18} className="text-[var(--text-muted)]" /></button></div>
              <div className="space-y-3">
                <div><label htmlFor="calendar-event-title" className="block text-xs text-[var(--text-secondary)] mb-1">Titre</label><input id="calendar-event-title" required maxLength={180} value={eventDraft.title} onChange={event => setEventDraft({ ...eventDraft, title: event.target.value })} className="w-full h-9 px-3 glass-input text-sm" placeholder="Titre de l'événement" /></div>
                <div><label htmlFor="calendar-event-type" className="block text-xs text-[var(--text-secondary)] mb-1">Type</label><select id="calendar-event-type" value={eventDraft.type} onChange={event => setEventDraft({ ...eventDraft, type: event.target.value as CalendarEvent['type'] })} className="w-full h-9 px-3 glass-input text-sm"><option value="social">Réseau social</option><option value="blog">Blog</option><option value="newsletter">Newsletter</option><option value="event">Événement</option><option value="meeting">Réunion</option></select></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label htmlFor="calendar-event-start" className="block text-xs text-[var(--text-secondary)] mb-1">Date début</label><input id="calendar-event-start" type="datetime-local" required value={eventDraft.startDate} onChange={event => setEventDraft({ ...eventDraft, startDate: event.target.value })} className="w-full h-9 px-2 glass-input text-sm" /></div>
                  <div><label htmlFor="calendar-event-end" className="block text-xs text-[var(--text-secondary)] mb-1">Date fin</label><input id="calendar-event-end" type="datetime-local" required value={eventDraft.endDate} onChange={event => setEventDraft({ ...eventDraft, endDate: event.target.value })} className="w-full h-9 px-2 glass-input text-sm" /></div>
                </div>
                <div><label htmlFor="calendar-event-description" className="block text-xs text-[var(--text-secondary)] mb-1">Description</label><textarea id="calendar-event-description" maxLength={2000} value={eventDraft.description} onChange={event => setEventDraft({ ...eventDraft, description: event.target.value })} className="w-full h-20 p-2 glass-input text-sm resize-y" placeholder="Décrivez l'événement…" /></div>
                <button type="button" onClick={saveEvent} className="w-full btn-primary h-10 justify-center">Créer</button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
