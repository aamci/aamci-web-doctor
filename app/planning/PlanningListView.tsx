'use client';

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Clock, User, Video } from 'lucide-react';
import styles from './PlanningListView.module.css';
import EmptyState from './EmptyState';
import AppointmentTooltip from './AppointmentTooltip';

interface Appointment {
  id: string;
  kindId?: string;
  kind?: {
    id: string;
    name: string;
    isTelemedicine?: boolean;
    color?: string | null;
  };
  patient?: {
    id: string;
    fullName?: string;
  };
  status?: string;
}

interface Slot {
  id: string;
  start: string;
  end: string;
  capacity: number;
  status: 'ACTIVE' | 'INACTIVE';
  appointments?: Appointment[];
}

interface Props {
  slots: Slot[];
  currentDate: Date;
  onAppointmentClick: (appointment: any) => void;
  onSlotClick: (slot: any) => void;
  isCopyMode?: boolean;
}

function getCardStyle(kind?: { name?: string; color?: string | null; isTelemedicine?: boolean }, status?: string) {
  if (status === 'CANCELLED') {
    return { cls: 'bg-gray-50 border-gray-200 text-gray-400 opacity-60', style: {} };
  }

  const isPending = status === 'PENDING';
  const borderStyle = isPending ? 'border-dashed' : 'border-solid';

  if (kind?.color) {
    return {
      cls: `${borderStyle} text-gray-800`,
      style: {
        backgroundColor: `${kind.color}1A`,
        borderColor: kind.color,
        borderLeftWidth: '4px',
        borderLeftColor: kind.color,
      },
    };
  }

  if (kind?.isTelemedicine) {
    return isPending
      ? { cls: 'bg-purple-50 border-purple-300 border-dashed text-purple-900', style: { borderLeftWidth: '4px', borderLeftColor: '#a855f7' } }
      : { cls: 'bg-purple-50 border-purple-300 text-purple-900', style: { borderLeftWidth: '4px', borderLeftColor: '#a855f7' } };
  }

  const palette = [
    { bg: 'bg-blue-50',    border: 'border-blue-300',    text: 'text-blue-900',    left: '#60a5fa' },
    { bg: 'bg-teal-50',    border: 'border-teal-300',    text: 'text-teal-900',    left: '#2dd4bf' },
    { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-900', left: '#34d399' },
    { bg: 'bg-orange-50',  border: 'border-orange-300',  text: 'text-orange-900',  left: '#fb923c' },
    { bg: 'bg-rose-50',    border: 'border-rose-300',    text: 'text-rose-900',    left: '#fb7185' },
    { bg: 'bg-indigo-50',  border: 'border-indigo-300',  text: 'text-indigo-900',  left: '#818cf8' },
  ];
  const name = kind?.name || '';
  const idx = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % palette.length;
  const { bg, border, text, left } = palette[idx];
  return {
    cls: `${bg} ${border} ${text} ${borderStyle}`,
    style: { borderLeftWidth: '4px', borderLeftColor: left },
  };
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    CONFIRMED: { label: 'Confirmé',   cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    PENDING:   { label: 'En attente', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
    CANCELLED: { label: 'Annulé',     cls: 'bg-gray-100 text-gray-500 border-gray-200' },
    NO_SHOW:   { label: 'Absent',     cls: 'bg-red-100 text-red-600 border-red-200' },
  };
  const { label, cls } = map[status] || { label: status, cls: 'bg-blue-100 text-blue-700 border-blue-200' };
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${cls}`}>
      {label}
    </span>
  );
}

export default function PlanningListView({ slots, currentDate, onAppointmentClick, onSlotClick, isCopyMode = false }: Props) {
  const groupedSlots = slots.reduce((acc, slot) => {
    const slotDate = new Date(slot.start);
    const dateKey = `${slotDate.getFullYear()}-${String(slotDate.getMonth() + 1).padStart(2, '0')}-${String(slotDate.getDate()).padStart(2, '0')}`;
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(slot);
    return acc;
  }, {} as Record<string, Slot[]>);

  const sortedDates = Object.keys(groupedSlots).sort();

  return (
    <div className={styles.listView}>
      {sortedDates.length === 0 ? (
        <EmptyState type="no-slots" view="list" />
      ) : (
        sortedDates.map((dateKey) => {
          const [year, month, day] = dateKey.split('-').map(Number);
          const date = new Date(year, month - 1, day);
          const daySlots = groupedSlots[dateKey].sort((a, b) =>
            new Date(a.start).getTime() - new Date(b.start).getTime()
          );

          // Count active appointments
          const aptCount = daySlots.reduce((n, s: any) => {
            const apt = s.appointments?.[0];
            return n + (apt && apt.status !== 'CANCELLED' ? 1 : 0);
          }, 0);

          return (
            <div key={dateKey} className={styles.dateGroup}>
              {/* En-tête de date */}
              <div className={styles.dateHeader}>
                <div className={styles.dateInfo}>
                  <div className={styles.dayNumber}>
                    {format(date, 'd', { locale: fr })}
                  </div>
                  <div className={styles.dateDetails}>
                    <div className={styles.dayName}>
                      {format(date, 'EEEE', { locale: fr })}
                    </div>
                    <div className={styles.monthYear}>
                      {format(date, 'MMMM yyyy', { locale: fr })}
                    </div>
                  </div>
                </div>
                {aptCount > 0 && (
                  <div className="text-xs text-gray-500 font-medium">
                    {aptCount} rendez-vous
                  </div>
                )}
              </div>

              {/* Liste des créneaux */}
              <div className={styles.slotsList}>
                {daySlots.map((slot: any) => {
                  const startTime = new Date(slot.start);
                  const endTime = new Date(slot.end);
                  const appointment = slot.appointments?.[0];
                  const isBooked = slot.isBooked || (appointment && !slot.isGenerated);
                  const isExcluded = slot.isExcluded || slot.status === 'EXCLUDED';
                  const isGenerated = slot.isGenerated && !appointment;

                  if (isExcluded) {
                    return (
                      <div
                        key={slot.id}
                        className={`${styles.slotCard} bg-gray-50 border border-gray-200 opacity-50`}
                        title="Période non disponible"
                      >
                        <div className={styles.slotTime}>
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span className={styles.timeRange}>
                            {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
                          </span>
                        </div>
                        <div className={styles.slotDetails}>
                          <span className="text-xs text-gray-400">Période bloquée</span>
                        </div>
                      </div>
                    );
                  }

                  if (isGenerated) {
                    return (
                      <div
                        key={slot.id}
                        className={`${styles.slotCard} cursor-pointer hover:bg-blue-50 transition-colors border border-dashed border-slate-300 ${isCopyMode ? 'bg-amber-50 border-amber-300' : ''}`}
                        onClick={() => onSlotClick(slot)}
                        title="Cliquer pour créer un rendez-vous"
                      >
                        <div className={styles.slotTime}>
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span className={styles.timeRange}>
                            {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
                          </span>
                        </div>
                        <div className={styles.slotDetails}>
                          <span className="text-xs text-gray-400">Disponible</span>
                        </div>
                      </div>
                    );
                  }

                  if (isBooked) {
                    const kind = appointment?.kind;
                    const status = appointment?.status || 'PENDING';
                    const patientName = appointment?.patient?.fullName || 'Patient inconnu';
                    const { cls, style } = getCardStyle(kind, status);

                    return (
                      <AppointmentTooltip
                        key={slot.id}
                        appointment={{ ...appointment, start: slot.start, end: slot.end }}
                        className={`${styles.slotCard} border rounded cursor-pointer hover:opacity-80 transition-all ${cls} ${isCopyMode ? 'ring-2 ring-amber-300' : ''}`}
                        style={style}
                        onClick={() => isCopyMode ? onSlotClick(slot) : onAppointmentClick({ ...appointment, start: slot.start, end: slot.end })}
                      >
                        {/* Ligne heure */}
                        <div className={styles.slotTime}>
                          <Clock className="w-3.5 h-3.5 opacity-60 shrink-0" />
                          <span className={`${styles.timeRange} ${status === 'CANCELLED' ? 'line-through' : ''}`}>
                            {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
                          </span>
                        </div>

                        {/* Détails */}
                        <div className={styles.slotDetails}>
                          <div className={styles.slotInfo}>
                            {/* Type de consultation */}
                            <div className="flex items-center gap-1.5 mb-0.5">
                              {kind?.isTelemedicine && <Video className="w-3 h-3 shrink-0 text-purple-500" />}
                              <span className="text-xs font-semibold truncate">{kind?.name || 'Consultation'}</span>
                              {kind?.isTelemedicine && (
                                <span className="text-[9px] font-bold bg-purple-100 text-purple-700 px-1 py-0.5 rounded-full">Visio</span>
                              )}
                            </div>
                            {/* Patient */}
                            <div className="flex items-center gap-1 opacity-70">
                              <User className="w-3 h-3 shrink-0" />
                              <span className={`text-xs ${status === 'CANCELLED' ? 'line-through' : ''}`}>{patientName}</span>
                            </div>
                          </div>

                          <div className={styles.slotStatus}>
                            <StatusBadge status={status} />
                          </div>
                        </div>
                      </AppointmentTooltip>
                    );
                  }

                  return null;
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
