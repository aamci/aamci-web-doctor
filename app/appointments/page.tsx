'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../_providers/AuthProvider';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

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
  const { user } = useAuth();
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
    return apiBase ? `${apiBase}${path}` : `/api${path}`;
  }

  async function authedFetch(path: string, init?: RequestInit) {
    const headers: Record<string, string> = { ...(init?.headers as any) };
    if (init?.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    // Ajouter le token JWT depuis localStorage pour cross-origin
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const r = await fetch(buildUrl(path), {
      ...init,
      headers,
      credentials: 'include',
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
    if (!user) {
      router.replace('/auth/login');
      return;
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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

  const pending = appointments.filter((a) => a.status === 'PENDING');
  const confirmed = appointments.filter((a) => a.status === 'CONFIRMED');
  const cancelled = appointments.filter((a) => a.status === 'CANCELLED');

  const tabs = [
    { value: 'PENDING', label: 'En attente', data: pending },
    { value: 'CONFIRMED', label: 'Confirmés', data: confirmed },
    { value: 'CANCELLED', label: 'Annulés', data: cancelled },
    { value: 'ALL', label: 'Tous', data: appointments },
  ] as const;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Mes rendez-vous</h1>
          <p className="text-sm text-slate-500">
            Gérez les demandes, confirmations et annulations de vos patients.
          </p>
        </div>
      </div>

      {err && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      )}

      {loading ? (
        <Card>
          <CardContent className="py-6 text-sm text-slate-600">Chargement…</CardContent>
        </Card>
      ) : appointments.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-sm text-slate-600">
            Aucun rendez-vous pour le moment.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Rendez-vous patients</CardTitle>
            <CardDescription className="text-xs">
              Les rendez-vous annulés ne sont plus modifiables, mais restent visibles dans l’historique.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-0">
            <Tabs defaultValue="PENDING" className="w-full">
              <TabsList className="mb-3 flex w-fit gap-1 rounded-full bg-slate-900 px-1 py-1 text-xs text-slate-200">
                {tabs.map((t) => {
                  const count = t.data.length;
                  const isMain = t.value === 'PENDING';
                  return (
                    <TabsTrigger
                      key={t.value}
                      value={t.value}
                      className="flex items-center gap-2 rounded-full px-3 py-1 data-[state=active]:bg-slate-700 data-[state=active]:text-white data-[state=inactive]:bg-transparent data-[state=inactive]:text-slate-200"
                    >
                      <span>{t.label}</span>
                      {count > 0 && (
                        <span
                          className={`inline-flex h-5 min-w-[1.4rem] items-center justify-center rounded-full px-1 text-[11px] ${
                            isMain
                              ? 'bg-white text-slate-900'
                              : 'bg-slate-800 text-slate-100'
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {tabs.map((t) => (
                <TabsContent key={t.value} value={t.value}>
                  <AppointmentsTable
                    items={t.value === 'ALL' ? appointments : t.data}
                    actionId={actionId}
                    onConfirm={(id) => updateStatus(id, 'CONFIRMED')}
                    onCancel={(id) => updateStatus(id, 'CANCELLED')}
                    onOpenReschedule={(id) => {
                      setShowReschedule(id);
                      setNewDate('');
                      setNewTime('');
                    }}
                    showReschedule={showReschedule}
                    newDate={newDate}
                    newTime={newTime}
                    setNewDate={setNewDate}
                    setNewTime={setNewTime}
                    onReschedule={handleReschedule}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

type TableProps = {
  items: Appointment[];
  actionId: string | null;
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
  onOpenReschedule: (id: string) => void;
  onReschedule: (id: string) => void;
  showReschedule: string | null;
  newDate: string;
  newTime: string;
  setNewDate: (v: string) => void;
  setNewTime: (v: string) => void;
};

function AppointmentsTable({
  items,
  actionId,
  onConfirm,
  onCancel,
  onOpenReschedule,
  onReschedule,
  showReschedule,
  newDate,
  newTime,
  setNewDate,
  setNewTime,
}: TableProps) {
  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[720px]">
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead>Patient</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="w-56"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((a) => {
            const disabled = actionId === a.id || a.status === 'CANCELLED';
            const start = a.slot?.start ? new Date(a.slot.start) : null;
            const end = a.slot?.end ? new Date(a.slot.end) : null;
            const name = a.patient?.fullName || a.patient?.email || 'Patient';

            return (
              <TableRow key={a.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      {a.patient?.avatarUrl && (
                        <AvatarImage src={a.patient.avatarUrl} alt={name} />
                      )}
                      <AvatarFallback className="text-xs">
                        {name
                          .split(' ')
                          .map((p) => p.charAt(0).toUpperCase())
                          .slice(0, 2)
                          .join('') || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium text-slate-900">
                        {name}
                      </div>
                      {a.patient?.email && (
                        <div className="text-xs text-slate-500">
                          {a.patient.email}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="align-top text-sm">
                  {start ? (
                    <>
                      <div>
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
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </TableCell>
                <TableCell className="align-top">
                  <Badge variant="outline" className="text-[11px]">
                    {humanizeType(a.type)}
                  </Badge>
                </TableCell>
                <TableCell className="align-top">
                  <StatusPill status={a.status} />
                </TableCell>
                <TableCell className="align-top text-xs text-slate-600">
                  {a.notes || '—'}
                </TableCell>
                <TableCell className="align-top">
                {a.status === 'CANCELLED' ? (
                  <span className="text-xs text-slate-500">
                    Rendez-vous annulé par le patient.
                  </span>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap gap-2">
                      {a.status !== 'CONFIRMED' && (
                        <Button
                          size="sm"
                          disabled={disabled}
                          onClick={() => onConfirm(a.id)}
                        >
                          Confirmer
                        </Button>
                      )}

                      {/* ⬇️ plus besoin de tester "!== 'CANCELLED'" ici */}
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={disabled}
                        onClick={() => onCancel(a.id)}
                      >
                        Refuser
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        disabled={disabled}
                        onClick={() => onOpenReschedule(a.id)}
                      >
                        Déplacer
                      </Button>
                    </div>

                    {showReschedule === a.id && (
                      <div className="flex flex-wrap items-center gap-2">
                        <Input
                          type="date"
                          className="h-8 w-36 text-xs"
                          value={newDate}
                          onChange={(e) => setNewDate(e.target.value)}
                        />
                        <Input
                          type="time"
                          className="h-8 w-24 text-xs"
                          value={newTime}
                          onChange={(e) => setNewTime(e.target.value)}
                        />
                        <Button
                          size="sm"
                          className="h-8 px-3 text-xs"
                          onClick={() => onReschedule(a.id)}
                        >
                          OK
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-3 text-xs"
                          onClick={() => onOpenReschedule('')}
                        >
                          Annuler
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function StatusPill({ status }: { status: AppointmentStatus }) {
  const map: Record<AppointmentStatus, { label: string; className: string }> = {
    PENDING: {
      label: 'En attente',
      className: 'bg-amber-50 text-amber-700 border-amber-100',
    },
    CONFIRMED: {
      label: 'Confirmé',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    },
    CANCELLED: {
      label: 'Annulé',
      className: 'bg-rose-50 text-rose-700 border-rose-100',
    },
    NO_SHOW: {
      label: 'Absent',
      className: 'bg-slate-100 text-slate-700 border-slate-200',
    },
  };
  const v = map[status] ?? map.PENDING;
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${v.className}`}
    >
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