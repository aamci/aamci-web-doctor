'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Stethoscope,
  Clock,
  Monitor,
  Building2,
  CalendarDays,
  Bell,
  User,
  Shield,
  Pen,
  Laptop,
  MessageSquare,
  ChevronRight,
  Check,
  AlertTriangle,
  Loader2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

function getApiBase(): string {
  let b = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  b = b.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  if (!b) return 'http://localhost:3000';
  try { new URL(b); return b; } catch { return 'http://localhost:3000'; }
}

const SECTIONS = [
  {
    title: 'Cabinet',
    items: [
      { label: 'Types de consultation', desc: 'Gérer les types et durées de vos consultations', href: '/settings/consultation-types', icon: Stethoscope, color: 'text-violet-600 bg-violet-50' },
      { label: 'Absences & indisponibilités', desc: 'Planifier vos congés et absences', href: '/settings/absences', icon: Clock, color: 'text-orange-600 bg-orange-50' },
      { label: 'Calendrier externe', desc: 'Synchroniser avec Google Calendar ou iCal', href: '/settings/calendar-sync', icon: Monitor, color: 'text-indigo-600 bg-indigo-50' },
      { label: 'Établissement', desc: 'Gérer votre cabinet ou clinique', href: '/facility-management', icon: Building2, color: 'text-blue-600 bg-blue-50' },
    ],
  },
  {
    title: 'Agenda',
    items: [
      { label: 'Affichage agenda', desc: 'Zoom, créneaux, heures affichées', href: '/settings/agenda', icon: CalendarDays, color: 'text-green-600 bg-green-50' },
      { label: 'Notifications', desc: 'Rappels, canaux et heures de tranquillité', href: '/settings/notifications', icon: Bell, color: 'text-blue-600 bg-blue-50' },
    ],
  },
  {
    title: 'Compte & Sécurité',
    items: [
      { label: 'Profil & compte', desc: 'Informations personnelles, mot de passe', href: '/settings/compte', icon: User, color: 'text-teal-600 bg-teal-50' },
      { label: 'Confidentialité', desc: 'Double authentification, données et RGPD', href: '/settings/confidentialite', icon: Shield, color: 'text-red-600 bg-red-50' },
      { label: 'Journal de sécurité', desc: 'Historique des connexions et accès', href: '/settings/journal-securite', icon: Shield, color: 'text-slate-600 bg-slate-100' },
      { label: 'Ma signature', desc: 'Signature électronique pour les documents', href: '/settings/ma-signature', icon: Pen, color: 'text-amber-600 bg-amber-50' },
    ],
  },
  {
    title: 'Application',
    items: [
      { label: 'Paramètres app', desc: 'Thème, langue, mises à jour automatiques', href: '/settings/application', icon: Laptop, color: 'text-teal-600 bg-teal-50' },
      { label: 'Support', desc: 'Aide, signalement de problèmes', href: '/settings/support', icon: MessageSquare, color: 'text-slate-600 bg-slate-100' },
    ],
  },
];

export default function SettingsPage() {
  const apiBase = useMemo(() => getApiBase(), []);
  const [autoConfirm, setAutoConfirm] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${apiBase}/doctor-profiles/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setAutoConfirm(data.autoConfirmPatientBookings ?? true); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [apiBase]);

  async function saveAutoConfirm(value: boolean) {
    setSaving(true);
    setFeedback(null);
    const token = localStorage.getItem('token');
    try {
      const r = await fetch(`${apiBase}/doctor-profiles/me`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoConfirmPatientBookings: value }),
      });
      if (!r.ok) throw new Error();
      setAutoConfirm(value);
      setFeedback({ type: 'success', text: 'Préférence enregistrée' });
    } catch {
      setFeedback({ type: 'error', text: 'Impossible d\'enregistrer' });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-bold text-slate-900">Paramètres</h1>
        <p className="text-sm text-slate-500 mt-1">Gérez les préférences de votre espace médecin</p>
      </div>

      {/* Auto-confirm card — the one unique setting on this page */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-8 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-slate-900">Confirmation automatique des rendez-vous</h2>
            <p className="text-sm text-slate-500 mt-1">
              Lorsque activé, les réservations patients sont confirmées immédiatement.
              Sinon, chaque demande requiert votre validation manuelle.
            </p>
            <div className="flex items-center gap-4 mt-3 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Activé : confirmation immédiate
              </span>
              <span className="flex items-center gap-1.5 text-amber-700">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Désactivé : validation manuelle
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            {loading ? (
              <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
            ) : (
              <button
                onClick={() => saveAutoConfirm(!autoConfirm)}
                disabled={saving}
                className="flex items-center gap-2 disabled:opacity-50"
                aria-label="Basculer confirmation automatique"
              >
                {saving
                  ? <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
                  : autoConfirm
                    ? <ToggleRight className="w-9 h-9 text-teal-600" />
                    : <ToggleLeft className="w-9 h-9 text-slate-400" />
                }
                <span className={`text-sm font-medium ${autoConfirm ? 'text-teal-700' : 'text-slate-500'}`}>
                  {autoConfirm ? 'Activé' : 'Désactivé'}
                </span>
              </button>
            )}

            {feedback && (
              <span className={`flex items-center gap-1 text-xs ${feedback.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
                {feedback.type === 'success'
                  ? <Check className="w-3 h-3" />
                  : <AlertTriangle className="w-3 h-3" />
                }
                {feedback.text}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* All sections */}
      <div className="space-y-6">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
              {section.title}
            </h2>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href as any}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors group"
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{item.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{item.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-teal-500 transition-colors shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
