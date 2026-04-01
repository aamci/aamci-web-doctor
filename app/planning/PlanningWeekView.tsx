'use client';

import { Video } from 'lucide-react';
import { Slot } from './page';
import styles from './PlanningWeekView.module.css';
import EmptyState from './EmptyState';
import AppointmentTooltip from './AppointmentTooltip';

interface WeekDay { date: Date; day: string; dayNum: number; }

interface Props {
  slots: Slot[];
  weekDays: WeekDay[];
  hours: number[];
  onAppointmentClick: (appointment: any) => void;
  onSlotClick: (slot: any) => void;
  isCopyMode?: boolean;
}

/** Returns Tailwind classes + optional inline style for a booked appointment card */
function getCardStyle(kind?: { name?: string; color?: string | null; isTelemedicine?: boolean }, status?: string) {
  if (status === 'CANCELLED') {
    return { cls: 'bg-gray-100 border-gray-300 text-gray-400 opacity-50 line-through', style: {} };
  }

  const isPending = status === 'PENDING';
  const borderStyle = isPending ? 'border-dashed' : 'border-solid';

  // Custom hex color set by doctor on the kind
  if (kind?.color) {
    return {
      cls: `${borderStyle} text-gray-800`,
      style: {
        backgroundColor: `${kind.color}1A`,  // ~10% opacity tint
        borderColor: kind.color,
        borderLeftWidth: '3px',
        borderLeftColor: kind.color,
      },
    };
  }

  // Telemedicine default: purple
  if (kind?.isTelemedicine) {
    return isPending
      ? { cls: 'bg-purple-50 border-purple-400 border-dashed text-purple-900', style: {} }
      : { cls: 'bg-purple-50 border-purple-400 text-purple-900', style: { borderLeftWidth: '3px' } };
  }

  // Hash from kind name → consistent color per type
  const palette = [
    { bg: 'bg-blue-50',   border: 'border-blue-400',   text: 'text-blue-900' },
    { bg: 'bg-teal-50',   border: 'border-teal-400',   text: 'text-teal-900' },
    { bg: 'bg-emerald-50',border: 'border-emerald-400', text: 'text-emerald-900' },
    { bg: 'bg-orange-50', border: 'border-orange-400',  text: 'text-orange-900' },
    { bg: 'bg-rose-50',   border: 'border-rose-400',    text: 'text-rose-900' },
    { bg: 'bg-indigo-50', border: 'border-indigo-400',  text: 'text-indigo-900' },
  ];
  const name = kind?.name || '';
  const idx = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % palette.length;
  const { bg, border, text } = palette[idx];
  return { cls: `${bg} ${border} ${text} ${borderStyle}`, style: { borderLeftWidth: '3px' } };
}

function getLoadBadgeColor(count: number) {
  if (count === 0)  return 'bg-gray-100 text-gray-500 border-gray-200';
  if (count <= 3)   return 'bg-emerald-100 text-emerald-700 border-emerald-300';
  if (count <= 7)   return 'bg-amber-100 text-amber-700 border-amber-300';
  if (count <= 12)  return 'bg-orange-100 text-orange-700 border-orange-300';
  return 'bg-red-100 text-red-700 border-red-300';
}

function StatusDot({ status }: { status: string }) {
  if (status === 'CONFIRMED') return <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />;
  if (status === 'PENDING')   return <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />;
  if (status === 'NO_SHOW')   return <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />;
  return null;
}

