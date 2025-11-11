'use client';

import { useState } from 'react';

type Props = {
  onGenerate: (slots: Array<{ start: string; end: string; capacity?: number; status?: string }>) => Promise<void> | void;
};

export default function AvailabilityControls({ onGenerate }: Props) {
  const [genDate, setGenDate] = useState(() => new Date().toISOString().slice(0, 10));
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
    excl: Array<{ start: string; end: string }>
  ) {
    const slots: Array<{ start: string; end: string }> = [];

    const [startH, startM] = startStr.split(':').map(Number);
    const [endH, endM] = endStr.split(':').map(Number);

    const dayStart = new Date(baseDate);
    dayStart.setHours(startH, startM, 0, 0);

    const dayEnd = new Date(baseDate);
    dayEnd.setHours(endH, endM, 0, 0);

    for (let d = new Date(dayStart); d < dayEnd; d = new Date(d.getTime() + durationMin * 60 * 1000)) {
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
    setLoading(true);
    setErr(null);
      if (slotDuration < 15 || slotDuration > 45) {
        setErr('La durée doit être comprise entre 15 et 45 minutes.');
        return;
     }
    try {
      const baseDate = new Date(genDate);
      const allSlots: Array<{ start: string; end: string; capacity?: number; status?: string }> = [];
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

          const daySlots = buildDaySlots(day, dayStart, dayEnd, slotDuration, exclusions);
          allSlots.push(
            ...daySlots.map((s) => ({
              ...s,
              capacity,
              status: 'ACTIVE',
            }))
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
    <div className="card" style={{ display: 'grid', gap: 14 }}>
      <h3>Générer automatiquement</h3>
      {err && <div className="banner error">{err}</div>}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <label className="small">À partir du</label>
          <input type="date" value={genDate} onChange={(e) => setGenDate(e.target.value)} />
        </div>
        <div>
          <label className="small">Début</label>
          <input type="time" value={dayStart} onChange={(e) => setDayStart(e.target.value)} />
        </div>
        <div>
          <label className="small">Fin</label>
          <input type="time" value={dayEnd} onChange={(e) => setDayEnd(e.target.value)} />
        </div>
        <div>
        <label className="small">Durée (min)</label>
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
            style={{ width: 90 }}
        />
        <div className="small" style={{ color: '#777' }}>
            entre 15 et 45 minutes
        </div>
        </div>
        <div>
          <label className="small">Capacité</label>
          <input
            type="number"
            min={1}
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value || 1))}
            style={{ width: 90 }}
          />
        </div>
        <div>
          <label className="small">Semaines</label>
          <input
            type="number"
            min={1}
            max={12}
            value={weeksCount}
            onChange={(e) => setWeeksCount(Number(e.target.value || 1))}
            style={{ width: 100 }}
          />
          <div className="small" style={{ color: '#777' }}>
            max 12 (≈3 mois)
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[
          { d: 1, label: 'Lun' },
          { d: 2, label: 'Mar' },
          { d: 3, label: 'Mer' },
          { d: 4, label: 'Jeu' },
          { d: 5, label: 'Ven' },
          { d: 6, label: 'Sam' },
          { d: 7, label: 'Dim' },
        ].map((day) => (
          <button
            key={day.d}
            type="button"
            onClick={() =>
              setWorkDays((prev) => (prev.includes(day.d) ? prev.filter((x) => x !== day.d) : [...prev, day.d]))
            }
            style={{
              padding: '4px 10px',
              borderRadius: 999,
              border: '1px solid #ddd',
              background: workDays.includes(day.d) ? '#0f62fe' : '#fff',
              color: workDays.includes(day.d) ? '#fff' : '#222',
            }}
          >
            {day.label}
          </button>
        ))}
      </div>

      <div>
        <label className="small">Plages à exclure</label>
        {exclusions.map((ex, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <input
              type="time"
              value={ex.start}
              onChange={(e) => {
                const copy = [...exclusions];
                copy[idx] = { ...copy[idx], start: e.target.value };
                setExclusions(copy);
              }}
            />
            <input
              type="time"
              value={ex.end}
              onChange={(e) => {
                const copy = [...exclusions];
                copy[idx] = { ...copy[idx], end: e.target.value };
                setExclusions(copy);
              }}
            />
            <button onClick={() => setExclusions(exclusions.filter((_, i) => i !== idx))}>×</button>
          </div>
        ))}
        <button onClick={() => setExclusions([...exclusions, { start: '13:00', end: '14:00' }])} style={{ marginTop: 6 }}>
          + Ajouter une exclusion
        </button>
      </div>

      <button className="btn primary" onClick={handleGenerate} disabled={loading}>
        {loading ? 'Génération…' : 'Générer les créneaux'}
      </button>
    </div>
  );
}