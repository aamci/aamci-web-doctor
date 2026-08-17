'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, AlertTriangle, CheckCircle, Loader2, LogIn, X, Clock } from 'lucide-react';
import { useAuth } from '../_providers/AuthProvider';

function getApiBase(): string | null {
  let b = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  b = b.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  if (!b) return null;
  try { new URL(b); return b; } catch { return null; }
}

async function authedFetch(path: string, init?: RequestInit) {
  const base = getApiBase();
  const url = base ? `${base}${path}` : `/api${path}`;
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const r = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    throw new Error(`HTTP ${r.status}${t ? ` — ${t}` : ''}`);
  }
  return r.status === 204 ? null : r.json();
}

export default function DeleteAccountPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<'info' | 'confirm' | 'pending' | 'done'>('info');
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [error, setError] = useState('');
  const [scheduledDate, setScheduledDate] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setStatusLoading(true);
    authedFetch('/auth/deletion-status')
      .then((d: any) => {
        if (d?.hasPendingDeletion) {
          setScheduledDate(d.scheduledDeletionAt);
          setStep('pending');
        }
      })
      .catch(() => {})
      .finally(() => setStatusLoading(false));
  }, [user]);

  async function handleRequestDeletion() {
    if (confirmText !== 'SUPPRIMER') return;
    setLoading(true);
    setError('');
    try {
      await authedFetch('/auth/account', { method: 'DELETE' });
      logout();
      setStep('done');
    } catch (e: any) {
      setError(e.message ?? 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelDeletion() {
    setCancelLoading(true);
    setError('');
    try {
      await authedFetch('/auth/cancel-deletion', { method: 'PATCH' });
      setScheduledDate(null);
      setStep('info');
    } catch (e: any) {
      setError(e.message ?? 'Annulation impossible');
    } finally {
      setCancelLoading(false);
    }
  }

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-white flex items-start justify-center pt-12 pb-24 px-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 border border-red-100 mb-4">
            <Trash2 className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Supprimer mon compte</h1>
          <p className="text-slate-500 mt-2 text-sm">Application Ibogha Pro</p>
        </div>

        {statusLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        )}

        {/* Not logged in */}
        {!user && !statusLoading && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm">
            <p className="text-slate-800 mb-2 font-medium">Connexion requise</p>
            <p className="text-slate-500 text-sm mb-6">
              Vous devez être connecté à votre compte professionnel pour soumettre une demande de suppression.
            </p>
            <button
              onClick={() => router.push('/auth/login?redirect=/delete-account')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Se connecter
            </button>
            <div className="mt-8 border-t border-slate-100 pt-6 text-left space-y-3">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Procédure de suppression</p>
              {[
                'Connectez-vous à votre compte Ibogha Pro',
                'Ouvrez « Paramètres » → « Confidentialité »',
                'Faites défiler jusqu\'à « Supprimer mon compte »',
                'Saisissez SUPPRIMER et confirmez',
              ].map((s, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-xs flex items-center justify-center font-bold">
                    {i + 1}
                  </span>
                  <p className="text-sm text-slate-500">{s}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending deletion */}
        {user && step === 'pending' && !statusLoading && (
          <div className="bg-white border border-amber-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="font-semibold text-amber-700">Suppression programmée</p>
                <p className="text-sm text-slate-500 mt-1">
                  Votre compte sera définitivement supprimé le{' '}
                  <span className="text-slate-800 font-medium">
                    {scheduledDate ? fmtDate(scheduledDate) : '…'}
                  </span>.
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-5">
              Vous pouvez annuler cette demande avant la date de suppression.
            </p>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <button
              onClick={handleCancelDeletion}
              disabled={cancelLoading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              {cancelLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
              Annuler la suppression de mon compte
            </button>
          </div>
        )}

        {/* Info step */}
        {user && step === 'info' && !statusLoading && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="font-semibold text-slate-800 mb-3">Ce qui sera supprimé</h2>
              {[
                'Votre profil médical (nom, email, téléphone, photo)',
                'Vos rendez-vous et plannings',
                'Vos notes médicales et dossiers patients',
                'Vos messages et conversations',
                'Vos prescriptions et ordonnances',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                  <p className="text-sm text-slate-600">{item}</p>
                </div>
              ))}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="font-semibold text-slate-800 mb-3">Ce qui est conservé</h2>
              {[
                { label: 'Historique de paiement', note: 'Obligations légales — 5 ans' },
                { label: 'Factures émises', note: 'Obligations comptables — 10 ans' },
              ].map(({ label, note }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <p className="text-sm text-slate-600">{label}</p>
                  <span className="text-xs text-slate-400">{note}</span>
                </div>
              ))}
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                <strong>Période de grâce de 30 jours.</strong> Votre compte est désactivé immédiatement mais les données
                ne sont supprimées qu&apos;après 30 jours. Vous pouvez annuler pendant ce délai.
              </p>
            </div>

            <button
              onClick={() => setStep('confirm')}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors"
            >
              Continuer vers la suppression
            </button>
          </div>
        )}

        {/* Confirm step */}
        {user && step === 'confirm' && !statusLoading && (
          <div className="bg-white border border-red-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="font-semibold text-red-700">Confirmation requise</p>
                <p className="text-sm text-slate-500 mt-1">
                  Tapez <span className="font-mono font-bold text-red-600">SUPPRIMER</span> pour confirmer.
                </p>
              </div>
            </div>

            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="SUPPRIMER"
              className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 outline-none transition-colors font-mono tracking-wider"
            />

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => { setStep('info'); setConfirmText(''); setError(''); }}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleRequestDeletion}
                disabled={confirmText !== 'SUPPRIMER' || loading}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Supprimer
              </button>
            </div>
          </div>
        )}

        {/* Done */}
        {step === 'done' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 mb-4">
              <CheckCircle className="w-8 h-8 text-teal-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Demande enregistrée</h2>
            <p className="text-slate-500 text-sm">
              Votre compte a été désactivé. Un email de confirmation vous a été envoyé.
              Vos données seront définitivement supprimées dans{' '}
              <strong className="text-slate-800">30 jours</strong>.
            </p>
            <p className="text-slate-400 text-xs mt-4">
              Pour annuler, reconnectez-vous pendant ce délai et revenez sur cette page.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
