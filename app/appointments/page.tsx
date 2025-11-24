'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../_providers/AuthProvider';
import styles from './Appointments.module.css';

type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'NO_SHOW';

type Appointment = {
  id: string;
  status: AppointmentStatus;
  type?: string;
  notes?: string | null;
  createdAt?: string;
  patient?: {
    fullName?: string | null;
    email?: string;
    avatarUrl?: string | null;
  };
  slot?: {
    start: string;
    end: string;
  };
};

function getApiBase(): string | null {
  let b = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  b = b.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  if (!b) return null;
  try {
    new URL(b);
    return b;
  } catch {
    return null;
  }
}

export default function AppointmentsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const apiBase = useMemo(() => getApiBase(), []);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [actionId, setActionId] = useState<string | null>(null);
  const [showReschedule, setShowReschedule] = useState<string | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  function buildUrl(path: string) {
    return apiBase ? `${apiBase}${path}` : `/api-proxy${path}`;
  }

  async function authedFetch(path: string, init?: RequestInit) {
    if (!token) throw new Error('Non authentifié');
    const headers: Record<string, string> = { ...(init?.headers as any) };
    headers['Authorization'] = `Bearer ${token}`;
    if (init?.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    const r = await fetch(buildUrl(path), {
      ...init,
      headers,
      cache: 'no-store',
    });
    if (!r.ok) {
      const t = await r.text().catch(() => '');
      throw new Error(`HTTP ${r.status}${t ? ` — ${t}` : ''}`);
    }
    return r;
  }

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const r = await authedFetch('/appointments', { method: 'GET' });
      const data = await r.json();
      const list = Array.isArray(data) ? data : data?.data || [];
      setAppointments(list);
    } catch (e: any) {
      if (e.message?.includes('Non authentifié')) router.replace('/auth/login');
      else setErr(e.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) {
      router.replace('/auth/login');
      return;
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function updateStatus(id: string, status: AppointmentStatus) {
    setActionId(id);
    setErr(null);
    try {
      await authedFetch(`/appointments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a)),
      );
    } catch (e: any) {
      setErr(e.message || 'Impossible de mettre à jour le rendez-vous');
    } finally {
      setActionId(null);
    }
  }

  async function handleReschedule(id: string) {
    if (!newDate || !newTime) {
      setErr('Veuillez saisir une nouvelle date et heure.');
      return;
    }
    const iso = new Date(`${newDate}T${newTime}:00`).toISOString();
    setActionId(id);
    setErr(null);
    try {
      await authedFetch(`/appointments/${id}/reschedule`, {
        method: 'PATCH',
        body: JSON.stringify({ newStart: iso }),
      });
      await load();
      setShowReschedule(null);
      setNewDate('');
      setNewTime('');
    } catch (e: any) {
      setErr(e.message || 'Impossible de déplacer le rendez-vous');
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.headerTitle}>Mes rendez-vous</h1>
      {err && <div className="banner error">{err}</div>}

      {loading ? (
        <div className="card">Chargement…</div>
      ) : appointments.length === 0 ? (
        <div className="card">Aucun rendez-vous pour le moment.</div>
      ) : (
        <div className={`card ${styles.tableWrapper}`}>
          <table className={styles.table}>
            <thead>
              <tr className={styles.theadRow}>
                <th className={styles.th}>Patient</th>
                <th className={styles.th}>Date</th>
                <th className={styles.th}>Type</th>
                <th className={styles.th}>Statut</th>
                <th className={styles.th}>Notes</th>
                <th className={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a.id} className={styles.tr}>
                  <td className={styles.td}>
                    <div className={styles.patientCell}>
                      <AvatarMini
                        src={a.patient?.avatarUrl ?? null}
                        name={
                          a.patient?.fullName ||
                          a.patient?.email ||
                          'Patient'
                        }
                      />
                      <div>
                        <div className={styles.patientName}>
                          {a.patient?.fullName ||
                            a.patient?.email ||
                            'Patient'}
                        </div>
                        {a.patient?.email && (
                          <div className={styles.patientEmail}>
                            {a.patient.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className={styles.td}>
                    {a.slot?.start
                      ? new Date(a.slot.start).toLocaleString('fr-FR')
                      : '—'}
                  </td>
                  <td className={styles.td}>{humanizeType(a.type)}</td>
                  <td className={styles.td}>
                    <StatusPill status={a.status} />
                  </td>
                  <td className={styles.td}>{a.notes || '—'}</td>
                  <td className={styles.td}>
                    <div className={styles.actionsCell}>
                      {a.status !== 'CONFIRMED' && (
                        <button
                          disabled={actionId === a.id}
                          onClick={() => updateStatus(a.id, 'CONFIRMED')}
                          className={`btn ${styles.btnTiny}`}
                        >
                          Confirmer
                        </button>
                      )}
                      {a.status !== 'CANCELLED' && (
                        <button
                          disabled={actionId === a.id}
                          onClick={() => updateStatus(a.id, 'CANCELLED')}
                          className={`btn ${styles.btnDanger}`}
                        >
                          Refuser
                        </button>
                      )}
                      <button
                        disabled={actionId === a.id}
                        onClick={() => {
                          setShowReschedule(a.id);
                          setNewDate('');
                          setNewTime('');
                        }}
                        className={`btn outline ${styles.btnTiny}`}
                      >
                        Déplacer
                      </button>
                    </div>
                    {showReschedule === a.id && (
                      <div className={styles.rescheduleRow}>
                        <input
                          type="date"
                          value={newDate}
                          onChange={(e) => setNewDate(e.target.value)}
                          className={styles.rescheduleInput}
                        />
                        <input
                          type="time"
                          value={newTime}
                          onChange={(e) => setNewTime(e.target.value)}
                          className={styles.rescheduleInput}
                        />
                        <button
                          onClick={() => handleReschedule(a.id)}
                          className={`btn primary ${styles.btnTiny}`}
                        >
                          OK
                        </button>
                        <button
                          onClick={() => setShowReschedule(null)}
                          className={`btn ${styles.btnGhost}`}
                        >
                          Annuler
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
    <div className={styles.avatarFallback}>
      {initials || 'U'}
    </div>
  );
}

function StatusPill({ status }: { status: AppointmentStatus }) {
  const base = styles.statusPill;
  if (status === 'PENDING') {
    return (
      <span className={`${base} ${styles.statusPending}`}>
        En attente
      </span>
    );
  }
  if (status === 'CONFIRMED') {
    return (
      <span className={`${base} ${styles.statusConfirmed}`}>
        Confirmé
      </span>
    );
  }
  if (status === 'CANCELLED') {
    return (
      <span className={`${base} ${styles.statusCancelled}`}>
        Annulé
      </span>
    );
  }
  return (
    <span className={`${base} ${styles.statusNoShow}`}>
      Absent
    </span>
  );
}

function humanizeType(t?: string) {
  if (!t) return 'Rendez-vous';
  const v = t.toUpperCase();
  if (v.includes('PREMIERE')) return 'Première consultation';
  if (v.includes('SUIVI')) return 'Suivi';
  if (v.includes('URGENCE')) return 'Urgence';
  return t;
}