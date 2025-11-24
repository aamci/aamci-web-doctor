'use client';

import { useState } from 'react';
import { Slot } from './page'; // ou recopie le type si tu préfères
import styles from './AvailabilityGrid.module.css';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

type Props = {
  slots: Slot[];
  weekOffset: number;
  minHour: number;
  maxHour: number;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToggle: (slot: Slot) => void | Promise<void>;
  onDelete: (slot: Slot) => void | Promise<void>;
  onCapacityChange?: (slot: Slot, capacity: number) => void | Promise<void>;
};

type Appointment = {
  id: string;
  type?: string;
  patient?: {
    fullName?: string | null;
    email?: string;
    avatarUrl?: string | null;
  } | null;
};

// helpers

function getWeekStart(offset: number): Date {
  const today = new Date();
  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(today.getDate() + diffToMonday + offset * 7);
  return monday;
}

function getWeekDays(weekOffset: number): Date[] {
  const monday = getWeekStart(weekOffset);
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function buildTimeSlots(minHour = 7, maxHour = 18, stepMinutes = 30): string[] {
  const times: string[] = [];
  const base = new Date();
  base.setHours(minHour, 0, 0, 0);
  const end = new Date();
  end.setHours(maxHour, 0, 0, 0);

  for (
    let d = new Date(base);
    d < end;
    d = new Date(d.getTime() + stepMinutes * 60000)
  ) {
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    times.push(`${hh}:${mm}`);
  }
  return times;
}

function findSlotAt(slots: Slot[], day: Date, time: string): Slot | null {
  return (
    slots.find((s) => {
      const start = new Date(s.start);
      if (
        start.getFullYear() === day.getFullYear() &&
        start.getMonth() === day.getMonth() &&
        start.getDate() === day.getDate()
      ) {
        const hh = start.getHours().toString().padStart(2, '0');
        const mm = start.getMinutes().toString().padStart(2, '0');
        return `${hh}:${mm}` === time;
      }
      return false;
    }) || null
  );
}

function AvatarMini({ src, name }: { src: string | null; name: string }) {
  const initials = name
    .split(' ')
    .map((p) => p.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={name}
        className="h-7 w-7 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-[11px] font-semibold text-slate-700">
      {initials || 'U'}
    </div>
  );
}

function humanizeAppointmentType(t?: string) {
  if (!t) return 'Rendez-vous';
  const v = t.toUpperCase();
  if (v.includes('PREMIERE')) return 'Première consultation';
  if (v.includes('SUIVI')) return 'Suivi';
  if (v.includes('URGENCE')) return 'Urgence';
  return t;
}

export default function AvailabilityGrid({
  slots,
  weekOffset,
  minHour,
  maxHour,
  onPrevWeek,
  onNextWeek,
  onToggle,
  onDelete,
}: Props) {
  const [showAllTimes, setShowAllTimes] = useState(false);

  const days = getWeekDays(weekOffset);
  const times = buildTimeSlots(minHour, maxHour, 30);
  const visibleTimes = showAllTimes ? times : times.slice(0, 6);

  const canGoPrev = weekOffset > 0;
  const nextWeekMonday = getWeekStart(weekOffset + 1);
  const canGoNext = slots.some((s) => new Date(s.start) >= nextWeekMonday);

  return (
    <Card className="mt-2 p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            disabled={!canGoPrev}
            onClick={onPrevWeek}
          >
            ◀
          </Button>
          <Button
            size="icon"
            variant="outline"
            disabled={!canGoNext}
            onClick={onNextWeek}
          >
            ▶
          </Button>
        </div>
        <div className="text-xs text-slate-500">
          Semaine du{' '}
          {days[0].toLocaleDateString('fr-FR', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
          })}{' '}
          au{' '}
          {days[6].toLocaleDateString('fr-FR', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
          })}
        </div>
      </div>

      <ScrollArea className="w-full">
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.timeCol}>Heure</th>
                {days.map((d, idx) => (
                  <th key={idx} className={styles.dayCol}>
                    {d.toLocaleDateString('fr-FR', {
                      weekday: 'short',
                      day: '2-digit',
                      month: 'short',
                    })}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleTimes.map((time) => (
                <tr key={time}>
                  <td className={styles.timeCell}>{time}</td>
                  {days.map((day, idx) => {
                    const slot = findSlotAt(slots, day, time);
                    const anyAppts = (slot as any)?.appointments as
                      | Appointment[]
                      | undefined;
                    const hasAppt = !!anyAppts && anyAppts.length > 0;
                    const appt = hasAppt ? anyAppts[0] : undefined;
                    const patientName =
                      appt?.patient?.fullName ||
                      appt?.patient?.email ||
                      'Patient';
                    const avatar = appt?.patient?.avatarUrl || null;

                    let cellClass = styles.cellEmpty;
                    if (slot) {
                      if (hasAppt) cellClass = styles.cellBooked;
                      else if (slot.status === 'ACTIVE')
                        cellClass = styles.cellActive;
                      else cellClass = styles.cellInactive;
                    }

                    return (
                      <td key={idx} className={cellClass}>
                        {slot ? (
                          hasAppt ? (
                            <div className={styles.bookedContent}>
                              <div className="flex items-center gap-2">
                                <AvatarMini src={avatar} name={patientName} />
                                <div className="text-left">
                                  <div className="text-[11px] font-semibold text-slate-900">
                                    {patientName}
                                  </div>
                                  <div className="text-[10px] text-slate-600">
                                    {humanizeAppointmentType(appt?.type)}
                                  </div>
                                </div>
                              </div>
                              <span className="rounded-full bg-white/70 px-2 py-[1px] text-[9px] text-slate-500">
                                Réservé
                              </span>
                            </div>
                          ) : (
                            <div className={styles.slotContent}>
                              <span className={styles.slotLabel}>
                                {slot.status === 'ACTIVE'
                                  ? 'Disponible'
                                  : 'Inactif'}
                              </span>
                              <div className="flex flex-col gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className={styles.smallBtn}
                                  onClick={() => onToggle(slot)}
                                >
                                  {slot.status === 'ACTIVE'
                                    ? 'Désactiver'
                                    : 'Activer'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className={styles.deleteBtn}
                                  onClick={() => onDelete(slot)}
                                >
                                  Supprimer
                                </Button>
                              </div>
                            </div>
                          )
                        ) : (
                          <span className={styles.dash}>—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ScrollArea>

      {/* plus / réduire */}
      {times.length > visibleTimes.length && !showAllTimes && (
        <div className="mt-2 text-right">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-slate-600"
            onClick={() => setShowAllTimes(true)}
          >
            Voir plus d’horaires
          </Button>
        </div>
      )}
      {showAllTimes && (
        <div className="mt-2 text-right">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-slate-600"
            onClick={() => setShowAllTimes(false)}
          >
            Réduire
          </Button>
        </div>
      )}
    </Card>
  );
}