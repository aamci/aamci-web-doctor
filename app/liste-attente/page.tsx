'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '../_providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { Clock, Users, Bell, Trash2, Loader2, AlertTriangle, RefreshCw, Phone, Mail } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

type WaitlistEntry = {
  id: string;
  date: string;
  position: number;
  status: 'ACTIVE' | 'NOTIFIED' | 'BOOKED' | 'EXPIRED';
  notifiedAt?: string;
  createdAt: string;
  patient: { id: string; fullName?: string | null; email: string; phone?: string | null };
};

type ManagedDoctor = { id: string; fullName: string | null; email: string };

function statusBadge(status: WaitlistEntry['status']) {
  const map = {
    ACTIVE: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    NOTIFIED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    BOOKED: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    EXPIRED: 'bg-slate-700 text-slate-500 border-slate-600',
  };
  const labels = { ACTIVE: 'En attente', NOTIFIED: 'Notifié', BOOKED: 'Réservé', EXPIRED: 'Expiré' };
  return (
    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${map[status]}`}>
      {labels[status]}
    </span>
  );
}

export default function ListeAttentePage() {
  const { user } = useAuth();
  const router = useRouter();

  const isFM = ['FACILITY_MANAGER', 'SECRETARY'].includes(user?.role ?? '');
  const isDoctor = user?.role === 'DOCTOR';

  const [managedDoctors, setManagedDoctors] = useState<ManagedDoctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState('');
  const [removing, setRemoving] = useState<string | null>(null);

  const effectiveDoctorId = useMemo(() => {
    if (isDoctor) return user?.id ?? '';
    return selectedDoctorId;
  }, [isDoctor, user, selectedDoctorId]);

  // Fetch managed doctors for FM/Secretary
  useEffect(() => {
    if (!isFM) return;
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/facility-managers/me/doctors`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d) ? d : [];
        setManagedDoctors(list);
        if (list.length === 1) setSelectedDoctorId(list[0].id);
      })
      .catch(() => {});
  }, [isFM]);

  const load = useCallback(async () => {
    if (!effectiveDoctorId) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (dateFilter) params.set('date', dateFilter);
      const url = `${API_BASE}/waitlist/doctor/${effectiveDoctorId}${params.size ? `?${params}` : ''}`;
      const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) throw new Error(`Erreur ${r.status}`);
      const d = await r.json();
      setEntries(Array.isArray(d) ? d : []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [effectiveDoctorId, dateFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function removeEntry(id: string) {
    setRemoving(id);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/waitlist/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch { /* silent */ } finally {
      setRemoving(null);
    }
  }

  if (!isDoctor && !isFM) {
    return null;
  }

  const grouped = entries.reduce<Record<string, WaitlistEntry[]>>((acc, e) => {
    const day = new Date(e.date).toISOString().slice(0, 10);
    (acc[day] = acc[day] ?? []).push(e);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="pl-20">
        <div className="max-w-5xl mx-auto px-6 py-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Clock className="w-6 h-6 text-teal-400" />
                Liste d&apos;attente
              </h1>
              <p className="text-slate-400 mt-1 text-sm">Patients en attente d&apos;un créneau disponible</p>
            </div>
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition-colors text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>

          {/* Doctor selector (FM only) */}
          {isFM && managedDoctors.length > 1 && (
            <div className="mb-6">
              <label className="text-sm text-slate-400 block mb-2">Médecin</label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full max-w-xs px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500"
              >
                <option value="">Sélectionner un médecin…</option>
                {managedDoctors.map((d) => (
                  <option key={d.id} value={d.id}>{d.fullName ?? d.email}</option>
                ))}
              </select>
            </div>
          )}

          {/* Filters */}
          {effectiveDoctorId && (
            <div className="flex items-center gap-4 mb-6">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Filtrer par date</label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-teal-500"
                />
              </div>
              {dateFilter && (
                <button
                  onClick={() => setDateFilter('')}
                  className="mt-5 text-slate-400 hover:text-white text-sm underline"
                >
                  Effacer le filtre
                </button>
              )}
            </div>
          )}

          {/* Summary */}
          {entries.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'En attente', value: entries.filter(e => e.status === 'ACTIVE').length, color: 'text-blue-400' },
                { label: 'Notifiés', value: entries.filter(e => e.status === 'NOTIFIED').length, color: 'text-emerald-400' },
                { label: 'Total', value: entries.length, color: 'text-slate-300' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Content */}
          {!effectiveDoctorId && isFM ? (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Sélectionnez un médecin pour voir sa liste d&apos;attente</p>
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-sm">Chargement…</span>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-16">
              <Bell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">Aucun patient en liste d&apos;attente</p>
              <p className="text-sm text-slate-500 mt-1">
                Les patients rejoignent automatiquement la liste quand tous les créneaux sont pris.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(grouped)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([day, dayEntries]) => (
                  <div key={day}>
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                      {new Date(day).toLocaleDateString('fr-FR', {
                        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                      })}
                      <span className="ml-2 text-slate-600 font-normal">({dayEntries.length} patient{dayEntries.length > 1 ? 's' : ''})</span>
                    </h3>
                    <div className="space-y-2">
                      {dayEntries
                        .sort((a, b) => a.position - b.position)
                        .map((entry) => (
                          <div
                            key={entry.id}
                            className="flex items-center gap-4 p-4 bg-slate-800 rounded-xl border border-slate-700/60 hover:border-slate-600 transition-colors"
                          >
                            {/* Position */}
                            <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-slate-300 font-bold text-sm flex-shrink-0">
                              {entry.position}
                            </div>

                            {/* Patient info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium text-sm">
                                {entry.patient.fullName || 'Patient inconnu'}
                              </p>
                              <div className="flex items-center gap-3 mt-0.5">
                                <span className="text-slate-500 text-xs flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {entry.patient.email}
                                </span>
                                {entry.patient.phone && (
                                  <span className="text-slate-500 text-xs flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {entry.patient.phone}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Notified at */}
                            {entry.notifiedAt && (
                              <div className="text-xs text-slate-500 flex-shrink-0 hidden sm:block">
                                Notifié le {new Date(entry.notifiedAt).toLocaleDateString('fr-FR')}
                              </div>
                            )}

                            {/* Status */}
                            <div className="flex-shrink-0">{statusBadge(entry.status)}</div>

                            {/* Remove */}
                            <button
                              onClick={() => removeEntry(entry.id)}
                              disabled={removing === entry.id}
                              className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors flex-shrink-0"
                              title="Retirer de la liste"
                            >
                              {removing === entry.id
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <Trash2 className="w-4 h-4" />}
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
