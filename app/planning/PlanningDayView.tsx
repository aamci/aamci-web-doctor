'use client';

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Video } from 'lucide-react';
import styles from './PlanningDayView.module.css';
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
  hours: number[];
  onAppointmentClick: (appointment: any) => void;
  onSlotClick: (slot: any) => void;
  isCopyMode?: boolean;
}

function getCardStyle(kind?: { name?: string; color?: string | null; isTelemedicine?: boolean }, status?: string) {
  if (status === 'CANCELLED') {
    return { cls: 'bg-gray-100 border-gray-300 text-gray-400 opacity-50 line-through', style: {} };
  }

  const isPending = status === 'PENDING';
  const borderStyle = isPending ? 'border-dashed' : 'border-solid';

  if (kind?.color) {
    return {
      cls: `${borderStyle} text-gray-800`,
      style: {
        backgroundColor: `${kind.color}1A`,
        borderColor: kind.color,
        borderLeftWidth: '3px',
        borderLeftColor: kind.color,
      },
    };
  }

  if (kind?.isTelemedicine) {
    return isPending
      ? { cls: 'bg-purple-50 border-purple-400 border-dashed text-purple-900', style: {} }
      : { cls: 'bg-purple-50 border-purple-400 text-purple-900', style: { borderLeftWidth: '3px' } };
  }

  const palette = [
    { bg: 'bg-blue-50',    border: 'border-blue-400',    text: 'text-blue-900' },
    { bg: 'bg-teal-50',    border: 'border-teal-400',    text: 'text-teal-900' },
    { bg: 'bg-emerald-50', border: 'border-emerald-400', text: 'text-emerald-900' },
    { bg: 'bg-orange-50',  border: 'border-orange-400',  text: 'text-orange-900' },
    { bg: 'bg-rose-50',    border: 'border-rose-400',    text: 'text-rose-900' },
    { bg: 'bg-indigo-50',  border: 'border-indigo-400',  text: 'text-indigo-900' },
  ];
  const name = kind?.name || '';
  const idx = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % palette.length;
  const { bg, border, text } = palette[idx];
  return { cls: `${bg} ${border} ${text} ${borderStyle}`, style: { borderLeftWidth: '3px' } };
}

function StatusDot({ status }: { status: string }) {
  if (status === 'CONFIRMED') return <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />;
  if (status === 'PENDING')   return <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />;
  if (status === 'NO_SHOW')   return <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />;
  return null;
}

export default function PlanningDayView({ slots, currentDate, hours, onAppointmentClick, onSlotClick, isCopyMode = false }: Props) {
  const daySlots = slots.filter((slot) => {
    const slotDate = new Date(slot.start);
    return (
      slotDate.getDate() === currentDate.getDate() &&
      slotDate.getMonth() === currentDate.getMonth() &&
      slotDate.getFullYear() === currentDate.getFullYear()
    );
  });

  const getSlotForHour = (hour: number) =>
    daySlots.filter((slot) => new Date(slot.start).getHours() === hour);

  if (daySlots.length === 0) {
    return (
      <div className={styles.dayView}>
        <EmptyState type="no-slots" view="day" />
      </div>
    );
  }

  return (
    <div className={styles.dayView}>
      {/* En-tête du jour */}
      <div className={styles.header}>
        <div className={styles.dateInfo}>
          <div className={styles.dayNumber}>{format(currentDate, 'd')}</div>
          <div className={styles.dateDetails}>
            <div className={styles.dayName}>
              {format(currentDate, 'EEEE', { locale: fr })}
            </div>
            <div className={styles.monthYear}>
              {format(currentDate, 'MMMM yyyy', { locale: fr })}
            </div>
          </div>
        </div>
        <div className={styles.slotCount}>
          {daySlots.length} créneau{daySlots.length > 1 ? 'x' : ''} ce jour
        </div>
      </div>

      {/* Grille horaire */}
      <div className={styles.timeGrid}>
        {hours.map((hour) => {
          const hourSlots = getSlotForHour(hour);
          const hasAvailableSlots = hourSlots.some((s: any) => !s.isBooked && !s.isExcluded);

          return (
            <div key={hour} className={styles.timeSlot}>
              <div className={styles.hourLabel}>{hour}:00</div>

              <div className={`${styles.slotContainer} ${isCopyMode && hasAvailableSlots ? 'bg-amber-50 border-2 border-amber-300 rounded cursor-copy' : ''}`}>
                {hourSlots.length === 0 ? (
                  <div className={styles.emptySlot}>
                    <span className="text-gray-400 text-xs">Aucun créneau</span>
                  </div>
                ) : (
                  hourSlots.map((slot: any) => {
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
                          className={`${styles.slotCard} ${styles.excludedSlot}`}
                          title="Période non disponible"
                        />
                      );
                    }

                    if (isGenerated) {
                      return (
                        <div
                          key={slot.id}
                          className={`${styles.slotCard} cursor-pointer hover:bg-blue-50 transition-colors border border-dashed border-slate-300`}
                          onClick={() => onSlotClick(slot)}
                          title="Cliquer pour créer un rendez-vous"
                        >
                          <div className={styles.slotHeader}>
                            <span className={styles.slotTime}>
                              {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    if (isBooked) {
                      const kind = appointment?.kind;
                      const status = appointment?.status || 'PENDING';
                      const patientName = appointment?.patient?.fullName || 'Patient';
                      const { cls, style } = getCardStyle(kind, status);

                      return (
                        <AppointmentTooltip
                          key={slot.id}
                          appointment={{ ...appointment, start: slot.start, end: slot.end }}
                          className={`${styles.slotCard} ${cls} cursor-pointer hover:opacity-80 transition-all border rounded`}
                          style={style}
                          onClick={() => onAppointmentClick({ ...appointment, start: slot.start, end: slot.end })}
                        >
                          <div className={styles.slotHeader}>
                            <div className="flex items-center gap-1.5">
                              <StatusDot status={status} />
                              <span className={styles.slotTime}>
                                {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
                              </span>
                              {kind?.isTelemedicine && <Video className="w-3 h-3 shrink-0 opacity-70" />}
                            </div>
                          </div>
                          <div className={styles.slotBody}>
                            <div className="text-[11px] font-medium opacity-80">{kind?.name || 'Consultation'}</div>
                            <div className="text-[11px] opacity-70">{patientName}</div>
                          </div>
                        </AppointmentTooltip>
                      );
                    }

                    return null;
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
