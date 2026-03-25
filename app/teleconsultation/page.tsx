'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../_providers/AuthProvider';
import {
  Video, Calendar, Clock, Search, ChevronRight, Users,
  Loader2, AlertCircle, CheckCircle, Timer, Plus,
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

interface Appointment {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'NO_SHOW' | 'COMPLETED';
  notes?: string | null;
  videoSessionId?: string | null;
  videoStartedAt?: string | null;
  videoEndedAt?: string | null;
  slot: { start: string; end: string };
  patient?: { id: string; fullName: string | null; email: string; avatarUrl?: string | null };
  kind?: { id: string; name: string; durationMins: number; isTelemedicine: boolean };
  createdAt: string;
}

type DateFilter = 'today' | 'upcoming' | 'past' | 'all';

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Planifiée',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
  NO_SHOW: 'Absent',
};

const STATUS_COLOR: Record<string, string> = {
  PENDING:   'text-amber-600 bg-amber-50 border-amber-200',
  CONFIRMED: 'text-blue-600 bg-blue-50 border-blue-200',
  COMPLETED: 'text-gray-600 bg-gray-50 border-gray-200',
  CANCELLED: 'text-red-600 bg-red-50 border-red-200',
  NO_SHOW:   'text-orange-600 bg-orange-50 border-orange-200',
};

