'use client';

import { useState } from 'react';

type Appointment = {
  id: string;
  type?: string; // "PREMIERE_CONSULTATION" | "SUIVI" | "URGENCE" ...
  patient?: {
    id: string;
    email?: string;
    fullName?: string;
    avatarUrl?: string | null;
  };
};

type Slot = {
  id: string;
  start: string;
  end: string;
  status: 'ACTIVE' | 'INACTIVE';
  capacity?: number; // optionnel maintenant
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
  onCapacityChange?: (slot: Slot, capacity: number) => void | Promise<void>; // 👈 ajouté
};

// 👉 calcule le lundi de la semaine avec offset
function getWeekStart(offset: number): Date {
  const today = new Date();
  const day = today.getDay(); // 0=dim
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(today.getDate() + diffToMonday + offset * 7);
  return monday;
}

// construit les 7 jours de la semaine demandée
function getWeekDays(weekOffset: number): Date[] {
  const monday = getWeekStart(weekOffset);
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

// construit les lignes horaires entre minHour et maxHour
function buildTimeSlots(minHour = 7, maxHour = 18, stepMinutes = 30): string[] {
  const times: string[] = [];
  const base = new Date();
  base.setHours(minHour, 0, 0, 0);
  const end = new Date();
  end.setHours(maxHour, 0, 0, 0);

  for (let d = new Date(base); d < end; d = new Date(d.getTime() + stepMinutes * 60000)) {
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    times.push(`${hh}:${mm}`);
  }
  return times;
}

// cherche s'il existe un slot à cette date + heure
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

// petite fonction pour rendre le type lisible
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

  // on affiche seulement les 3 premières heures si pas "showAll"
  const visibleTimes = showAllTimes ? times : times.slice(0, 6);

  const canGoPrev = weekOffset > 0;
  const nextWeekMonday = getWeekStart(weekOffset + 1);
  const canGoNext = slots.some((s) => new Date(s.start) >= nextWeekMonday);

  return (
    <div className="card" style={{ overflowX: 'auto', padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, gap: 8 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onPrevWeek} disabled={!canGoPrev} style={{ padding: '4px 8px' }}>
            ◀
          </button>
          <button onClick={onNextWeek} disabled={!canGoNext} style={{ padding: '4px 8px' }}>
            ▶
          </button>
        </div>
        <div style={{ fontSize: 12, color: '#666' }}>
          Semaine du {days[0].toLocaleDateString('fr-FR')} au {days[6].toLocaleDateString('fr-FR')}
        </div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
        <thead>
          <tr>
            <th style={{ width: 70, textAlign: 'left', padding: '6px 4px', fontSize: 12 }}>Heure</th>
            {days.map((d, idx) => (
              <th key={idx} style={{ padding: '6px 4px', textAlign: 'center', fontSize: 12 }}>
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
              <td style={{ padding: '4px 4px', fontWeight: 500, fontSize: 12 }}>{time}</td>
              {days.map((day, idx) => {
                const slot = findSlotAt(slots, day, time);
                const hasAppt = slot?.appointments && slot.appointments.length > 0;
                const appt = hasAppt ? slot!.appointments![0] : null;
                const patientName =
                  appt?.patient?.fullName || appt?.patient?.email || 'Patient';
                const avatar = appt?.patient?.avatarUrl || null;

                return (
                  <td
                    key={idx}
                    style={{
                      border: '1px solid #eee',
                      padding: 4,
                      textAlign: 'center',
                      background: slot
                        ? hasAppt
                          ? '#fff7ec' // fond différent quand pris
                          : slot.status === 'ACTIVE'
                          ? '#e9f8ee'
                          : '#fafafa'
                        : 'transparent',
                    }}
                  >
                    {slot ? (
                      hasAppt ? (
                        // cellule "réservée"
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <AvatarMini src={avatar} name={patientName} />
                            <div style={{ textAlign: 'left' }}>
                              <div style={{ fontSize: 11, fontWeight: 600 }}>{patientName}</div>
                              <div style={{ fontSize: 10, color: '#555' }}>
                                {humanizeAppointmentType(appt?.type)}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => onDelete(slot)}
                            style={{
                              fontSize: 10,
                              background: '#f6d6d6',
                              border: 'none',
                              borderRadius: 4,
                              padding: '2px 6px',
                              cursor: 'pointer',
                            }}
                          >
                            Annuler
                          </button>
                        </div>
                      ) : (
                        // cellule dispo
                        <div style={{ display: 'grid', gap: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 600 }}>
                            {slot.status === 'ACTIVE' ? 'Disponible' : 'Inactif'}
                          </span>
                          <button
                            style={{ fontSize: 10, padding: '2px 4px' }}
                            onClick={() => onToggle(slot)}
                          >
                            {slot.status === 'ACTIVE' ? 'Désactiver' : 'Activer'}
                          </button>
                          <button
                            style={{
                              fontSize: 10,
                              padding: '2px 4px',
                              background: '#f6d6d6',
                              border: 'none',
                              borderRadius: 4,
                            }}
                            onClick={() => onDelete(slot)}
                          >
                            Suppr.
                          </button>
                        </div>
                      )
                    ) : (
                      <span style={{ fontSize: 10, color: '#bbb' }}>—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {!showAllTimes && times.length > visibleTimes.length && (
        <div style={{ marginTop: 8 }}>
          <button onClick={() => setShowAllTimes(true)} style={{ fontSize: 12 }}>
            Voir plus d’horaires
          </button>
        </div>
      )}
      {showAllTimes && (
        <div style={{ marginTop: 8 }}>
          <button onClick={() => setShowAllTimes(false)} style={{ fontSize: 12 }}>
            Réduire
          </button>
        </div>
      )}
    </div>
  );
}

// petit avatar fallback
function AvatarMini({ src, name }: { src: string | null; name: string }) {
  const initials = name
    .split(' ')
    .map((p) => p.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{ width: 28, height: 28, borderRadius: '999px', objectFit: 'cover' }}
      />
    );
  }
  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: '999px',
        background: '#dfe3e8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10,
        fontWeight: 600,
        color: '#333',
      }}
    >
      {initials || 'U'}
    </div>
  );
}