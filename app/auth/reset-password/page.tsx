'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!token) { setErr('Token manquant ou invalide.'); return; }
    if (!password) { setErr('Le mot de passe est obligatoire.'); return; }
    if (password.length < 8) { setErr('Le mot de passe doit contenir au moins 8 caractères.'); return; }
    if (password !== confirm) { setErr('Les mots de passe ne correspondent pas.'); return; }
    setLoading(true);
    try {
      const r = await callApi('/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setErr(d.message || 'Token invalide ou expiré.');
        return;
      }
      setSuccess(true);
    } catch (e: any) {
      setErr(e?.message || 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center gap-2 mb-8">
          <span className="text-2xl">🩺</span>
          <span className="text-lg font-bold text-gray-900">Espace Médecin</span>
        </div>

        {success ? (
          <div className="text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Mot de passe réinitialisé !</h2>
            <p className="text-gray-500 text-sm mb-6">
              Votre mot de passe a été mis à jour avec succès. Vous pouvez maintenant vous connecter.
            </p>
            <button
              onClick={() => router.push('/auth/login' as any)}
              className="w-full py-3 bg-blue-700 text-white rounded-lg font-semibold text-sm hover:bg-blue-800 transition-colors"
            >
              Se connecter
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Nouveau mot de passe</h2>
            <p className="text-gray-500 text-sm mb-6">Choisissez un mot de passe sécurisé pour votre compte.</p>

            {!token && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
                Lien invalide ou expiré. Veuillez refaire une demande de réinitialisation.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
                <div className="flex gap-2">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 caractères"
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((s) => !s)}
                    className="px-3 py-2.5 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-50"
                  >
                    {showPwd ? 'Masquer' : 'Voir'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {err && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                  {err}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !token}
                className="w-full py-3 bg-blue-700 text-white rounded-lg font-semibold text-sm hover:bg-blue-800 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Enregistrement…' : 'Enregistrer le mot de passe'}
              </button>

              <button
                type="button"
                onClick={() => router.push('/auth/forgot-password' as any)}
                className="w-full py-2.5 text-sm text-gray-600 hover:text-gray-900"
              >
                ← Refaire une demande
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
