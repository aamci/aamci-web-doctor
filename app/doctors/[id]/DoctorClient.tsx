'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './DoctorClient.module.css';

function getApiBase(): string | null {
  let base = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  base = base.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  try {
    return base ? new URL(base).toString().replace(/\/$/, '') : null;
  } catch {
    return null;
  }
}

async function callApi(path: string, init?: RequestInit) {
  const base = getApiBase();
  const url = base ? `${base}${path}` : path;
  return fetch(url, init);
}

export default function DoctorClient({ id }: { id: string }) {
  const router = useRouter();
  const [doctor, setDoctor] = useState<any>(null);
  const [slots, setSlots] = useState<{ id: string; start: string; label: string }[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Fetch doctor info
        const base = getApiBase();
        const url = base ? `${base}/search/doctors` : `/search/doctors`;
        const r = await fetch(url);
        const list = await r.json().catch(() => []);
        const found = Array.isArray(list)
          ? list.find((d: any) => d.id === id)
          : null;
        setDoctor(
          found || {
            id,
            name: 'Dr. Démo',
            specialty: 'Médecine générale',
            city: 'Paris',
            hospital: 'Centre',
          },
        );

        // Fetch real available slots from API
        const slotsUrl = base ? `${base}/slots/available/${id}` : `/slots/available/${id}`;
        const slotsRes = await fetch(slotsUrl);
        if (slotsRes.ok) {
          const slotsData = await slotsRes.json();
          const mapped = (Array.isArray(slotsData) ? slotsData : []).slice(0, 6).map((s: any) => {
            const date = new Date(s.start);
            const today = new Date();
            const tomorrow = new Date();
            tomorrow.setDate(today.getDate() + 1);

            let dayLabel = date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
            if (date.toDateString() === today.toDateString()) dayLabel = "Aujourd'hui";
            else if (date.toDateString() === tomorrow.toDateString()) dayLabel = 'Demain';

            const timeLabel = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

            return {
              id: s.id || `${id}-${s.start}`,
              start: s.start,
              label: `${dayLabel} ${timeLabel}`,
            };
          });
          setSlots(mapped);
        } else {
          setSlots([]);
        }
      } catch {
        setDoctor({
          id,
          name: 'Dr. Démo',
          specialty: 'Médecine générale',
          city: 'Paris',
          hospital: 'Centre',
        });
        setSlots([]);
      }
    })();
  }, [id]);

  async function book(slotId: string) {
    setErr(null);
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setErr('Veuillez vous connecter.');
        router.push('/auth/login');
        return;
      }

      // Find the slot to get start/end times for createWithNewSlot flow
      const slot = slots.find(s => s.id === slotId);
      const body: any = { doctorId: id, notes: `RDV avec ${doctor?.name}` };

      if (slot?.start) {
        body.slotStart = slot.start;
        // Default 30min slot
        body.slotEnd = new Date(new Date(slot.start).getTime() + 30 * 60000).toISOString();
      } else {
        body.slotId = slotId;
      }

      const r = await callApi('/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        setErr(`Erreur ${r.status}`);
        return;
      }
      const data = await r.json();
      router.push(`/doctors/${id}/success?aid=${data.id || ''}`);
    } catch (e: any) {
      setErr(e?.message || 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }

  if (!doctor) {
    return <div className={styles.loading}>Chargement…</div>;
  }

  return (
    <div className={styles.wrapper}>
      <a className={`link ${styles.backLink}`} href="/doctors">
        ← Retour à la liste
      </a>

      <div className={`card ${styles.headerCard}`}>
        <h1 className={styles.doctorName}>{doctor.name}</h1>
        <div className={styles.doctorMeta}>
          {doctor.specialty} • {doctor.city}
          {doctor.hospital ? ` • ${doctor.hospital}` : ''}
        </div>
        <p className={styles.doctorIntro}>
          Consultation en présentiel. Apportez votre pièce d&apos;identité et votre carte vitale.
        </p>
      </div>

      <div id="slots" className={`card ${styles.slotsCard}`}>
        <h3 className={styles.slotsHeader}>Créneaux disponibles</h3>
        {slots.length > 0 ? (
          <div className={styles.slotsRow}>
            {slots.map((s) => (
              <button
                key={s.id}
                className="btn outline"
                disabled={loading}
                onClick={() => book(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        ) : (
          <p style={{ color: '#666', fontSize: '0.9rem' }}>Aucun créneau disponible pour le moment.</p>
        )}
        {err && <div className="banner error"> {err}</div>}
      </div>
    </div>
  );
}
