'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../_providers/AuthProvider';
import {
  ChevronLeft, ChevronRight, RefreshCw, LayoutGrid,
  Clock, User, CheckCircle, XCircle, AlertCircle, Calendar,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

type Slot = {
  id?: string;
  doctorId: string;
  startTime: string;  // normalised to `start` from API
  endTime: string;
  appointment?: {
    id: string;
    status: string;
    checkedInAt?: string | null;
    patient: { fullName: string | null; email: string };
    kind: { name: string } | null;
  } | null;
};

type Doctor = {
  id: string;
  fullName: string | null;
  email: string;
  avatarUrl: string | null;
  doctorProfile: { specialty: string | null } | null;
};

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7h → 19h

const STATUS_COLORS: Record<string, string> = {
  PENDING:   'bg-amber-100 border-amber-400 text-amber-900 dark:bg-amber-900/30 dark:border-amber-500 dark:text-amber-200',
  CONFIRMED: 'bg-green-100 border-green-400 text-green-900 dark:bg-green-900/30 dark:border-green-500 dark:text-green-200',
  CANCELLED: 'bg-red-100 border-red-300 text-red-700 dark:bg-red-900/20 dark:border-red-500 dark:text-red-300 opacity-60',
  COMPLETED: 'bg-slate-100 border-slate-300 text-slate-600 dark:bg-slate-700 dark:border-slate-500 dark:text-slate-300',
  NO_SHOW:   'bg-orange-100 border-orange-300 text-orange-700 dark:bg-orange-900/20 dark:border-orange-500 dark:text-orange-300',
  FREE:      'bg-white border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500',
};

function authHeaders(token: string | null) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function localDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function initials(name: string | null) {
  if (!name) return '?';
  return name.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
}

function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function SlotBlock({ slot }: { slot: Slot }) {
  const appt = slot.appointment;
  const status = appt?.status ?? 'FREE';
  const colorClass = STATUS_COLORS[status] ?? STATUS_COLORS.FREE;
  const startH = new Date(slot.startTime).getHours() + new Date(slot.startTime).getMinutes() / 60;
  const endH   = new Date(slot.endTime).getHours()   + new Date(slot.endTime).getMinutes() / 60;
  const top    = (startH - 7) * 60; // px (1h = 60px)
  const height = Math.max((endH - startH) * 60, 24);

  return (
    <div
      className={`absolute left-1 right-1 rounded-md border text-xs px-1.5 py-1 overflow-hidden ${colorClass}`}
      style={{ top: `${top}px`, height: `${height}px` }}
      title={appt ? `${appt.patient.fullName ?? appt.patient.email} — ${appt.kind?.name ?? 'Consultation'}` : 'Libre'}
    >
      {appt ? (
        <>
          <p className="font-semibold truncate leading-tight">{appt.patient.fullName ?? appt.patient.email}</p>
          <p className="truncate opacity-75">{fmtTime(slot.startTime)} · {appt.kind?.name ?? 'Consultation'}</p>
          {appt.checkedInAt && (
            <CheckCircle className="w-3 h-3 absolute top-1 right-1 text-emerald-500" />
          )}
        </>
      ) : (
        <p className="truncate">{fmtTime(slot.startTime)} Libre</p>
      )}
    </div>
  );
}

export default function MultiAgendaPage() {
  const { user } = useAuth();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const [date, setDate] = useState(new Date());
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [slots, setSlots] = useState<Record<string, Slot[]>>({}); // doctorId → slots
  const [loading, setLoading] = useState(true);

  const loadDoctors = useCallback(async () => {
    const res = await fetch(`${API_BASE}/facility-managers/me/doctors`, {
      headers: authHeaders(token),
    });
    if (res.ok) setDoctors(await res.json());
  }, [token]);

  const loadSlots = useCallback(async (doctorList: Doctor[], d: Date) => {
    setLoading(true);
    const dateStr = localDateStr(d);
    const results: Record<string, Slot[]> = {};

    await Promise.all(doctorList.map(async (doc) => {
      try {
        const res = await fetch(
          `${API_BASE}/facility-managers/me/appointments?doctorId=${doc.id}&date=${dateStr}`,
          { headers: authHeaders(token) },
        );
        if (res.ok) {
          const data = await res.json();
          const appts: any[] = Array.isArray(data) ? data : data.appointments ?? [];
          results[doc.id] = appts.map((a: any) => ({
            doctorId: doc.id,
            startTime: a.slot?.start ?? '',
            endTime:   a.slot?.end   ?? '',
            appointment: {
              id: a.id,
              status: a.status,
              checkedInAt: a.checkedInAt,
              patient: a.patient,
              kind: a.kind,
            },
          }));
        } else {
          results[doc.id] = [];
        }
      } catch {
        results[doc.id] = [];
      }
    }));

    setSlots(results);
    setLoading(false);
  }, [token]);

  useEffect(() => { loadDoctors(); }, [loadDoctors]);
  useEffect(() => {
    if (doctors.length > 0) loadSlots(doctors, date);
  }, [doctors, date, loadSlots]);

  const shift = (n: number) => setDate(d => { const nd = new Date(d); nd.setDate(nd.getDate() + n); return nd; });

  const dayLabel = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const isToday = localDateStr(date) === localDateStr(new Date());

  return (
    <div className="p-4 md:p-6 space-y-4 h-screen flex flex-col overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-violet-500" />
            Multi-agenda
          </h1>
          <p className="text-sm text-muted-foreground capitalize">{dayLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => shift(-1)} className="p-2 rounded-lg border border-border hover:bg-muted">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDate(new Date())}
            className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${isToday ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}
          >
            Aujourd'hui
          </button>
          <button onClick={() => shift(1)} className="p-2 rounded-lg border border-border hover:bg-muted">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => loadSlots(doctors, date)}
            className="p-2 rounded-lg border border-border hover:bg-muted"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-3 text-xs flex-shrink-0 flex-wrap">
        {[['PENDING','En attente'],['CONFIRMED','Confirmé'],['CANCELLED','Annulé'],['COMPLETED','Terminé'],['NO_SHOW','Absent']].map(([s, l]) => (
          <span key={s} className={`px-2 py-0.5 rounded border ${STATUS_COLORS[s]}`}>{l}</span>
        ))}
        <span className="flex items-center gap-1 text-emerald-600"><CheckCircle className="w-3 h-3" /> Check-in</span>
      </div>

      {/* Grid */}
      {doctors.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>Aucun médecin géré</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto rounded-xl border border-border">
          <div className="flex min-w-max">

            {/* Hour axis */}
            <div className="w-14 flex-shrink-0 border-r border-border">
              <div className="h-16 border-b border-border" /> {/* header placeholder */}
              <div className="relative" style={{ height: `${13 * 60}px` }}>
                {HOURS.map(h => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 flex items-center justify-end pr-2 text-[10px] text-muted-foreground border-t border-border/50"
                    style={{ top: `${(h - 7) * 60}px`, height: '60px' }}
                  >
                    {String(h).padStart(2, '0')}h
                  </div>
                ))}
              </div>
            </div>

            {/* Doctor columns */}
            {doctors.map(doc => (
              <div key={doc.id} className="flex-shrink-0 w-48 border-r border-border last:border-r-0">
                {/* Doctor header */}
                <div className="h-16 border-b border-border p-2 flex items-center gap-2 bg-muted/30 sticky top-0 z-10">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                    {doc.avatarUrl
                      ? <img src={doc.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                      : initials(doc.fullName)
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{doc.fullName ?? doc.email}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{doc.doctorProfile?.specialty ?? 'Médecin'}</p>
                  </div>
                </div>

                {/* Slot grid */}
                <div className="relative bg-background" style={{ height: `${13 * 60}px` }}>
                  {/* Hour grid lines */}
                  {HOURS.map(h => (
                    <div
                      key={h}
                      className="absolute left-0 right-0 border-t border-border/30"
                      style={{ top: `${(h - 7) * 60}px`, height: '60px' }}
                    />
                  ))}

                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : (slots[doc.id] ?? []).length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-xs text-muted-foreground">Pas de RDV</p>
                    </div>
                  ) : (slots[doc.id] ?? []).map((slot, i) => (
                    <SlotBlock key={i} slot={slot} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
