'use client';

import { useState } from 'react';
import styles from './AvailabilityGrid.module.css';

type Appointment = {
  id: string;
  type?: string;
  patient?: {
    id: string;
    email?: string;
    fullName?: string;
    avatarUrl?: string | null;
  };
};

export type Slot = {
  id: string;
  start: string;
  end: string;
  status: 'ACTIVE' | 'INACTIVE';
  capacity?: number;
  appointments?: Appointment[];
};

type Props = {
  slots: Slot[];
  weekOffset: number;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  minHour: number;
  maxHour: number;
  onToggle: (slot: Slot) => void | Promise<void>;
  onDelete: (slot: Slot) => void | Promise<void>;
  onCapacityChange?: (slot: Slot, capacity: number) => void | Promise<void>;
};

function getWeekStart(offset: number): Date {
  const today = new Date();
  const day = today.getDay(); // 0=dim
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
  onPrevWeek,
  onNextWeek,
  minHour = 7,
  maxHour = 18,
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
    <div className={`card ${styles.gridWrapper}`}>
      <div className={styles.headerRow}>
        <div className={styles.navButtons}>
          <button
            onClick={onPrevWeek}
            disabled={!canGoPrev}
            className={styles.navButton}
          >
            ◀
          </button>
          <button
            onClick={onNextWeek}
            disabled={!canGoNext}
            className={styles.navButton}
          >
            ▶
          </button>
        </div>
        <div className={styles.weekLabel}>
          Semaine du {days[0].toLocaleDateString('fr-FR')} au{' '}
          {days[6].toLocaleDateString('fr-FR')}
        </div>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.thTime}>Heure</th>
            {days.map((d, idx) => (
              <th key={idx} className={styles.thDay}>
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
                const hasAppt = slot?.appointments && slot.appointments.length > 0;
                const appt = hasAppt ? slot!.appointments![0] : null;
                const patientName =
                  appt?.patient?.fullName || appt?.patient?.email || 'Patient';
                const avatar = appt?.patient?.avatarUrl || null;

                const baseClass = `${styles.slotCellBase} ${
                  slot
                    ? hasAppt
                      ? styles.slotReserved
                      : slot.status === 'ACTIVE'
                      ? styles.slotActive
                      : styles.slotInactive
                    : ''
                }`;

                return (
                  <td key={idx} className={baseClass}>
                    {slot ? (
                      hasAppt ? (
                        <div className={styles.slotContent}>
                          <div className={styles.patientRow}>
                            <AvatarMini src={avatar} name={patientName} />
                            <div className={styles.patientInfo}>
                              <div className={styles.patientName}>
                                {patientName}
                              </div>
                              <div className={styles.patientType}>
                                {humanizeAppointmentType(appt?.type)}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => onDelete(slot)}
                            className={styles.btnTinyDanger}
                          >
                            Annuler
                          </button>
                        </div>
                      ) : (
                        <div className={styles.slotContent}>
                          <span className={styles.patientName}>
                            {slot.status === 'ACTIVE'
                              ? 'Disponible'
                              : 'Inactif'}
                          </span>
                          <button
                            className={styles.btnTiny}
                            onClick={() => onToggle(slot)}
                          >
                            {slot.status === 'ACTIVE'
                              ? 'Désactiver'
                              : 'Activer'}
                          </button>
                          <button
                            className={styles.btnTinyDanger}
                            onClick={() => onDelete(slot)}
                          >
                            Suppr.
                          </button>
                        </div>
                      )
                    ) : (
                      <span className={styles.slotEmpty}>—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {!showAllTimes && times.length > visibleTimes.length && (
        <div className={styles.moreWrapper}>
          <button
            onClick={() => setShowAllTimes(true)}
            className={styles.moreButton}
          >
            Voir plus d’horaires
          </button>
        </div>
      )}
      {showAllTimes && (
        <div className={styles.moreWrapper}>
          <button
            onClick={() => setShowAllTimes(false)}
            className={styles.moreButton}
          >
            Réduire
          </button>
        </div>
      )}
    </div>
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
        className={styles.avatarMini}
      />
    );
  }
  return (
    <div className={styles.avatarMiniFallback}>
      {initials || 'U'}
    </div>
  );
}