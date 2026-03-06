'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../_providers/AuthProvider';

function getApiBase(): string | null {
  let b = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  b = b.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  if (!b) return null;
  try { new URL(b); return b; } catch { return null; }
}

async function callApi(p: string, i?: RequestInit) {
  const b = getApiBase();
  const u = b ? `${b}${p}` : `/api${p}`;
  return fetch(u, i);
}

export default function Login() {
  const router = useRouter();
  const { login: setAuthToken } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPwd, setShowRegPwd] = useState(false);
  const [regErr, setRegErr] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState(false);
  const [regLoading, setRegLoading] = useState(false);

  useEffect(() => {
    const s = typeof window !== 'undefined' ? localStorage.getItem('login_email') : null;
    if (s) setEmail(s);
  }, []);

  const emailInvalid = useMemo(
    () => (!email ? false : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)),
    [email],
  );

  async function handleLogin() {
    setErr(null);
    setShowResend(false);
    setResendSuccess(false);
    if (!email || !password) { setErr('Veuillez renseigner votre email et mot de passe.'); return; }
    if (emailInvalid) { setErr('Adresse e-mail invalide.'); return; }
    setLoading(true);
    try {
      const r = await callApi('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        const msg = d.message || (r.status === 401 ? 'Identifiants incorrects.' : `Erreur ${r.status}.`);
        if (typeof msg === 'string' && msg.toLowerCase().includes('not verified')) {
          setShowResend(true);
          setErr("Votre email n'est pas encore vérifié. Vérifiez votre boîte mail ou renvoyez l'email.");
        } else {
          setErr(Array.isArray(msg) ? msg.join(', ') : msg);
        }
        return;
      }
      const d = await r.json();
      if (d?.success && d?.token) {
        localStorage.setItem('token', d.token);
        remember ? localStorage.setItem('login_email', email) : localStorage.removeItem('login_email');
        await setAuthToken();
        router.replace('/planning');
      } else {
        setErr('Réponse inattendue du serveur.');
      }
    } catch (e: any) {
      setErr(e?.message || 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email) { setErr("Entrez votre email pour renvoyer la vérification."); return; }
    setResendLoading(true);
    try {
      const r = await callApi('/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (r.ok) { setResendSuccess(true); setErr(null); }
      else { const d = await r.json().catch(() => ({})); setErr(d.message || "Erreur lors de l'envoi."); }
    } catch { setErr('Erreur réseau.'); }
    finally { setResendLoading(false); }
  }

  async function handleRegister() {
    setRegErr(null);
    if (!regName || !regEmail || !regPassword) { setRegErr('Tous les champs sont obligatoires.'); return; }
    if (regPassword.length < 8) { setRegErr('Le mot de passe doit contenir au moins 8 caractères.'); return; }
    setRegLoading(true);
    try {
      const r = await callApi('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail, password: regPassword, fullName: regName, role: 'DOCTOR' }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setRegErr(Array.isArray(d.message) ? d.message.join(', ') : d.message || `Erreur ${r.status}.`); return; }
      setRegSuccess(true);
    } catch (e: any) {
      setRegErr(e?.message || 'Erreur réseau');
    } finally {
      setRegLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-700 to-blue-900 text-white flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🩺</span>
          <span className="text-xl font-bold tracking-tight">Espace Médecin</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Gérez votre pratique médicale en toute simplicité
          </h1>
          <p className="text-blue-200 text-lg mb-10">
            Planning, patients, prescriptions et facturation — tout en un seul endroit.
          </p>
          <div className="space-y-4">
            {[
              { icon: '📅', label: 'Planning intelligent', desc: 'Gérez vos disponibilités et rendez-vous' },
              { icon: '👥', label: 'Dossiers patients', desc: 'Historique complet et notes médicales' },
              { icon: '💰', label: 'Suivi des revenus', desc: 'Wallet, paiements et bilans financiers' },
            ].map((f) => (
              <div key={f.label} className="flex items-start gap-4">
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <p className="font-semibold">{f.label}</p>
                  <p className="text-blue-300 text-sm">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-blue-400 text-sm">© 2026 Plateforme Santé — Tous droits réservés</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            <span className="text-2xl">🩺</span>
            <span className="text-lg font-bold text-gray-900">Espace Médecin</span>
          </div>

          {/* Tabs */}
          <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-8">
            {(['login', 'register'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setErr(null); setRegErr(null); setRegSuccess(false); }}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                  tab === t
                    ? 'bg-blue-700 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t === 'login' ? 'Connexion' : 'Créer un compte'}
              </button>
            ))}
          </div>

          {/* ── LOGIN ── */}
          {tab === 'login' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Bon retour !</h2>
              <p className="text-gray-500 text-sm mb-6">Connectez-vous à votre espace médecin</p>

              <form onSubmit={(e) => { e.preventDefault(); void handleLogin(); }} className="space-y-4">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                  <div className="flex gap-2">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
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

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="rounded" />
                    Se souvenir de moi
                  </label>
                  <button
                    type="button"
                    onClick={() => router.push('/auth/forgot-password' as any)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>

                {err && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{err}</div>}
                {showResend && !resendSuccess && (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendLoading}
                    className="w-full py-2.5 border border-teal-400 text-teal-600 rounded-lg text-sm hover:bg-teal-50 disabled:opacity-50"
                  >
                    {resendLoading ? 'Envoi…' : "📧 Renvoyer l'email de vérification"}
                  </button>
                )}
                {resendSuccess && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">Email envoyé ! Vérifiez votre boîte mail.</div>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-700 text-white rounded-lg font-semibold text-sm hover:bg-blue-800 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Connexion…' : 'Se connecter'}
                </button>
              </form>
            </div>
          )}

          {/* ── REGISTER ── */}
          {tab === 'register' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Créer un compte médecin</h2>
              <p className="text-gray-500 text-sm mb-6">Rejoignez la plateforme en quelques secondes</p>

              {regSuccess ? (
                <div className="bg-green-50 border border-green-200 text-green-800 p-6 rounded-xl text-center">
                  <div className="text-3xl mb-2">✉️</div>
                  <p className="font-semibold mb-1">Inscription réussie !</p>
                  <p className="text-sm text-green-700">
                    Un email de vérification a été envoyé à <strong>{regEmail}</strong>. Vérifiez votre boîte mail pour activer votre compte.
                  </p>
                  <button
                    onClick={() => setTab('login')}
                    className="mt-4 text-sm text-blue-600 hover:underline"
                  >
                    Retour à la connexion
                  </button>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); void handleRegister(); }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Dr Jean Dupont"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email professionnel</label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="vous@clinique.fr"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                    <div className="flex gap-2">
                      <input
                        type={showRegPwd ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Min. 8 caractères"
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPwd((s) => !s)}
                        className="px-3 py-2.5 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-50"
                      >
                        {showRegPwd ? 'Masquer' : 'Voir'}
                      </button>
                    </div>
                  </div>

                  {regErr && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{regErr}</div>}

                  <button
                    type="submit"
                    disabled={regLoading}
                    className="w-full py-3 bg-blue-700 text-white rounded-lg font-semibold text-sm hover:bg-blue-800 disabled:opacity-50 transition-colors"
                  >
                    {regLoading ? 'Inscription…' : 'Créer mon compte'}
                  </button>

                  <p className="text-xs text-gray-500 text-center">
                    En créant un compte, vous acceptez les conditions d&apos;utilisation de la plateforme.
                  </p>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
