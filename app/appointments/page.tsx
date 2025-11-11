'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../_providers/AuthProvider';

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
    if (init?.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
    const r = await fetch(buildUrl(path), { ...init, headers, cache: 'no-store' });
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
      // j’accepte 2 formats : array direct ou {data:[]}
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
    load();
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
      setAppointments(prev =>
        prev.map(a => (a.id === id ? { ...a, status } : a)),
      );
    } catch (e: any) {
      setErr(e.message || 'Impossible de mettre à jour le rendez-vous');
    } finally {
      setActionId(null);
    }
  }

  // reschedule = déplacer
  async function handleReschedule(id: string) {
    if (!newDate || !newTime) {
      setErr('Veuillez saisir une nouvelle date et heure.');
      return;
    }
    // on envoie la nouvelle date dans un champ "newStart"
    const iso = new Date(`${newDate}T${newTime}:00`).toISOString();
    setActionId(id);
    setErr(null);
    try {
      await authedFetch(`/appointments/${id}/reschedule`, {
        method: 'PATCH',
        body: JSON.stringify({ newStart: iso }),
      });
      // on rafraîchit tout simplement la liste
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
    <div style={{ padding: '24px 0', display: 'grid', gap: 16 }}>
      <h1>Mes rendez-vous</h1>
      {err && <div className="banner error">{err}</div>}

      {loading ? (
        <div className="card">Chargement…</div>
      ) : appointments.length === 0 ? (
        <div className="card">Aucun rendez-vous pour le moment.</div>
      ) : (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={th}>Patient</th>
                <th style={th}>Date</th>
                <th style={th}>Type</th>
                <th style={th}>Statut</th>
                <th style={th}>Notes</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {appointments.map(a => (
                <tr key={a.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={td}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <AvatarMini src={a.patient?.avatarUrl ?? null} name={a.patient?.fullName || a.patient?.email || 'Patient'} />
                      <div>
                        <div style={{ fontWeight: 500 }}>
                          {a.patient?.fullName || a.patient?.email || 'Patient'}
                        </div>
                        <div style={{ fontSize: 11, color: '#777' }}>{a.patient?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={td}>
                    {a.slot?.start
                      ? new Date(a.slot.start).toLocaleString('fr-FR')
                      : '—'}
                  </td>
                  <td style={td}>
                    {humanizeType(a.type)}
                  </td>
                  <td style={td}>
                    <StatusPill status={a.status} />
                  </td>
                  <td style={td}>{a.notes || '—'}</td>
                  <td style={td}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {a.status !== 'CONFIRMED' && (
                        <button
                          disabled={actionId === a.id}
                          onClick={() => updateStatus(a.id, 'CONFIRMED')}
                          className="btn"
                          style={{ fontSize: 11, padding: '3px 8px' }}
                        >
                          Confirmer
                        </button>
                      )}
                      {a.status !== 'CANCELLED' && (
                        <button
                          disabled={actionId === a.id}
                          onClick={() => updateStatus(a.id, 'CANCELLED')}
                          className="btn"
                          style={{ fontSize: 11, padding: '3px 8px', background: '#fee2e2', color: '#b91c1c' }}
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
                        className="btn outline"
                        style={{ fontSize: 11, padding: '3px 8px' }}
                      >
                        Déplacer
                      </button>
                    </div>
                    {showReschedule === a.id && (
                      <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
                        <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} />
                        <button
                          onClick={() => handleReschedule(a.id)}
                          className="btn primary"
                          style={{ fontSize: 11, padding: '3px 8px' }}
                        >
                          OK
                        </button>
                        <button
                          onClick={() => setShowReschedule(null)}
                          className="btn"
                          style={{ fontSize: 11, padding: '3px 8px', background: '#f3f4f6' }}
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

const th: React.CSSProperties = { textAlign: 'left', padding: '8px 6px', fontSize: 12, color: '#475569' };
const td: React.CSSProperties = { padding: '8px 6px', fontSize: 13, verticalAlign: 'top' };

function AvatarMini({ src, name }: { src: string | null; name: string }) {
  const initials = name
    .split(' ')
    .map(p => p.charAt(0).toUpperCase())
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
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {initials || 'U'}
    </div>
  );
}

function StatusPill({ status }: { status: AppointmentStatus }) {
  const m: Record<AppointmentStatus, { label: string; bg: string; color: string }> = {
    PENDING: { label: 'En attente', bg: '#fef9c3', color: '#854d0e' },
    CONFIRMED: { label: 'Confirmé', bg: '#dcfce7', color: '#166534' },
    CANCELLED: { label: 'Annulé', bg: '#fee2e2', color: '#b91c1c' },
    NO_SHOW: { label: 'Absent', bg: '#e2e8f0', color: '#475569' },
  };
  const v = m[status];
  return (
    <span style={{ background: v.bg, color: v.color, padding: '2px 8px', borderRadius: 999, fontSize: 11 }}>
      {v.label}
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