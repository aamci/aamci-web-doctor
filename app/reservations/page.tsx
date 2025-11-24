'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'NO_SHOW';

type Appointment = {
  id: string;
  status: AppointmentStatus;
  notes?: string | null;
  type?: string | null;
  slot?: {
    start?: string;
    end?: string;
  } | null;
  patient?: {
    email?: string;
    fullName?: string;
    avatarUrl?: string | null;
  } | null;
};

// helper pour récupérer la base API proprement
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

// fetch avec token + fallback /api-proxy si tu l’utilises
async function authedFetch(path: string, init?: RequestInit) {
  const base = getApiBase();
  const url = base ? `${base}${path}` : path;

  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (!token) throw new Error('Non authentifié');

  const headers: Record<string, string> = {
    ...(init?.headers as any),
    Authorization: `Bearer ${token}`,
  };
  if (init?.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, { ...init, headers, cache: 'no-store' });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}${t ? ` — ${t}` : ''}`);
  }
  return res;
}

export default function ReservationsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/auth/login');
      return;
    }

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await authedFetch('/appointments');
        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.data || [];
        setAppointments(list);
      } catch (e: any) {
        if (String(e?.message || '').includes('Non authentifié')) {
          router.replace('/auth/login');
        } else {
          setErr(e?.message || 'Erreur de chargement');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          Chargement…
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Erreur : {err}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            Mes rendez-vous
          </h1>
          <p className="text-sm text-slate-500">
            Vue d’ensemble des réservations patients sur vos créneaux.
          </p>
        </div>
      </div>

      {appointments.length === 0 ? (
        <div className="rounded-2xl border bg-white p-4 text-sm text-slate-600 shadow-sm">
          Aucun rendez-vous pour l&apos;instant.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Date & heure</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => {
                const start = a.slot?.start ? new Date(a.slot.start) : null;
                const end = a.slot?.end ? new Date(a.slot.end) : null;
                const name =
                  a.patient?.fullName || a.patient?.email || 'Patient';

                return (
                  <tr
                    key={a.id}
                    className="border-t last:border-b hover:bg-slate-50/60"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <AvatarSmall
                          name={name}
                          src={a.patient?.avatarUrl || null}
                        />
                        <div>
                          <div className="font-medium text-slate-900">
                            {name}
                          </div>
                          {a.patient?.email && (
                            <div className="text-xs text-slate-500">
                              {a.patient.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {start ? (
                        <>
                          <div className="text-sm text-slate-900">
                            {start.toLocaleDateString('fr-FR', {
                              weekday: 'short',
                              day: '2-digit',
                              month: 'short',
                            })}
                          </div>
                          <div className="text-xs text-slate-500">
                            {start.toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            {end &&
                              ` – ${end.toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}`}
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Horaire non défini
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-700">
                        {a.type || 'Consultation'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-600">
                        {a.notes || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={a.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AvatarSmall({ src, name }: { src: string | null; name: string }) {
  const initials = name?.charAt(0)?.toUpperCase() || 'U';
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className="h-8 w-8 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="grid h-8 w-8 place-items-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
      {initials}
    </div>
  );
}

function StatusPill({ status }: { status: AppointmentStatus }) {
  const map: Record<
    AppointmentStatus,
    { label: string; className: string }
  > = {
    PENDING: {
      label: 'En attente',
      className: 'bg-amber-50 text-amber-700',
    },
    CONFIRMED: {
      label: 'Confirmé',
      className: 'bg-emerald-50 text-emerald-700',
    },
    CANCELLED: {
      label: 'Annulé',
      className: 'bg-rose-50 text-rose-700',
    },
    NO_SHOW: {
      label: 'Absent',
      className: 'bg-slate-100 text-slate-700',
    },
  };
  const v = map[status] ?? map.PENDING;
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${v.className}`}
    >
      {v.label}
    </span>
  );
}