export default function PlanningWeekView({ slots, weekDays, hours, onAppointmentClick, onSlotClick, isCopyMode = false }: Props) {
  const today = new Date();

  const getSlotsForCell = (dayDate: Date, hour: number) =>
    slots.filter((slot) => {
      const s = new Date(slot.start);
      return s.getDate() === dayDate.getDate() &&
        s.getMonth() === dayDate.getMonth() &&
        s.getFullYear() === dayDate.getFullYear() &&
        s.getHours() === hour;
    });

  const getAppointmentsCountForDay = (dayDate: Date) => {
    let count = 0;
    slots.forEach((slot: any) => {
      const s = new Date(slot.start);
      if (s.getDate() === dayDate.getDate() && s.getMonth() === dayDate.getMonth() && s.getFullYear() === dayDate.getFullYear()) {
        slot.appointments?.forEach((apt: any) => { if (apt.status !== 'CANCELLED') count++; });
      }
    });
    return count;
  };

  if (slots.length === 0) {
    return <div className={styles.weekView}><EmptyState type="no-slots" view="week" /></div>;
  }

  return (
    <div className={styles.weekView}>
      {/* Header jours */}
      <div className={styles.header}>
        <div className={styles.timeColumn} />
        {weekDays.map((day, i) => {
          const isToday = day.date.toDateString() === today.toDateString();
          const count = getAppointmentsCountForDay(day.date);
          return (
            <div key={i} className={styles.dayHeader}>
              <div className="flex items-center justify-between w-full px-2">
                <div className="flex flex-col items-start">
                  <div className={styles.dayName}>{day.day}</div>
                  <div className={`${styles.dayNumber} ${isToday ? styles.today : ''}`}>{day.dayNum}</div>
                </div>
                {count > 0 && (
                  <div className={`px-1.5 py-0.5 rounded-full text-[0.65rem] font-semibold border min-w-[1.25rem] flex items-center justify-center ${getLoadBadgeColor(count)}`}>
                    {count}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Grille horaires */}
      <div className={styles.grid}>
        {hours.map((hour) => (
          <div key={hour} className={styles.row}>
            <div className={styles.hourCell}>{hour}:00</div>
            {weekDays.map((day, dayIndex) => {
              const cellSlots = getSlotsForCell(day.date, hour);
              const hasAvailable = cellSlots.some((s: any) => !s.isBooked && !s.isExcluded);
              return (
                <div
                  key={dayIndex}
                  className={`${styles.dayCell} ${isCopyMode && hasAvailable ? 'bg-amber-50 border-2 border-amber-300 cursor-copy' : ''}`}
                >
                  {cellSlots.map((slot: any) => {
                    const slotStart = new Date(slot.start);
                    const timeStr = slotStart.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

                    const appointment = slot.appointments?.[0];
                    const isBooked = slot.isBooked || (appointment && !slot.isGenerated);
                    const isExcluded = slot.isExcluded || slot.status === 'EXCLUDED';
                    const isGenerated = slot.isGenerated && !appointment;

                    if (isExcluded) {
                      return (
                        <div key={slot.id} className={`${styles.appointment} ${styles.excludedSlot}`} title="Période non disponible" />
                      );
                    }

                    if (isGenerated) {
                      return (
                        <div
                          key={slot.id}
                          className={`${styles.appointment} cursor-pointer hover:bg-blue-50 transition-colors border border-dashed border-slate-300`}
                          onClick={() => onSlotClick(slot)}
                          title="Cliquer pour créer un rendez-vous"
                        >
                          <span className={styles.appointmentTime}>{timeStr}</span>
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
                          className={`${styles.appointment} ${cls} cursor-pointer hover:opacity-80 transition-all border rounded`}
                          style={style}
                          onClick={() => onAppointmentClick({ ...appointment, start: slot.start, end: slot.end })}
                        >
                          {/* Status dot + time */}
                          <div className="flex items-center gap-1">
                            <StatusDot status={status} />
                            <span className={styles.appointmentTime}>{timeStr}</span>
                            {kind?.isTelemedicine && <Video className="w-2.5 h-2.5 shrink-0 opacity-70" />}
                          </div>
                          <span className={styles.appointmentType}>{kind?.name || 'Consultation'}</span>
                          <span className={styles.appointmentPatient}>{patientName}</span>
                        </AppointmentTooltip>
                      );
                    }

                    return null;
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
