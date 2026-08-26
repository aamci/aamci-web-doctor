'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  X,
  Crown,
  Zap,
  Star,
  Video,
  Users,
  Search,
  MessageSquare,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../_providers/AuthProvider';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

type Plan = 'FREE' | 'STARTER' | 'PRO';
type AddOnKey = 'TELECONSULTATION' | 'TEAM_MANAGEMENT' | 'SEARCH_PRIORITY' | 'CORRESPONDENCES';

interface AddOnRecord {
  id: string;
  addOn: AddOnKey;
  activeFrom: string;
  activeTo: string | null;
}

interface Subscription {
  id: string;
  plan: Plan;
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
  currentPeriodStart: string;
  currentPeriodEnd: string | null;
  cancelledAt: string | null;
  addOns: AddOnRecord[];
  limits: {
    appointmentsPerMonth: number;
    messagingEnabled: boolean;
    prescriptionsEnabled: boolean;
    maxAppointmentKinds: number;
    statsEnabled: boolean;
  };
  planPrice: number;
  addOnPrices: Record<AddOnKey, number>;
}

const PLAN_META = {
  FREE: {
    label: 'Gratuit',
    icon: Star,
    color: 'from-slate-400 to-slate-500',
    border: 'border-slate-200 dark:border-slate-700',
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    features: [
      '5 rendez-vous / mois',
      '1 type de consultation',
      'Profil public basique',
    ],
    missing: ['Messagerie patients', 'Ordonnances', 'Statistiques', 'Options avancées'],
  },
  STARTER: {
    label: 'Starter',
    icon: Zap,
    color: 'from-blue-500 to-blue-600',
    border: 'border-blue-300 dark:border-blue-600',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    features: [
      '50 rendez-vous / mois',
      '3 types de consultation',
      'Messagerie patients',
      'Ordonnances',
      'Statistiques',
    ],
    missing: [],
  },
  PRO: {
    label: 'Pro',
    icon: Crown,
    color: 'from-violet-500 to-purple-600',
    border: 'border-violet-300 dark:border-violet-600',
    badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300',
    features: [
      'Rendez-vous illimités',
      'Types de consultation illimités',
      'Messagerie patients',
      'Ordonnances',
      'Statistiques avancées',
      'Accès prioritaire au support',
    ],
    missing: [],
  },
};

const ADDON_META: Record<AddOnKey, { label: string; description: string; icon: React.ElementType; color: string }> = {
  TELECONSULTATION: {
    label: 'Téléconsultation',
    description: 'Vidéo consultations intégrées avec vos patients',
    icon: Video,
    color: 'text-emerald-600 dark:text-emerald-400',
  },
  TEAM_MANAGEMENT: {
    label: 'Gestion d\'équipe',
    description: 'Gérez assistants et secrétaires médicaux',
    icon: Users,
    color: 'text-orange-600 dark:text-orange-400',
  },
  SEARCH_PRIORITY: {
    label: 'Priorité recherche',
    description: 'Apparaissez en tête des résultats de recherche',
    icon: Search,
    color: 'text-amber-600 dark:text-amber-400',
  },
  CORRESPONDENCES: {
    label: 'Correspondances',
    description: 'Échanges sécurisés entre professionnels de santé',
    icon: MessageSquare,
    color: 'text-sky-600 dark:text-sky-400',
  },
};

