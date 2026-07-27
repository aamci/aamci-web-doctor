'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../_providers/AuthProvider';
import {
  History, ChevronLeft, ChevronRight, Filter, User,
  Calendar, ArrowRight, RefreshCw, Clock,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

type HistoryEntry = {
  id: string;
  action: string;
  description: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  user: { id: string; fullName: string | null; email: string; role: string } | null;
  appointment: {
    id: string;
    patient: { fullName: string | null; email: string };
    slot: { start: string; ownerId: string };
  };
};

type HistoryResponse = {
  entries: HistoryEntry[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

const ACTION_META: Record<string, { label: string; color: string }> = {
  CREATED:        { label: 'Créé',         color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' },
  STATUS_CHANGED: { label: 'Statut modifié',color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  RESCHEDULED:    { label: 'Reprogrammé',  color: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300' },
  CANCELLED:      { label: 'Annulé',       color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
  UPDATED:        { label: 'Modifié',      color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
};

const ROLE_LABELS: Record<string, string> = {
  DOCTOR: 'Médecin', PATIENT: 'Patient', ADMIN: 'Admin',
  FACILITY_MANAGER: 'Gestionnaire', SECRETARY: 'Secrétaire',
};

function authHeaders(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function HistoriquePage() {
  const { user } = useAuth();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const [data, setData]       = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [action, setAction]   = useState('');

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30' });
      if (action) params.set('action', action);
      const res = await fetch(`${API_BASE}/appointments/history/global?${params}`, {
        headers: authHeaders(token),
      });
      if (res.ok) setData(await res.json());
    } finally { setLoading(false); }
  }, [token, page, action]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const fmtDate = (d: string) =>
    new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const fmtShort = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <History className="w-6 h-6 text-violet-500" />
            Historique des modifications
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Toutes les actions sur les rendez-vous — {data?.total ?? 0} entrées
          </p>
        </div>
        <button
          onClick={fetch_}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={action}
            onChange={e => { setAction(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Toutes les actions</option>
            {Object.entries(ACTION_META).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Action</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Patient</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">RDV</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Effectué par</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Détails</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto" />
                </td></tr>
              ) : !data?.entries.length ? (
                <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">
                  Aucune entrée trouvée
                </td></tr>
              ) : data.entries.map(entry => {
                const meta = ACTION_META[entry.action] ?? { label: entry.action, color: 'bg-slate-100 text-slate-700' };
                let oldV: any = null, newV: any = null;
                try { oldV = entry.oldValue ? JSON.parse(entry.oldValue) : null; } catch { /* ignore */ }
                try { newV = entry.newValue ? JSON.parse(entry.newValue) : null; } catch { /* ignore */ }

                return (
                  <tr key={entry.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    {/* Date */}
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 shrink-0" />
                        {fmtDate(entry.createdAt)}
                      </div>
                    </td>

                    {/* Action badge */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${meta.color}`}>
                        {meta.label}
                      </span>
                    </td>

                    {/* Patient */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="font-medium text-foreground">
                          {entry.appointment.patient.fullName ?? entry.appointment.patient.email}
                        </span>
                      </div>
                    </td>

                    {/* RDV date */}
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 shrink-0" />
                        <span className="text-xs">{fmtShort(entry.appointment.slot.start)}</span>
                      </div>
                    </td>

                    {/* Actor */}
                    <td className="px-4 py-3">
                      {entry.user ? (
                        <div>
                          <p className="font-medium text-foreground text-xs">{entry.user.fullName ?? entry.user.email}</p>
                          <p className="text-xs text-muted-foreground">{ROLE_LABELS[entry.user.role] ?? entry.user.role}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">Système</span>
                      )}
                    </td>

                    {/* Details */}
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px]">
                      {entry.description ? (
                        <span className="truncate block">{entry.description}</span>
                      ) : (oldV && newV) ? (
                        <span className="flex items-center gap-1 font-mono">
                          <span className="text-red-500 truncate max-w-[70px]">{JSON.stringify(oldV)}</span>
                          <ArrowRight className="w-3 h-3 shrink-0" />
                          <span className="text-green-600 truncate max-w-[70px]">{JSON.stringify(newV)}</span>
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {data.page} sur {data.pages} — {data.total} entrées
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-muted disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Précédent
            </button>
            <button
              disabled={page >= data.pages}
              onClick={() => setPage(p => p + 1)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-muted disabled:opacity-40 transition-colors"
            >
              Suivant <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