function initials(name?: string | null) {
  if (!name) return '?';
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

function fmtDateTime(d: string) {
  return new Date(d).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function waitingMins(startedAt: string) {
  return Math.round((Date.now() - new Date(startedAt).getTime()) / 60000);
}

function sessionDuration(startedAt: string, endedAt: string) {
  return Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60000);
}

function slotDuration(start: string, end: string) {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
}

export default function TeleconsultationPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');

  // Refresh waiting-time display every 30s without re-fetching
  const [, setTick] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(iv);
  }, []);

  const fetchAppointments = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE_URL}/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data: Appointment[] = await res.json();
        // Filtre strictement sur le champ isTelemedicine de la base
        setAppointments(data.filter(a => a.kind?.isTelemedicine === true));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const join = (id: string) => router.push(`/visio/${id}`);

  // ── Date boundaries ───────────────────────────────────────────
  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const todayEnd   = new Date(todayStart); todayEnd.setDate(todayEnd.getDate() + 1);

  // ── Filtered list for the table ───────────────────────────────
  const filtered = appointments.filter(a => {
    const start = new Date(a.slot.start);
    if (dateFilter === 'today')    { if (start < todayStart || start >= todayEnd) return false; }
    if (dateFilter === 'upcoming') { if (start <= now) return false; }
    if (dateFilter === 'past')     { if (start >= todayStart) return false; }
    if (search) {
      const q = search.toLowerCase();
      if (!(a.patient?.fullName?.toLowerCase().includes(q) ?? false)) return false;
    }
    return true;
  });

  // ── Waiting room: CONFIRMED/PENDING today, session started but not ended ──
  const waitingRoom = appointments.filter(a => {
    const start = new Date(a.slot.start);
    return start >= todayStart
      && start < todayEnd
      && (a.status === 'CONFIRMED' || a.status === 'PENDING')
      && !!a.videoStartedAt
      && !a.videoEndedAt;
  });

  // ── Stats computed from real data ─────────────────────────────
  const todayAppts    = appointments.filter(a => { const s = new Date(a.slot.start); return s >= todayStart && s < todayEnd; });
  const pendingAppts  = appointments.filter(a => a.status === 'PENDING' || a.status === 'CONFIRMED');
  const inProgress    = appointments.filter(a => !!a.videoStartedAt && !a.videoEndedAt);
  const completed     = appointments.filter(a => !!a.videoEndedAt);

  const canJoin = (a: Appointment) => a.status === 'CONFIRMED' || a.status === 'PENDING';

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center">
              <Video className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Téléconsultations</h1>
              <p className="text-xs text-gray-500">
                {appointments.length} session{appointments.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/planning')}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors shadow-sm"
          >
            <Calendar className="w-4 h-4" />
            Créer depuis l'agenda
          </button>
        </div>

        {/* Stats — all from real data */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            {
              icon: <Calendar className="w-5 h-5 text-blue-600" />,
              value: todayAppts.length,
              label: "Aujourd'hui",
              onClick: () => setDateFilter('today'),
              active: dateFilter === 'today',
            },
            {
              icon: <AlertCircle className="w-5 h-5 text-amber-500" />,
              value: pendingAppts.length,
              label: 'En attente',
              onClick: undefined,
              active: false,
            },
            {
              icon: <Video className="w-5 h-5 text-green-600" />,
              value: inProgress.length,
              label: 'En cours',
              onClick: undefined,
              active: false,
            },
            {
              icon: <CheckCircle className="w-5 h-5 text-gray-500" />,
              value: completed.length,
              label: 'Terminées',
              onClick: undefined,
              active: false,
            },
          ].map((s, i) => (
            <button
              key={i}
              onClick={s.onClick}
              className={`flex items-center gap-4 p-4 rounded-xl border bg-white text-left transition-all
                ${s.onClick ? 'cursor-pointer hover:border-slate-400' : 'cursor-default'}
                ${s.active ? 'border-slate-800 ring-1 ring-slate-800/10 shadow-sm' : 'border-gray-200'}`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.active ? 'bg-slate-100' : 'bg-gray-50'}`}>
                {s.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Waiting room — only shown when populated */}
        {waitingRoom.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-5 p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                Salle d'attente ({waitingRoom.length})
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {waitingRoom.map(appt => (
                <div key={appt.id} className="flex flex-col items-center gap-2 p-4 border border-gray-100 rounded-xl bg-gray-50 w-44 text-center">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-semibold text-sm">
                    {initials(appt.patient?.fullName)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate w-32">
                      {appt.patient?.fullName ?? '—'}
                    </p>
                    <p className="text-xs text-gray-400 truncate w-32">
                      {appt.kind?.name ?? 'Téléconsultation'}
                    </p>
                    <p className="text-xs text-amber-600 font-medium mt-1">
                      En attente depuis {waitingMins(appt.videoStartedAt!)} min
                    </p>
                  </div>
                  <button
                    onClick={() => join(appt.id)}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors w-full justify-center"
                  >
                    <Video className="w-3.5 h-3.5" /> Rejoindre
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search + date filters */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un patient…"
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-1">
            {([
              { key: 'today' as DateFilter, label: "Aujourd'hui", count: todayAppts.length },
              { key: 'upcoming' as DateFilter, label: 'À venir', count: null },
              { key: 'past' as DateFilter, label: 'Passées', count: null },
              { key: 'all' as DateFilter, label: 'Toutes', count: appointments.length },
            ]).map(f => (
              <button
                key={f.key}
                onClick={() => setDateFilter(f.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
                  ${dateFilter === f.key ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {f.label}
                {f.count !== null && f.count > 0 && (
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold
                    ${dateFilter === f.key ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Video className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="font-medium text-gray-500">Aucune téléconsultation</p>
              <p className="text-sm text-gray-400 mt-1">
                Créez un type de RDV avec &quot;Télémédecine&quot; activé puis planifiez depuis votre agenda
              </p>
              <button
                onClick={() => router.push('/planning')}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm mx-auto hover:bg-slate-700"
              >
                <Plus className="w-4 h-4" /> Créer depuis l'agenda
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_80px] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <span>Patient</span>
                <span>Date / Heure</span>
                <span>Motif</span>
                <span>Statut</span>
                <span>Durée</span>
                <span className="text-right">Actions</span>
              </div>

              <div className="divide-y divide-gray-50">
                {filtered.map(appt => {
                  const sessionActive = !!appt.videoStartedAt && !appt.videoEndedAt;
                  const dot = sessionActive ? 'bg-green-500' :
                    (appt.status === 'CONFIRMED' || appt.status === 'PENDING') ? 'bg-blue-400' : 'bg-gray-300';

                  let durationLabel: string;
                  if (appt.videoStartedAt && appt.videoEndedAt) {
                    durationLabel = `${sessionDuration(appt.videoStartedAt, appt.videoEndedAt)} min`;
                  } else {
                    durationLabel = `~${slotDuration(appt.slot.start, appt.slot.end)} min`;
                  }

                  return (
                    <div
                      key={appt.id}
                      className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_80px] gap-4 items-center px-5 py-4 hover:bg-gray-50/70 transition-colors group"
                    >
                      {/* Patient */}
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-semibold flex-shrink-0">
                          {initials(appt.patient?.fullName)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {appt.patient?.fullName ?? '—'}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            ⟳ Lié au RDV du {fmtDateTime(appt.slot.start)}
                          </p>
                        </div>
                      </div>

                      {/* Date */}
                      <p className="text-sm text-gray-700">{fmtDateTime(appt.slot.start)}</p>

                      {/* Motif — vient de kind.name en base */}
                      <p className="text-sm text-gray-600 truncate">
                        {appt.kind?.name ?? '—'}
                      </p>

                      {/* Status */}
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border w-fit ${STATUS_COLOR[appt.status]}`}>
                        {sessionActive && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
                        {sessionActive ? 'En cours' : (STATUS_LABEL[appt.status] ?? appt.status)}
                      </span>

                      {/* Duration */}
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Timer className="w-3.5 h-3.5 text-gray-400" />
                        {durationLabel}
                      </div>

                      {/* Action */}
                      <div className="flex justify-end">
                        {canJoin(appt) ? (
                          <button
                            onClick={() => join(appt.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors"
                          >
                            <Video className="w-3.5 h-3.5" /> Visio
                          </button>
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
