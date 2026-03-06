'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

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

export default function ForgotPassword() {
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center gap-2 mb-8">
          <span className="text-2xl">🩺</span>
          <span className="text-lg font-bold text-gray-900">Espace Médecin</span>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="text-5xl mb-4">✉️</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Email envoyé !</h2>
            <p className="text-gray-500 text-sm mb-6">
              Si un compte existe avec l&apos;adresse <strong>{email}</strong>, vous recevrez un lien de réinitialisation dans quelques minutes.
            </p>
            <button
              onClick={() => router.push('/auth/login' as any)}
              className="text-sm text-blue-600 hover:underline"
            >
              Retour à la connexion
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Mot de passe oublié ?</h2>
            <p className="text-gray-500 text-sm mb-6">
              Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email professionnel</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@clinique.fr"
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
                disabled={loading}
                className="w-full py-3 bg-blue-700 text-white rounded-lg font-semibold text-sm hover:bg-blue-800 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Envoi…' : 'Envoyer le lien'}
              </button>

              <button
                type="button"
                onClick={() => router.push('/auth/login' as any)}
                className="w-full py-2.5 text-sm text-gray-600 hover:text-gray-900"
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
