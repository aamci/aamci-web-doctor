'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../_providers/AuthProvider';
import {
  MessageSquare, Plus, Clock, AlertTriangle, CheckCircle, XCircle,
  Send, Loader2,
} from 'lucide-react';

type Ticket = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category?: string;
  response?: string;
  createdAt: string;
};

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  OPEN: { label: 'Ouvert', icon: <Clock className="w-3.5 h-3.5" />, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  IN_PROGRESS: { label: 'En cours', icon: <AlertTriangle className="w-3.5 h-3.5" />, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  RESOLVED: { label: 'Résolu', icon: <CheckCircle className="w-3.5 h-3.5" />, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  CLOSED: { label: 'Fermé', icon: <XCircle className="w-3.5 h-3.5" />, color: 'text-gray-500 bg-gray-50 border-gray-200' },
};

const priorityLabel: Record<string, string> = {
  LOW: 'Faible', MEDIUM: 'Normale', HIGH: 'Haute', URGENT: 'Urgente',
};

export default function SupportSettingsPage() {
  const { user } = useAuth();
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const authedFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${apiBaseUrl}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers as Record<string, string> ?? {}),
      },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}${text ? ` — ${text}` : ''}`);
    }
    return res;
  }, [apiBaseUrl]);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const r = await authedFetch('/tickets/my');
      setTickets(await r.json());
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [authedFetch]);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setSaving(true);
    try {
      await authedFetch('/tickets', {
        method: 'POST',
        body: JSON.stringify({ title, description, category: category || undefined, priority }),
      });
      setTitle('');
      setCategory('');
      setDescription('');
      setPriority('MEDIUM');
      setShowForm(false);
      loadTickets();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Erreur lors de l\'envoi');
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Support</h1>
        <p className="text-sm text-gray-500 mt-0.5">Signalez un problème ou posez une question à l&apos;équipe</p>
      </div>

      {/* New ticket button */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={() => { setShowForm(!showForm); setErr(''); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau ticket
        </button>
      </div>

      {/* Ticket form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4"
        >
          <h2 className="text-sm font-semibold text-gray-900">Nouveau ticket d&apos;assistance</h2>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Sujet *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Décrivez brièvement votre problème"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Catégorie</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
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
              <label className="block text-xs font-medium text-gray-600 mb-1">Priorité</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="LOW">Faible</option>
                <option value="MEDIUM">Normale</option>
                <option value="HIGH">Haute</option>
                <option value="URGENT">Urgente</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description *</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez votre problème en détail..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {saving ? 'Envoi…' : 'Envoyer'}
            </button>
          </div>
        </form>
      )}

      {/* Tickets list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">Aucun ticket</p>
          <p className="text-xs mt-1">Créez un ticket si vous avez besoin d&apos;assistance</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => {
            const s = statusConfig[t.status] ?? statusConfig.OPEN;
            return (
              <div key={t.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <p className="text-sm font-medium text-gray-900">{t.title}</p>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border shrink-0 ${s.color}`}>
                    {s.icon} {s.label}
                  </span>
                </div>
                {t.category && (
                  <p className="text-xs text-gray-400 mb-1 capitalize">{t.category.toLowerCase()}</p>
                )}
                <p className="text-xs text-gray-500 line-clamp-2 mb-2">{t.description}</p>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>Priorité : <span className="text-gray-600">{priorityLabel[t.priority] ?? t.priority}</span></span>
                  <span>{new Date(t.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                {t.response && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <p className="text-xs font-medium text-blue-700 mb-1">Réponse de l&apos;équipe support :</p>
                    <p className="text-xs text-gray-700">{t.response}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
