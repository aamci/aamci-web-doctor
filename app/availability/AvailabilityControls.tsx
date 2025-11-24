'use client';

import { useState } from 'react';
import styles from './AvailabilityControls.module.css';

type Props = {
  onGenerate: (
    slots: Array<{ start: string; end: string; capacity?: number; status?: string }>
  ) => Promise<void> | void;
};

export default function AvailabilityControls({ onGenerate }: Props) {
  const [genDate, setGenDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [dayStart, setDayStart] = useState('07:00');
  const [dayEnd, setDayEnd] = useState('18:00');
  const [slotDuration, setSlotDuration] = useState(30);
  const [capacity, setCapacity] = useState(1);
  const [weeksCount, setWeeksCount] = useState(4);
  const [workDays, setWorkDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [exclusions, setExclusions] = useState<Array<{ start: string; end: string }>>([
    { start: '13:00', end: '14:00' },
  ]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function buildDaySlots(
    baseDate: Date,
    startStr: string,
    endStr: string,
    durationMin: number,
    excl: Array<{ start: string; end: string }>,
  ) {
    const slots: Array<{ start: string; end: string }> = [];

    const [startH, startM] = startStr.split(':').map(Number);
    const [endH, endM] = endStr.split(':').map(Number);

    const dayStart = new Date(baseDate);
    dayStart.setHours(startH, startM, 0, 0);

    const dayEnd = new Date(baseDate);
    dayEnd.setHours(endH, endM, 0, 0);

    for (
      let d = new Date(dayStart);
      d < dayEnd;
      d = new Date(d.getTime() + durationMin * 60 * 1000)
    ) {
      const slotStart = new Date(d);
      const slotEnd = new Date(d.getTime() + durationMin * 60 * 1000);
      if (slotEnd > dayEnd) break;

      const isExcluded = excl.some((e) => {
        const [eh, em] = e.start.split(':').map(Number);
        const [eh2, em2] = e.end.split(':').map(Number);
        const exStart = new Date(baseDate);
        exStart.setHours(eh, em, 0, 0);
        const exEnd = new Date(baseDate);
        exEnd.setHours(eh2, em2, 0, 0);
        return slotStart >= exStart && slotStart < exEnd;
      });
      if (isExcluded) continue;

      slots.push({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
      });
    }

    return slots;
  }

  async function handleGenerate() {
    setErr(null);

    // 🔧 corrige le bug: si on retourne ici, on ne doit pas rester en "loading"
    if (slotDuration < 15 || slotDuration > 45) {
      setErr('La durée doit être comprise entre 15 et 45 minutes.');
      return;
    }

    setLoading(true);
    try {
      const baseDate = new Date(genDate);
      const allSlots: Array<{
        start: string;
        end: string;
        capacity?: number;
        status?: string;
      }> = [];
      const totalWeeks = Math.min(Math.max(weeksCount, 1), 12);

      for (let w = 0; w < totalWeeks; w++) {
        const weekStart = new Date(baseDate);
        weekStart.setDate(baseDate.getDate() + w * 7);

        for (let i = 0; i < 7; i++) {
          const day = new Date(weekStart);
          day.setDate(weekStart.getDate() + i);

          const jsDay = day.getDay(); // 0=dim
          const myDay = jsDay === 0 ? 7 : jsDay;
          if (!workDays.includes(myDay)) continue;

          const daySlots = buildDaySlots(
            day,
            dayStart,
            dayEnd,
            slotDuration,
            exclusions,
          );
          allSlots.push(
            ...daySlots.map((s) => ({
              ...s,
              capacity,
              status: 'ACTIVE',
            })),
          );
        }
      }

      await onGenerate(allSlots);
    } catch (e: any) {
      setErr(e.message || 'Erreur lors de la génération');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <div className={styles.wrapper}>
        <h3 className={styles.title}>Générer automatiquement</h3>
        {err && <div className="banner error">{err}</div>}

        {/* Ligne principale des paramètres */}
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>À partir du</label>
            <input
              type="date"
              value={genDate}
              onChange={(e) => setGenDate(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Début</label>
            <input
              type="time"
              value={dayStart}
              onChange={(e) => setDayStart(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Fin</label>
            <input
              type="time"
              value={dayEnd}
              onChange={(e) => setDayEnd(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Durée (min)</label>
            <input
              type="number"
              min={15}
              max={45}
              step={5}
              value={slotDuration}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (v < 15) setSlotDuration(15);
                else if (v > 45) setSlotDuration(45);
                else setSlotDuration(v);
              }}
              className={`${styles.input} ${styles.inputSmall}`}
            />
            <div className={styles.hint}>entre 15 et 45 minutes</div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Capacité</label>
            <input
              type="number"
              min={1}
              value={capacity}
              onChange={(e) =>
                setCapacity(Number(e.target.value || 1))
              }
              className={`${styles.input} ${styles.inputSmall}`}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Semaines</label>
            <input
              type="number"
              min={1}
              max={12}
              value={weeksCount}
              onChange={(e) =>
                setWeeksCount(Number(e.target.value || 1))
              }
              className={`${styles.input} ${styles.inputWeeks}`}
            />
            <div className={styles.hint}>max 12 (≈3 mois)</div>
          </div>
        </div>

        {/* Jours travaillés */}
        <div className={styles.daysRow}>
          {[
            { d: 1, label: 'Lun' },
            { d: 2, label: 'Mar' },
            { d: 3, label: 'Mer' },
            { d: 4, label: 'Jeu' },
            { d: 5, label: 'Ven' },
            { d: 6, label: 'Sam' },
            { d: 7, label: 'Dim' },
          ].map((day) => {
            const active = workDays.includes(day.d);
            return (
              <button
                key={day.d}
                type="button"
                onClick={() =>
                  setWorkDays((prev) =>
                    prev.includes(day.d)
                      ? prev.filter((x) => x !== day.d)
                      : [...prev, day.d],
                  )
                }
                className={
                  active
                    ? `${styles.dayChip} ${styles.dayChipActive}`
                    : styles.dayChip
                }
              >
                {day.label}
              </button>
            );
          })}
        </div>

        {/* Exclusions */}
        <div className={styles.exclusionsWrapper}>
          <label className={styles.label}>Plages à exclure</label>
          {exclusions.map((ex, idx) => (
            <div key={idx} className={styles.exclusionRow}>
              <input
                type="time"
                value={ex.start}
                onChange={(e) => {
                  const copy = [...exclusions];
                  copy[idx] = { ...copy[idx], start: e.target.value };
                  setExclusions(copy);
                }}
                className={styles.exclusionInput}
              />
              <input
                type="time"
                value={ex.end}
                onChange={(e) => {
                  const copy = [...exclusions];
                  copy[idx] = { ...copy[idx], end: e.target.value };
                  setExclusions(copy);
                }}
                className={styles.exclusionInput}
              />
              <button
                type="button"
                onClick={() =>
                  setExclusions(exclusions.filter((_, i) => i !== idx))
                }
                className={styles.exclusionRemove}
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setExclusions([
                ...exclusions,
                { start: '13:00', end: '14:00' },
              ])
            }
            className={styles.exclusionAdd}
          >
            + Ajouter une exclusion
          </button>
        </div>

        {/* Bouton de génération */}
        <div className={styles.actionsRow}>
          <button
            className="btn primary"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? 'Génération…' : 'Générer les créneaux'}
          </button>
        </div>
      </div>
    </div>
  );
}