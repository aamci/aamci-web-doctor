'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../_providers/AuthProvider';
import {
  Send, Inbox, Clock, CheckCircle, XCircle, Search, X, ChevronDown,
  AlertTriangle, User, Stethoscope, FileText, Plus, Loader2, ArrowRight,
  RefreshCw, MessageSquare,
} from 'lucide-react';
import Link from 'next/link';

type ReferralStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'COMPLETED';
type ReferralUrgency = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

interface DoctorResult {
  id: string;
  fullName: string | null;
  email: string;
  avatarUrl: string | null;
  doctorProfile?: { specialty: string | null; city: string | null };
}

interface Referral {
  id: string;
  reason: string;
  notes?: string;
  urgency: ReferralUrgency;
  status: ReferralStatus;
  response?: string;
  respondedAt?: string;
  createdAt: string;
  patient: { id: string; fullName: string | null; email: string; avatarUrl: string | null; birthdate?: string | null };
  fromDoctor?: { id: string; fullName: string | null; email: string; avatarUrl: string | null; doctorProfile?: { specialty: string | null } };
  toDoctor?: { id: string; fullName: string | null; email: string; avatarUrl: string | null; doctorProfile?: { specialty: string | null } };
}

const statusConfig: Record<ReferralStatus, { label: string; icon: React.ReactNode; color: string }> = {
  PENDING:   { label: 'En attente', icon: <Clock className="w-3.5 h-3.5" />,        color: 'text-amber-600 bg-amber-50 border-amber-200' },
  ACCEPTED:  { label: 'Accepté',    icon: <CheckCircle className="w-3.5 h-3.5" />,  color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  DECLINED:  { label: 'Refusé',     icon: <XCircle className="w-3.5 h-3.5" />,      color: 'text-red-500 bg-red-50 border-red-200' },
  COMPLETED: { label: 'Terminé',    icon: <CheckCircle className="w-3.5 h-3.5" />,  color: 'text-gray-500 bg-gray-50 border-gray-200' },
};

const urgencyConfig: Record<ReferralUrgency, { label: string; color: string }> = {
  LOW:    { label: 'Faible',   color: 'text-gray-500 bg-gray-100' },
  NORMAL: { label: 'Normal',   color: 'text-blue-600 bg-blue-50' },
  HIGH:   { label: 'Élevée',   color: 'text-orange-600 bg-orange-50' },
  URGENT: { label: 'Urgente',  color: 'text-red-600 bg-red-50' },
};

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function age(birthdate?: string | null) {
  if (!birthdate) return null;
  const diff = Date.now() - new Date(birthdate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

export default function ReferralsPage() {
  const { user } = useAuth();
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

  const [tab, setTab] = useState<'sent' | 'received'>('received');
  const [sent, setSent] = useState<Referral[]>([]);
  const [received, setReceived] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Respond modal
  const [responding, setResponding] = useState<Referral | null>(null);
  const [responseText, setResponseText] = useState('');
  const [saving, setSaving] = useState(false);

  // Create form
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [doctorSearch, setDoctorSearch] = useState('');
  const [doctorResults, setDoctorResults] = useState<DoctorResult[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorResult | null>(null);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [urgency, setUrgency] = useState<ReferralUrgency>('NORMAL');
  const [createErr, setCreateErr] = useState('');
  const [searching, setSearching] = useState(false);

  const authedFetch = useCallback(async (path: string, opts: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${apiBase}${path}`, {
      ...opts,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(opts.headers as any ?? {}) },
    });
    if (!res.ok) { const t = await res.text().catch(() => ''); throw new Error(t || `HTTP ${res.status}`); }
    return res.json();
  }, [apiBase]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, r] = await Promise.all([
        authedFetch('/referrals/sent'),
        authedFetch('/referrals/received'),
      ]);
      setSent(s);
      setReceived(r);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [authedFetch]);

  useEffect(() => { load(); }, [load]);

  // Doctor search
  useEffect(() => {
    if (doctorSearch.length < 2) { setDoctorResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await authedFetch(`/search/doctors?q=${encodeURIComponent(doctorSearch)}`);
        setDoctorResults((data?.doctors ?? data ?? []).filter((d: any) => d.id !== user?.id));
      } catch { setDoctorResults([]); }
      finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [doctorSearch, authedFetch, user?.id]);

  // Patient search
  useEffect(() => {
    if (patientSearch.length < 2) { setPatientResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const data = await authedFetch(`/patients/search?q=${encodeURIComponent(patientSearch)}`);
        setPatientResults(data ?? []);
      } catch { setPatientResults([]); }
    }, 400);
    return () => clearTimeout(t);
  }, [patientSearch, authedFetch]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !selectedDoctor) { setCreateErr('Sélectionnez un patient et un médecin'); return; }
    setSaving(true);
    setCreateErr('');
    try {
      await authedFetch('/referrals', {
        method: 'POST',
        body: JSON.stringify({ patientId: selectedPatient.id, toDoctorId: selectedDoctor.id, reason, notes: notes || undefined, urgency }),
      });
      setShowCreate(false);
      setSelectedPatient(null); setSelectedDoctor(null);
      setReason(''); setNotes(''); setUrgency('NORMAL');
      setPatientSearch(''); setDoctorSearch('');
      load();
    } catch (err: any) { setCreateErr(err.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const handleRespond = async (status: 'ACCEPTED' | 'DECLINED') => {
    if (!responding) return;
    setSaving(true);
    try {
      await authedFetch(`/referrals/${responding.id}/respond`, {
        method: 'PATCH',
        body: JSON.stringify({ status, response: responseText || undefined }),
      });
      setResponding(null); setResponseText('');
      load();
    } catch { /* silent */ }
    finally { setSaving(false); }
  };

  const handleComplete = async (id: string) => {
    await authedFetch(`/referrals/${id}/complete`, { method: 'PATCH' }).catch(() => {});
    load();
  };

  const list = tab === 'sent' ? sent : received;
  const pendingReceived = received.filter((r) => r.status === 'PENDING').length;

  if (!user) return null;

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Adressages & Transferts</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gérez vos adressages entre confrères</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setCreateErr(''); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouvel adressage
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 w-fit">
        {([['received', 'Reçus', Inbox], ['sent', 'Envoyés', Send]] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {key === 'received' && pendingReceived > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {pendingReceived}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : list.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <FileText className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">Aucun adressage {tab === 'sent' ? 'envoyé' : 'reçu'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((r) => {
            const s = statusConfig[r.status];
            const u = urgencyConfig[r.urgency];
            const other = tab === 'sent' ? r.toDoctor : r.fromDoctor;
            return (
              <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Patient avatar */}
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 text-sm">{r.patient.fullName ?? r.patient.email}</p>
                        {age(r.patient.birthdate) && <span className="text-xs text-gray-400">{age(r.patient.birthdate)} ans</span>}
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${s.color}`}>
                          {s.icon} {s.label}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.color}`}>{u.label}</span>
                      </div>

                      <p className="text-xs text-gray-500 mt-0.5">
                        {tab === 'sent' ? 'Vers' : 'De'}{' '}
                        <span className="font-medium text-gray-700">{other?.fullName ?? other?.email ?? '—'}</span>
                        {other?.doctorProfile?.specialty && (
                          <span className="text-gray-400"> · {other.doctorProfile.specialty}</span>
                        )}
                      </p>

                      <p className="text-sm text-gray-700 mt-2 line-clamp-2">{r.reason}</p>

                      {r.response && (
                        <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                          <p className="text-xs font-medium text-gray-500 mb-0.5">Réponse :</p>
                          <p className="text-xs text-gray-700">{r.response}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <p className="text-xs text-gray-400">{fmtDate(r.createdAt)}</p>

                    {/* Actions for received pending */}
                    {tab === 'received' && r.status === 'PENDING' && (
                      <button
                        onClick={() => { setResponding(r); setResponseText(''); }}
                        className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Répondre
                      </button>
                    )}

                    {/* Mark complete for accepted */}
                    {tab === 'received' && r.status === 'ACCEPTED' && (
                      <button
                        onClick={() => handleComplete(r.id)}
                        className="px-3 py-1.5 text-xs border border-emerald-300 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
                      >
                        Terminer
                      </button>
                    )}

                    {/* Message the other doctor */}
                    <Link
                      href={`/messages?recipient=${other?.id}`}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <MessageSquare className="w-3 h-3" />
                      Message
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Create Referral Modal ─── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Nouvel adressage</h2>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Patient selection */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Patient *</label>
                {selectedPatient ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <User className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-blue-700 flex-1">{selectedPatient.fullName ?? selectedPatient.email}</span>
                    <button type="button" onClick={() => { setSelectedPatient(null); setPatientSearch(''); }}>
                      <X className="w-3.5 h-3.5 text-blue-400" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      placeholder="Rechercher un patient..."
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {patientResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                        {patientResults.map((p: any) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => { setSelectedPatient(p); setPatientSearch(''); setPatientResults([]); }}
                            className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 text-left"
                          >
                            <User className="w-4 h-4 text-gray-400 shrink-0" />
                            <div>
                              <p className="text-sm font-medium">{p.fullName ?? '—'}</p>
                              <p className="text-xs text-gray-400">{p.email}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Target doctor selection */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Médecin destinataire *</label>
                {selectedDoctor ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <Stethoscope className="w-4 h-4 text-emerald-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-emerald-700">{selectedDoctor.fullName ?? selectedDoctor.email}</p>
                      {selectedDoctor.doctorProfile?.specialty && (
                        <p className="text-xs text-emerald-500">{selectedDoctor.doctorProfile.specialty}</p>
                      )}
                    </div>
                    <button type="button" onClick={() => { setSelectedDoctor(null); setDoctorSearch(''); }}>
                      <X className="w-3.5 h-3.5 text-emerald-400" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={doctorSearch}
                      onChange={(e) => setDoctorSearch(e.target.value)}
                      placeholder="Rechercher un médecin..."
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />}
                    {doctorResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                        {doctorResults.map((d) => (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => { setSelectedDoctor(d); setDoctorSearch(''); setDoctorResults([]); }}
                            className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 text-left"
                          >
                            <Stethoscope className="w-4 h-4 text-gray-400 shrink-0" />
                            <div>
                              <p className="text-sm font-medium">{d.fullName ?? '—'}</p>
                              <p className="text-xs text-gray-400">{d.doctorProfile?.specialty ?? 'Généraliste'}{d.doctorProfile?.city ? ` · ${d.doctorProfile.city}` : ''}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Urgency */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Urgence</label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as ReferralUrgency)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="LOW">Faible</option>
                  <option value="NORMAL">Normale</option>
                  <option value="HIGH">Élevée</option>
                  <option value="URGENT">Urgente</option>
                </select>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Motif de l&apos;adressage *</label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Motif clinique, bilan demandé, contexte..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes complémentaires</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Antécédents, traitements en cours, résultats récents..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {createErr && <p className="text-sm text-red-600">{createErr}</p>}

              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving || !reason || !selectedPatient || !selectedDoctor}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {saving ? 'Envoi…' : 'Adresser le patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Respond Modal ─── */}
      {responding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Répondre à l&apos;adressage</h2>
              <button onClick={() => setResponding(null)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="font-medium text-gray-700">{responding.patient.fullName ?? responding.patient.email}</p>
              <p className="text-gray-500 mt-0.5 line-clamp-2">{responding.reason}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Message de réponse (optionnel)</label>
              <textarea
                rows={3}
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Précisez votre disponibilité, délai de prise en charge..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleRespond('DECLINED')}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                Refuser
              </button>
              <button
                onClick={() => handleRespond('ACCEPTED')}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                Accepter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
