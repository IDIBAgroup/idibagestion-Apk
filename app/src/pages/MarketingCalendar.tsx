import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { useUIStore } from '@/stores/uiStore';
import { getAll } from '@/lib/db';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { CalendarEvent } from '@/types';

export function MarketingCalendar() {
  const { setCurrentPageTitle, showToast } = useUIStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);

  useEffect(() => { setCurrentPageTitle('Calendrier Éditorial'); }, [setCurrentPageTitle]);

  const events = getAll('calendarEvents') as CalendarEvent[];

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
            Aujourd'hui
          </button>
        </div>
        <button onClick={() => { setSelectedDate(new Date()); setShowEventForm(true); }} className="btn-primary h-9"><Plus size={16} /> Événement</button>
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
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md glass-card z-50 max-h-[85vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Nouvel Événement</h2>
              <div className="space-y-3">
                <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Titre</label><input className="w-full h-9 px-3 glass-input text-sm" placeholder="Titre de l'événement" /></div>
                <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Type</label><select className="w-full h-9 px-3 glass-input text-sm"><option>Réseau social</option><option>Blog</option><option>Newsletter</option><option>Événement</option><option>Réunion</option></select></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Date début</label><input type="datetime-local" className="w-full h-9 px-2 glass-input text-sm" /></div>
                  <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Date fin</label><input type="datetime-local" className="w-full h-9 px-2 glass-input text-sm" /></div>
                </div>
                <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Description</label><textarea className="w-full h-16 p-2 glass-input text-sm resize-none" /></div>
                <button onClick={() => { showToast('Événement créé', 'success'); setShowEventForm(false); }} className="w-full btn-primary h-10 justify-center">Créer</button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
