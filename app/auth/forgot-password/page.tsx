'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, ArrowLeft, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

function getApiBase(): string | null {
  let b = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  b = b.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  if (!b) return null;
  try { new URL(b); return b; } catch { return null; }
}

async function callApi(p: string, i?: RequestInit) {
  const b = getApiBase();
  return fetch(b ? `${b}${p}` : `/api${p}`, i);
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!email) { setErr("L'email est obligatoire."); return; }
    setLoading(true);
    try {
      await callApi('/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch (e: any) {
      setErr(e?.message || 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center">
            <span className="text-xl font-bold text-white">M</span>
          </div>
          <span className="text-white text-lg font-bold">MedPro</span>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-teal-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-teal-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Email envoyé !</h1>
            <p className="text-slate-400 text-sm mb-2">
              Si un compte existe avec l&apos;adresse{' '}
              <span className="text-white font-medium">{email}</span>,
              vous recevrez un lien de réinitialisation dans quelques minutes.
            </p>
            <p className="text-slate-500 text-xs mb-8">Vérifiez également vos spams.</p>
            <button
              onClick={() => router.push('/auth/login' as any)}
              className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-semibold text-sm transition-colors"
            >
              Retour à la connexion
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>

            <h1 className="text-2xl font-bold text-white mb-2">Mot de passe oublié ?</h1>
            <p className="text-slate-400 text-sm mb-8">
              Saisissez votre adresse e-mail professionnelle. Nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </p>

            {err && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm mb-4 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{err}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-xs font-medium mb-1.5">
                  Adresse e-mail professionnelle
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@clinique.fr"
                    className="w-full pl-11 pr-4 py-3 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
                  />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Envoi en cours…</>
                ) : (
                  'Envoyer le lien de réinitialisation'
                )}
              </button>

              <button
                type="button"
                onClick={() => router.push('/auth/login' as any)}
                className="w-full py-2.5 text-sm text-slate-500 hover:text-slate-300 transition-colors"
              >
                ← Retour à la connexion
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
