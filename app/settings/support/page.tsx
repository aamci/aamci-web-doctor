'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../_providers/AuthProvider';
import { MessageSquare, Plus, Clock, AlertTriangle, CheckCircle, XCircle, Send, Loader2, X } from 'lucide-react';

type Ticket = {
  id: string; title: string; description: string; status: string;
  priority: string; category?: string; response?: string; createdAt: string;
};

const STATUS: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  OPEN:        { label: 'Ouvert',   icon: <Clock className="w-3 h-3" />,         cls: 'text-blue-600 bg-blue-50 border-blue-200' },
  IN_PROGRESS: { label: 'En cours', icon: <AlertTriangle className="w-3 h-3" />, cls: 'text-amber-600 bg-amber-50 border-amber-200' },
  RESOLVED:    { label: 'Résolu',   icon: <CheckCircle className="w-3 h-3" />,   cls: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  CLOSED:      { label: 'Fermé',    icon: <XCircle className="w-3 h-3" />,       cls: 'text-slate-500 bg-slate-50 border-slate-200' },
};

const PRIORITY: Record<string, string> = { LOW: 'Faible', MEDIUM: 'Normale', HIGH: 'Haute', URGENT: 'Urgente' };

const INPUT = `w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors`;

export default function SupportPage() {
  const { user } = useAuth();
  const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').trim().replace(/\/+$/, '') || 'http://localhost:3000';
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const authedFetch = useCallback((url: string, init?: RequestInit) => {
    const token = localStorage.getItem('token');
    return fetch(`${apiBase}${url}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(init?.headers as any) },
    });
  }, [apiBase]);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await authedFetch('/tickets/my'); setTickets(r.ok ? await r.json() : []); }
    catch { /* ignore */ }
    finally { setLoading(false); }
  }, [authedFetch]);

  useEffect(() => { load(); }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) { setErr('Sujet et description requis'); return; }
    setSaving(true); setErr('');
    try {
      await authedFetch('/tickets', { method: 'POST', body: JSON.stringify({ title, description, category: category || undefined, priority }) });
      setTitle(''); setCategory(''); setDescription(''); setPriority('MEDIUM'); setShowForm(false); load();
    } catch (e: any) { setErr(e?.message || 'Erreur lors de l\'envoi'); }
    finally { setSaving(false); }
  }

  if (!user) return null;

  return (
    <>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Support</h1>
          <p className="text-sm text-slate-500 mt-0.5">Signalez un problème ou posez une question</p>
        </div>
        <button onClick={() => { setShowForm(v => !v); setErr(''); }}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Nouveau ticket
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-5">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">Nouveau ticket</h2>
            <button onClick={() => setShowForm(false)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          <form onSubmit={submit} className="px-5 py-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Sujet *</label>
              <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="Décrivez brièvement votre problème" className={INPUT} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Catégorie</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className={INPUT}>
                  <option value="">Générale</option>
                  <option value="APPOINTMENT">Rendez-vous</option>
                  <option value="PAYMENT">Paiement</option>
                  <option value="ACCOUNT">Compte</option>
                  <option value="TECHNICAL">Technique</option>
                  <option value="PRESCRIPTION">Ordonnance</option>
                  <option value="OTHER">Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Priorité</label>
                <select value={priority} onChange={e => setPriority(e.target.value)} className={INPUT}>
                  <option value="LOW">Faible</option>
                  <option value="MEDIUM">Normale</option>
                  <option value="HIGH">Haute</option>
                  <option value="URGENT">Urgente</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Description *</label>
              <textarea required rows={4} value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Décrivez votre problème en détail..."
                className={`${INPUT} resize-none`} />
            </div>
            {err && <p className="text-sm text-red-500">{err}</p>}
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium transition-colors">
                Annuler
              </button>
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium disabled:opacity-50 transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {saving ? 'Envoi…' : 'Envoyer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Ticket list */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-slate-300 animate-spin" /></div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <MessageSquare className="w-9 h-9 mx-auto mb-3 text-slate-200" />
          <p className="text-sm font-medium text-slate-500">Aucun ticket</p>
          <p className="text-xs text-slate-400 mt-1">Créez un ticket si vous avez besoin d'aide</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map(t => {
            const s = STATUS[t.status] ?? STATUS.OPEN;
            return (
              <div key={t.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-sm font-semibold text-slate-800">{t.title}</p>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full border shrink-0 ${s.cls}`}>
                    {s.icon} {s.label}
                  </span>
                </div>
                {t.category && <p className="text-xs text-slate-400 mb-1">{t.category.charAt(0) + t.category.slice(1).toLowerCase()}</p>}
                <p className="text-xs text-slate-500 line-clamp-2 mb-3">{t.description}</p>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>Priorité : <span className="text-slate-600 font-medium">{PRIORITY[t.priority] ?? t.priority}</span></span>
                  <span>{new Date(t.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                {t.response && (
                  <div className="mt-3 p-3 bg-teal-50 border border-teal-100 rounded-lg">
                    <p className="text-xs font-semibold text-teal-700 mb-1">Réponse support :</p>
                    <p className="text-xs text-slate-700">{t.response}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