export default function AbonnementPage() {
  const router = useRouter();
  useAuth();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchSub = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/subscriptions/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setSub(await res.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSub(); }, [fetchSub]);

  const changePlan = async (plan: Plan) => {
    const token = getToken();
    if (!token || actionLoading) return;
    setActionLoading(`plan-${plan}`);
    try {
      const res = await fetch(`${API_BASE}/subscriptions/plan`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      if (res.ok) {
        setSub(await res.json());
        showToast('success', `Plan ${PLAN_META[plan].label} activé avec succès`);
      } else {
        showToast('error', 'Erreur lors du changement de plan');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const toggleAddOn = async (addOn: AddOnKey) => {
    const token = getToken();
    if (!token || actionLoading) return;
    setActionLoading(`addon-${addOn}`);
    try {
      const res = await fetch(`${API_BASE}/subscriptions/addon`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ addOn }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSub(updated);
        const isActive = updated.addOns.some((a: AddOnRecord) => a.addOn === addOn);
        showToast('success', isActive ? `Option ${ADDON_META[addOn].label} activée` : `Option ${ADDON_META[addOn].label} désactivée`);
      } else {
        const err = await res.json();
        showToast('error', err.message || 'Erreur lors de la modification');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const cancelSub = async () => {
    const token = getToken();
    if (!token || actionLoading) return;
    if (!confirm('Confirmer la résiliation ? Votre accès restera actif jusqu\'à la fin de la période.')) return;
    setActionLoading('cancel');
    try {
      const res = await fetch(`${API_BASE}/subscriptions/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSub(await res.json());
        showToast('success', 'Abonnement résilié');
      }
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const currentPlan: Plan = sub?.plan ?? 'FREE';
  const activeAddOns = new Set((sub?.addOns ?? []).map(a => a.addOn));
  const canUseAddOns = currentPlan !== 'FREE';

  const totalMonthly =
    (sub?.planPrice ?? 0) +
    Array.from(activeAddOns).reduce((sum, k) => sum + (sub?.addOnPrices?.[k] ?? 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-4 md:p-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
          ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-900 dark:text-emerald-200 dark:border-emerald-700' : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {toast.msg}
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mon abonnement</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Gérez votre plan et vos options</p>
          </div>
        </div>

        {/* Current status banner */}
        {sub && (
          <div className={`rounded-2xl p-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r ${PLAN_META[currentPlan].color} text-white`}>
            <div className="flex items-center gap-3">
              {React.createElement(PLAN_META[currentPlan].icon, { className: 'w-7 h-7' })}
              <div>
                <div className="font-bold text-lg">Plan {PLAN_META[currentPlan].label}</div>
                <div className="text-sm opacity-80">
                  {sub.status === 'CANCELLED' ? 'Résilié — accès jusqu\'à expiration' : sub.currentPeriodEnd ? `Renouvellement le ${new Date(sub.currentPeriodEnd).toLocaleDateString('fr-FR')}` : 'Sans engagement'}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{totalMonthly > 0 ? `${totalMonthly.toLocaleString('fr-FR')} FCFA` : 'Gratuit'}</div>
              {totalMonthly > 0 && <div className="text-sm opacity-80">/ mois</div>}
            </div>
          </div>
        )}

        {/* Plans grid */}
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Changer de plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {(['FREE', 'STARTER', 'PRO'] as Plan[]).map(plan => {
            const meta = PLAN_META[plan];
            const PlanIcon = meta.icon;
            const isActive = currentPlan === plan;
            const isLoading = actionLoading === `plan-${plan}`;

            return (
              <div key={plan} className={`rounded-2xl border-2 p-6 flex flex-col gap-4 bg-white dark:bg-slate-900 transition-all
                ${isActive ? meta.border + ' shadow-md' : 'border-gray-100 dark:border-slate-800'}`}>
                <div className="flex items-center justify-between">
                  <div className={`flex items-center gap-2 text-sm font-semibold px-3 py-1 rounded-full ${meta.badge}`}>
                    <PlanIcon className="w-4 h-4" />
                    {meta.label}
                  </div>
                  {isActive && (
                    <span className="text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-2 py-0.5 rounded-full">Actuel</span>
                  )}
                </div>

                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {plan === 'FREE' ? 'Gratuit' : `${plan === 'STARTER' ? '20 000' : '50 000'} FCFA`}
                  </div>
                  {plan !== 'FREE' && <div className="text-xs text-gray-500 dark:text-slate-400">par mois</div>}
                </div>

                <ul className="flex flex-col gap-2 flex-1">
                  {meta.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700 dark:text-slate-300">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                  {meta.missing.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-400 dark:text-slate-500">
                      <X className="w-4 h-4 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => !isActive && changePlan(plan)}
                  disabled={isActive || !!actionLoading}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2
                    ${isActive
                      ? 'bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-slate-500 cursor-default'
                      : `bg-gradient-to-r ${meta.color} text-white hover:opacity-90 active:opacity-80 disabled:opacity-50`
                    }`}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : isActive ? 'Plan actuel' : `Passer au ${meta.label}`}
                </button>
              </div>
            );
          })}
        </div>

        {/* Add-ons */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Options complémentaires</h2>
            {!canUseAddOns && (
              <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Nécessite Starter ou Pro
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(Object.keys(ADDON_META) as AddOnKey[]).map(key => {
              const meta = ADDON_META[key];
              const AddonIcon = meta.icon;
              const isActive = activeAddOns.has(key);
              const isLoading = actionLoading === `addon-${key}`;
              const price = sub?.addOnPrices?.[key] ?? 0;

              return (
                <div key={key} className={`rounded-2xl border-2 p-5 bg-white dark:bg-slate-900 flex items-start gap-4 transition-all
                  ${isActive ? 'border-blue-300 dark:border-blue-700 shadow-sm' : 'border-gray-100 dark:border-slate-800'}
                  ${!canUseAddOns ? 'opacity-60' : ''}`}>
                  <div className={`mt-0.5 p-2 rounded-xl bg-gray-50 dark:bg-slate-800 ${meta.color}`}>
                    <AddonIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-sm text-gray-900 dark:text-white">{meta.label}</div>
                      <div className="text-xs font-medium text-gray-500 dark:text-slate-400 shrink-0">{price.toLocaleString('fr-FR')} FCFA/mois</div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 mb-3">{meta.description}</p>
                    <button
                      onClick={() => canUseAddOns && toggleAddOn(key)}
                      disabled={!canUseAddOns || !!actionLoading}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all
                        ${isActive
                          ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900'
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-400 dark:hover:bg-blue-900'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : isActive ? (
                        <><X className="w-3.5 h-3.5" />Désactiver</>
                      ) : (
                        <><ChevronRight className="w-3.5 h-3.5" />Activer</>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Limits summary */}
        {sub && (
          <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 mb-8">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Limites de votre plan</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <LimitItem
                label="Rendez-vous / mois"
                value={sub.limits.appointmentsPerMonth === -1 ? 'Illimité' : String(sub.limits.appointmentsPerMonth)}
                ok={sub.limits.appointmentsPerMonth !== 5}
              />
              <LimitItem label="Types de consultation" value={sub.limits.maxAppointmentKinds === -1 ? 'Illimité' : String(sub.limits.maxAppointmentKinds)} ok={sub.limits.maxAppointmentKinds > 1} />
              <LimitItem label="Messagerie" value={sub.limits.messagingEnabled ? 'Incluse' : 'Non incluse'} ok={sub.limits.messagingEnabled} />
              <LimitItem label="Ordonnances" value={sub.limits.prescriptionsEnabled ? 'Incluses' : 'Non incluses'} ok={sub.limits.prescriptionsEnabled} />
              <LimitItem label="Statistiques" value={sub.limits.statsEnabled ? 'Incluses' : 'Non incluses'} ok={sub.limits.statsEnabled} />
            </div>
          </div>
        )}

        {/* Cancel */}
        {sub && sub.plan !== 'FREE' && sub.status === 'ACTIVE' && (
          <div className="text-center">
            <button
              onClick={cancelSub}
              disabled={!!actionLoading}
              className="text-sm text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
            >
              {actionLoading === 'cancel' ? <Loader2 className="inline w-4 h-4 animate-spin mr-1" /> : null}
              Résilier mon abonnement
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function LimitItem({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-xs text-gray-500 dark:text-slate-400">{label}</div>
      <div className={`text-sm font-semibold flex items-center gap-1.5 ${ok ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-slate-500'}`}>
        {ok ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" /> : <X className="w-3.5 h-3.5 text-gray-300 shrink-0" />}
        {value}
      </div>
    </div>
  );
}
