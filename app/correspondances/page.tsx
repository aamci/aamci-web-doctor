'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../_providers/AuthProvider';
import {
  Send,
  Inbox,
  Search,
  ChevronDown,
  ChevronUp,
  Printer,
  Reply,
  Plus,
  Loader2,
  FileSignature,
  X,
  Check,
  Clock,
  AlertTriangle,
  ArrowRightLeft,
  UserCheck,
  UserX,
  RefreshCw,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DoctorUser {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  doctorProfile?: { specialty?: string | null; city?: string | null } | null;
}

interface PatientUser {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
}

interface Correspondence {
  id: string;
  category: string;
  subject: string;
  content: string;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  sender: DoctorUser;
  recipient: DoctorUser;
  patient?: PatientUser | null;
}

interface Referral {
  id: string;
  reason: string;
  notes?: string | null;
  urgency: string;
  status: string;
  response?: string | null;
  respondedAt?: string | null;
  createdAt: string;
  fromDoctor: DoctorUser;
  toDoctor: DoctorUser;
  patient: PatientUser;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  COMPTE_RENDU: { label: 'Compte-rendu', color: 'bg-blue-100 text-blue-700' },
  DEMANDE_AVIS:  { label: 'Demande d\'avis', color: 'bg-violet-100 text-violet-700' },
  REPONSE_AVIS:  { label: 'Réponse', color: 'bg-emerald-100 text-emerald-700' },
  TRANSFERT:     { label: 'Transfert', color: 'bg-amber-100 text-amber-700' },
  AUTRE:         { label: 'Autre', color: 'bg-gray-100 text-gray-600' },
};

const URGENCY_LABELS: Record<string, { label: string; color: string }> = {
  LOW:    { label: 'Faible', color: 'bg-gray-100 text-gray-600' },
  NORMAL: { label: 'Normale', color: 'bg-blue-100 text-blue-700' },
  HIGH:   { label: 'Haute', color: 'bg-orange-100 text-orange-700' },
  URGENT: { label: 'Urgente', color: 'bg-red-100 text-red-700' },
};

const REFERRAL_STATUS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  PENDING:   { label: 'En attente', icon: <Clock className="w-3.5 h-3.5" />, color: 'bg-amber-100 text-amber-700' },
  ACCEPTED:  { label: 'Accepté',    icon: <UserCheck className="w-3.5 h-3.5" />, color: 'bg-emerald-100 text-emerald-700' },
  DECLINED:  { label: 'Refusé',     icon: <UserX className="w-3.5 h-3.5" />, color: 'bg-red-100 text-red-700' },
  COMPLETED: { label: 'Terminé',    icon: <Check className="w-3.5 h-3.5" />, color: 'bg-gray-100 text-gray-600' },
};

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function Avatar({ user, size = 'sm' }: { user: DoctorUser | PatientUser; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  const initials = (user.fullName || '?').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  if (user.avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={user.avatarUrl} alt="" className={`${sz} rounded-full object-cover shrink-0`} />;
  }
  return (
    <div className={`${sz} rounded-full bg-teal-100 text-teal-700 font-semibold flex items-center justify-center shrink-0`}>
      {initials}
    </div>
  );
}

// ─── Doctor search dropdown ───────────────────────────────────────────────────

function DoctorSearchInput({
  value, onChange, placeholder = 'Rechercher un médecin…'
}: {
  value: DoctorUser | null;
  onChange: (d: DoctorUser | null) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DoctorUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const token = localStorage.getItem('token');
        const r = await fetch(`${API_BASE}/correspondences/doctors/search?q=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (r.ok) setResults(await r.json());
      } catch { /* ignore */ } finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  if (value) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white">
        <Avatar user={value} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{value.fullName}</p>
          {value.doctorProfile?.specialty && (
            <p className="text-xs text-gray-500 truncate">{value.doctorProfile.specialty}</p>
          )}
        </div>
        <button onClick={() => onChange(null)} className="p-0.5 hover:bg-gray-100 rounded">
          <X className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-gray-400" />}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-20 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {results.map(d => (
            <button
              key={d.id}
              type="button"
              onClick={() => { onChange(d); setQuery(''); setOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-left"
            >
              <Avatar user={d} />
              <div>
                <p className="text-sm font-medium text-gray-900">{d.fullName}</p>
                {d.doctorProfile?.specialty && (
                  <p className="text-xs text-gray-500">{d.doctorProfile.specialty}{d.doctorProfile.city ? ` · ${d.doctorProfile.city}` : ''}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = 'correspondances' | 'referrals';
type CorrFilter = 'ALL' | 'RECEIVED' | 'SENT';

export default function CorrespondancesPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('correspondances');
  const currentUserId = user?.id ?? '';

  // Correspondances state
  const [corrs, setCorrs] = useState<Correspondence[]>([]);
  const [corrFilter, setCorrFilter] = useState<CorrFilter>('ALL');
  const [corrSearch, setCorrSearch] = useState('');
  const [corrLoading, setCorrLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCorrModal, setShowCorrModal] = useState(false);
  const [replyTo, setReplyTo] = useState<Correspondence | null>(null);

  // Referrals state
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [refFilter, setRefFilter] = useState<'ALL' | 'SENT' | 'RECEIVED'>('ALL');
  const [refLoading, setRefLoading] = useState(true);
  const [expandedRefId, setExpandedRefId] = useState<string | null>(null);
  const [showRefModal, setShowRefModal] = useState(false);
  const [respondingTo, setRespondingTo] = useState<Referral | null>(null);

  const authedFetch = useCallback(async (url: string, options?: RequestInit) => {
    const token = localStorage.getItem('token');
    const r = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options?.headers as Record<string, string> ?? {}),
      },
    });
    if (!r.ok) {
      const t = await r.text().catch(() => '');
      throw new Error(`HTTP ${r.status}${t ? ` — ${t}` : ''}`);
    }
    return r.json();
  }, []);

  const loadCorrs = useCallback(async () => {
    setCorrLoading(true);
    try {
      const [sent, received] = await Promise.all([
        authedFetch('/correspondences/sent'),
        authedFetch('/correspondences/received'),
      ]);
      const all: Correspondence[] = [...(received || []), ...(sent || [])];
      all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setCorrs(all);
    } catch { /* silent */ } finally { setCorrLoading(false); }
  }, [authedFetch]);

  const loadReferrals = useCallback(async () => {
    setRefLoading(true);
    try {
      const [sent, received] = await Promise.all([
        authedFetch('/referrals/sent'),
        authedFetch('/referrals/received'),
      ]);
      const all: Referral[] = [...(received || []), ...(sent || [])];
      all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setReferrals(all);
    } catch { /* silent */ } finally { setRefLoading(false); }
  }, [authedFetch]);

  useEffect(() => { loadCorrs(); }, [loadCorrs]);
  useEffect(() => { loadReferrals(); }, [loadReferrals]);

  const filteredCorrs = corrs.filter(c => {
    const isSent = c.sender.id === currentUserId;
    if (corrFilter === 'SENT' && !isSent) return false;
    if (corrFilter === 'RECEIVED' && isSent) return false;
    if (corrSearch) {
      const q = corrSearch.toLowerCase();
      if (!c.subject.toLowerCase().includes(q) &&
          !c.sender.fullName.toLowerCase().includes(q) &&
          !c.recipient.fullName.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const filteredRefs = referrals.filter(r => {
    const isSent = r.fromDoctor.id === currentUserId;
    if (refFilter === 'SENT' && !isSent) return false;
    if (refFilter === 'RECEIVED' && isSent) return false;
    return true;
  });

  const unreadCorrs = corrs.filter(c => !c.isRead && c.recipient.id === currentUserId).length;
  const pendingRefs = referrals.filter(r => r.toDoctor.id === currentUserId && r.status === 'PENDING').length;

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Correspondances médicales</h1>
        <p className="text-sm text-gray-500 mt-0.5">Courrier entre confrères et transferts de patients</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        <button
          onClick={() => setTab('correspondances')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
            tab === 'correspondances'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileSignature className="w-4 h-4" />
          Courrier médical
          {unreadCorrs > 0 && (
            <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">{unreadCorrs}</span>
          )}
        </button>
        <button
          onClick={() => setTab('referrals')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
            tab === 'referrals'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          Transferts / Aiguillages
          {pendingRefs > 0 && (
            <span className="px-1.5 py-0.5 bg-amber-500 text-white text-xs rounded-full">{pendingRefs}</span>
          )}
        </button>
      </div>

      {/* ── CORRESPONDANCES TAB ── */}
      {tab === 'correspondances' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Filter */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {(['ALL', 'RECEIVED', 'SENT'] as CorrFilter[]).map(f => (
                <button key={f} onClick={() => setCorrFilter(f)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    corrFilter === f ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {f === 'ALL' ? 'Tous' : f === 'RECEIVED' ? 'Reçus' : 'Envoyés'}
                </button>
              ))}
            </div>
            {/* Search */}
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={corrSearch}
                onChange={e => setCorrSearch(e.target.value)}
                placeholder="Rechercher…"
                className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={loadCorrs} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Actualiser">
                <RefreshCw className="w-4 h-4 text-gray-500" />
              </button>
              <button
                onClick={() => { setReplyTo(null); setShowCorrModal(true); }}
                className="flex items-center gap-2 px-3 py-1.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
              >
                <Plus className="w-4 h-4" /> Nouveau courrier
              </button>
            </div>
          </div>

          {corrLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
          ) : filteredCorrs.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <FileSignature className="w-10 h-10 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm">Aucune correspondance</p>
              <p className="text-xs text-gray-400 mt-1">Rédigez un courrier pour contacter un confrère</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCorrs.map(c => {
                const isSent = c.sender.id === currentUserId;
                const isExpanded = expandedId === c.id;
                const other = isSent ? c.recipient : c.sender;
                const cat = CATEGORY_LABELS[c.category] ?? CATEGORY_LABELS.AUTRE;
                const unread = !c.isRead && !isSent;

                return (
                  <div key={c.id} className={`bg-white rounded-xl border transition-colors ${
                    unread ? 'border-teal-300 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <div
                      className="flex items-start gap-3 p-4 cursor-pointer"
                      onClick={async () => {
                        setExpandedId(isExpanded ? null : c.id);
                        if (unread) {
                          try {
                            await authedFetch(`/correspondences/${c.id}/read`, { method: 'PATCH' });
                            setCorrs(prev => prev.map(x => x.id === c.id ? { ...x, isRead: true } : x));
                          } catch { /* ignore */ }
                        }
                      }}
                    >
                      {/* Direction icon */}
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        isSent ? 'bg-green-100' : 'bg-blue-100'
                      }`}>
                        {isSent ? <Send className="w-4 h-4 text-green-600" /> : <Inbox className="w-4 h-4 text-blue-600" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className={`font-medium text-sm truncate ${unread ? 'text-gray-900' : 'text-gray-700'}`}>
                            {c.subject}
                          </span>
                          {unread && <span className="w-2 h-2 bg-teal-500 rounded-full shrink-0" />}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                          <span>{isSent ? 'À' : 'De'} : <span className="font-medium text-gray-700">{other.fullName}</span>
                            {other.doctorProfile?.specialty && <span className="text-gray-400"> ({other.doctorProfile.specialty})</span>}
                          </span>
                          {c.patient && <span>Patient : <span className="text-gray-700">{c.patient.fullName}</span></span>}
                          <span>{fmtDate(c.createdAt)}</span>
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${cat.color}`}>{cat.label}</span>
                        </div>
                        {!isExpanded && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{c.content}</p>}
                      </div>

                      <div className="shrink-0 ml-2">
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-0">
                        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed mb-3">
                          {c.content}
                        </div>
                        <div className="flex items-center gap-2">
                          {!isSent && (
                            <button
                              onClick={() => {
                                setReplyTo(c);
                                setShowCorrModal(true);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg text-sm hover:bg-teal-100 transition-colors"
                            >
                              <Reply className="w-3.5 h-3.5" /> Répondre
                            </button>
                          )}
                          <button
                            onClick={() => {
                              const w = window.open('', '_blank');
                              if (!w) return;
                              w.document.write(`<html><head><title>${c.subject}</title>
                                <style>body{font-family:Arial;padding:40px;max-width:700px;margin:auto}
                                h2{color:#0d9488}p{color:#6b7280;font-size:14px}.body{white-space:pre-wrap;line-height:1.6;margin-top:20px}</style></head>
                                <body><h2>${c.subject}</h2>
                                <p>${isSent ? 'À' : 'De'} : ${other.fullName}${other.doctorProfile?.specialty ? ` (${other.doctorProfile.specialty})` : ''}</p>
                                <p>Date : ${fmtDate(c.createdAt)}</p>
                                ${c.patient ? `<p>Patient : ${c.patient.fullName}</p>` : ''}
                                <div class="body">${c.content}</div></body></html>`);
                              w.document.close(); w.print();
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" /> Imprimer
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── REFERRALS TAB ── */}
      {tab === 'referrals' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {(['ALL', 'RECEIVED', 'SENT'] as const).map(f => (
                <button key={f} onClick={() => setRefFilter(f)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    refFilter === f ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {f === 'ALL' ? 'Tous' : f === 'RECEIVED' ? 'Reçus' : 'Envoyés'}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={loadReferrals} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Actualiser">
                <RefreshCw className="w-4 h-4 text-gray-500" />
              </button>
              <button
                onClick={() => setShowRefModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
              >
                <Plus className="w-4 h-4" /> Nouveau transfert
              </button>
            </div>
          </div>

          {refLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
          ) : filteredRefs.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <ArrowRightLeft className="w-10 h-10 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm">Aucun transfert</p>
              <p className="text-xs text-gray-400 mt-1">Adressez un patient à un confrère spécialiste</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredRefs.map(r => {
                const isSent = r.fromDoctor.id === currentUserId;
                const isExpanded = expandedRefId === r.id;
                const other = isSent ? r.toDoctor : r.fromDoctor;
                const status = REFERRAL_STATUS[r.status] ?? REFERRAL_STATUS.PENDING;
                const urgency = URGENCY_LABELS[r.urgency] ?? URGENCY_LABELS.NORMAL;
                const isPending = r.status === 'PENDING' && !isSent;

                return (
                  <div key={r.id} className={`bg-white rounded-xl border transition-colors ${
                    isPending ? 'border-amber-300 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <div
                      className="flex items-start gap-3 p-4 cursor-pointer"
                      onClick={() => setExpandedRefId(isExpanded ? null : r.id)}
                    >
                      <Avatar user={other} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="font-medium text-sm text-gray-900">{r.patient.fullName}</span>
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${status.color}`}>
                            {status.icon} {status.label}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${urgency.color}`}>{urgency.label}</span>
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-3 flex-wrap">
                          <span>{isSent ? 'Adressé à' : 'Envoyé par'} : <span className="font-medium text-gray-700">{other.fullName}</span>
                            {other.doctorProfile?.specialty && <span className="text-gray-400"> ({other.doctorProfile.specialty})</span>}
                          </span>
                          <span>{fmtDate(r.createdAt)}</span>
                        </div>
                        {!isExpanded && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{r.reason}</p>}
                      </div>
                      <div className="shrink-0 ml-2">
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-0">
                        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 mb-3 space-y-2">
                          <p><span className="font-medium">Motif :</span> {r.reason}</p>
                          {r.notes && <p><span className="font-medium">Notes :</span> {r.notes}</p>}
                          {r.response && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <p className="font-medium text-gray-600 text-xs mb-1">Réponse du Dr {other.fullName} :</p>
                              <p>{r.response}</p>
                            </div>
                          )}
                        </div>
                        {isPending && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setRespondingTo(r)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm hover:bg-emerald-100 transition-colors"
                            >
                              <UserCheck className="w-3.5 h-3.5" /> Accepter / Répondre
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── NEW CORRESPONDENCE MODAL ── */}
      {showCorrModal && (
        <NewCorrespondenceModal
          replyTo={replyTo}
          currentUserId={currentUserId}
          onClose={() => { setShowCorrModal(false); setReplyTo(null); }}
          onSent={c => { setCorrs(prev => [c, ...prev]); setShowCorrModal(false); setReplyTo(null); }}
          authedFetch={authedFetch}
        />
      )}

      {/* ── NEW REFERRAL MODAL ── */}
      {showRefModal && (
        <NewReferralModal
          onClose={() => setShowRefModal(false)}
          onSent={r => { setReferrals(prev => [r, ...prev]); setShowRefModal(false); }}
          authedFetch={authedFetch}
        />
      )}

      {/* ── RESPOND TO REFERRAL MODAL ── */}
      {respondingTo && (
        <RespondReferralModal
          referral={respondingTo}
          onClose={() => setRespondingTo(null)}
          onResponded={updated => {
            setReferrals(prev => prev.map(r => r.id === updated.id ? updated : r));
            setRespondingTo(null);
          }}
          authedFetch={authedFetch}
        />
      )}
    </div>
  );
}

// ─── New Correspondence Modal ─────────────────────────────────────────────────

function NewCorrespondenceModal({
  replyTo, currentUserId, onClose, onSent, authedFetch,
}: {
  replyTo: Correspondence | null;
  currentUserId: string;
  onClose: () => void;
  onSent: (c: Correspondence) => void;
  authedFetch: (url: string, opts?: RequestInit) => Promise<any>;
}) {
  const [recipient, setRecipient] = useState<DoctorUser | null>(
    replyTo ? (replyTo.sender.id === currentUserId ? replyTo.recipient : replyTo.sender) : null
  );
  const [category, setCategory] = useState(replyTo ? 'REPONSE_AVIS' : 'COMPTE_RENDU');
  const [subject, setSubject] = useState(replyTo ? `Re: ${replyTo.subject}` : '');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!recipient) { setErr('Veuillez sélectionner un destinataire'); return; }
    setSaving(true);
    setErr('');
    try {
      const c = await authedFetch('/correspondences', {
        method: 'POST',
        body: JSON.stringify({ recipientId: recipient.id, category, subject, content }),
      });
      onSent(c);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Erreur lors de l\'envoi');
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">
            {replyTo ? 'Répondre au courrier' : 'Nouveau courrier médical'}
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Destinataire *</label>
            <DoctorSearchInput value={recipient} onChange={setRecipient} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Type de courrier</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Objet *</label>
              <input required value={subject} onChange={e => setSubject(e.target.value)}
                placeholder="Objet du courrier"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Contenu *</label>
            <textarea required rows={6} value={content} onChange={e => setContent(e.target.value)}
              placeholder="Cher(e) confrère, je vous adresse ce patient…"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
              Annuler
            </button>
            <button type="submit" disabled={saving || !recipient}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50">
              <Send className="w-3.5 h-3.5" />
              {saving ? 'Envoi…' : 'Envoyer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── New Referral Modal ───────────────────────────────────────────────────────

function NewReferralModal({
  onClose, onSent, authedFetch,
}: {
  onClose: () => void;
  onSent: (r: Referral) => void;
  authedFetch: (url: string, opts?: RequestInit) => Promise<any>;
}) {
  const [toDoctor, setToDoctor] = useState<DoctorUser | null>(null);
  const [patientQuery, setPatientQuery] = useState('');
  const [patients, setPatients] = useState<PatientUser[]>([]);
  const [patient, setPatient] = useState<PatientUser | null>(null);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [urgency, setUrgency] = useState('NORMAL');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (patientQuery.length < 2) { setPatients([]); return; }
    const t = setTimeout(async () => {
      try {
        const data = await authedFetch(`/users/patients/search?q=${encodeURIComponent(patientQuery)}`);
        setPatients(data || []);
      } catch { /* ignore */ }
    }, 300);
    return () => clearTimeout(t);
  }, [patientQuery, authedFetch]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!toDoctor) { setErr('Sélectionnez un médecin destinataire'); return; }
    if (!patient) { setErr('Sélectionnez un patient'); return; }
    setSaving(true); setErr('');
    try {
      const r = await authedFetch('/referrals', {
        method: 'POST',
        body: JSON.stringify({ toDoctorId: toDoctor.id, patientId: patient.id, reason, notes: notes || undefined, urgency }),
      });
      onSent(r);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Erreur');
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Nouveau transfert / aiguillage</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Médecin destinataire *</label>
            <DoctorSearchInput value={toDoctor} onChange={setToDoctor} placeholder="Rechercher un confrère…" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Patient *</label>
            {patient ? (
              <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{patient.fullName}</p>
                  <p className="text-xs text-gray-500">{patient.email}</p>
                </div>
                <button type="button" onClick={() => setPatient(null)} className="p-0.5 hover:bg-gray-100 rounded">
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text" value={patientQuery} onChange={e => setPatientQuery(e.target.value)}
                  placeholder="Nom du patient…"
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                {patients.length > 0 && (
                  <div className="absolute z-20 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                    {patients.map(p => (
                      <button key={p.id} type="button" onClick={() => { setPatient(p); setPatientQuery(''); setPatients([]); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-left">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{p.fullName}</p>
                          <p className="text-xs text-gray-500">{p.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Urgence</label>
              <select value={urgency} onChange={e => setUrgency(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="LOW">Faible</option>
                <option value="NORMAL">Normale</option>
                <option value="HIGH">Haute</option>
                <option value="URGENT">Urgente</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Motif *</label>
            <textarea required rows={3} value={reason} onChange={e => setReason(e.target.value)}
              placeholder="Motif du transfert ou de l'aiguillage…"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Notes complémentaires</label>
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Informations utiles pour le confrère…"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
              Annuler
            </button>
            <button type="submit" disabled={saving || !toDoctor || !patient}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50">
              <ArrowRightLeft className="w-3.5 h-3.5" />
              {saving ? 'Envoi…' : 'Adresser le patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Respond to Referral Modal ────────────────────────────────────────────────

function RespondReferralModal({
  referral, onClose, onResponded, authedFetch,
}: {
  referral: Referral;
  onClose: () => void;
  onResponded: (r: Referral) => void;
  authedFetch: (url: string, opts?: RequestInit) => Promise<any>;
}) {
  const [decision, setDecision] = useState<'ACCEPTED' | 'DECLINED'>('ACCEPTED');
  const [response, setResponse] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setErr('');
    try {
      const r = await authedFetch(`/referrals/${referral.id}/respond`, {
        method: 'PATCH',
        body: JSON.stringify({ status: decision, response: response || undefined }),
      });
      onResponded(r);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Erreur');
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Répondre à l&apos;aiguillage</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
            <p><span className="font-medium">Patient :</span> {referral.patient.fullName}</p>
            <p className="mt-1"><span className="font-medium">Motif :</span> {referral.reason}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Votre décision *</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setDecision('ACCEPTED')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                  decision === 'ACCEPTED' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}>
                <UserCheck className="w-4 h-4" /> Accepter
              </button>
              <button type="button" onClick={() => setDecision('DECLINED')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                  decision === 'DECLINED' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}>
                <UserX className="w-4 h-4" /> Décliner
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Message (optionnel)</label>
            <textarea rows={3} value={response} onChange={e => setResponse(e.target.value)}
              placeholder={decision === 'ACCEPTED' ? 'Je prends en charge ce patient…' : 'Raison du refus…'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
              Annuler
            </button>
            <button type="submit" disabled={saving}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 text-white ${
                decision === 'ACCEPTED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
              }`}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : decision === 'ACCEPTED' ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
              {saving ? 'Envoi…' : decision === 'ACCEPTED' ? 'Accepter' : 'Décliner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
