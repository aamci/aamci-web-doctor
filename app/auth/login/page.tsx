'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../_providers/AuthProvider';
import { Eye, EyeOff, Key, Sparkles, Lock, ArrowRight } from 'lucide-react';

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

  const inputCls = 'w-full px-4 py-3 bg-white rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 border-0';

  return (
    <div className="min-h-screen flex" style={{ background: '#0d1523' }}>

      {/* ── Left panel — form ─────────────────────────────────────────── */}
      <div className="flex-1 lg:w-[45%] lg:flex-none flex flex-col justify-center px-8 sm:px-14 py-12" style={{ background: '#0d1523' }}>
        {/* Logo */}
        <div className="flex items-center gap-2 mb-12">
          <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <span className="text-white font-semibold text-sm tracking-wide">MedPro</span>
        </div>

        <div className="max-w-sm w-full mx-auto lg:mx-0">

          {tab === 'login' ? (
            <>
              <h1 className="text-3xl font-bold text-white mb-1">Identifiez-vous</h1>
              <p className="text-slate-400 text-sm mb-8">Accedez a votre espace de soins coordonnes</p>

              <form onSubmit={(e) => { e.preventDefault(); void handleLogin(); }} className="space-y-4">
                <div>
                  <label className="block text-slate-300 text-xs font-medium mb-1.5">Adresse e-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@clinique.fr"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-medium mb-1.5">Mot de passe</label>
                  <div className="relative">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={inputCls + ' pr-11'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {err && (
                  <div className="text-red-400 text-xs px-1">{err}</div>
                )}
                {showResend && !resendSuccess && (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendLoading}
                    className="w-full py-2.5 border border-teal-500/40 text-teal-400 rounded-xl text-sm hover:bg-teal-500/10 disabled:opacity-50 transition-colors"
                  >
                    {resendLoading ? 'Envoi…' : "Renvoyer l'email de vérification"}
                  </button>
                )}
                {resendSuccess && (
                  <div className="text-teal-400 text-xs px-1">Email envoyé ! Vérifiez votre boîte mail.</div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold text-sm tracking-widest uppercase transition-colors disabled:opacity-50 mt-2"
                >
                  {loading ? 'Connexion…' : 'Continuer'}
                </button>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-slate-400 text-xs cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="w-3.5 h-3.5 accent-teal-500"
                    />
                    Se souvenir de moi
                  </label>
                  <button
                    type="button"
                    onClick={() => router.push('/auth/forgot-password' as any)}
                    className="text-teal-400 text-xs hover:text-teal-300 transition-colors"
                  >
                    Un probleme pour vous connecter ?
                  </button>
                </div>

                <div className="flex items-center gap-3 my-2">
                  <div className="flex-1 h-px bg-slate-700" />
                  <span className="text-slate-500 text-xs">OU</span>
                  <div className="flex-1 h-px bg-slate-700" />
                </div>

                <button
                  type="button"
                  className="w-full py-3 flex items-center justify-center gap-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800 transition-colors"
                >
                  <Key className="w-4 h-4" />
                  S&apos;identifier avec Pro Santé Connect
                </button>
              </form>

              <p className="text-center text-slate-500 text-xs mt-8">
                Pas encore de compte ?{' '}
                <button
                  onClick={() => { setTab('register'); setErr(null); }}
                  className="text-teal-400 hover:text-teal-300 font-medium transition-colors"
                >
                  Creer un compte
                </button>
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-white mb-1">Creer un compte</h1>
              <p className="text-slate-400 text-sm mb-8">Rejoignez la plateforme en quelques secondes</p>

              {regSuccess ? (
                <div className="rounded-xl border border-teal-500/30 bg-teal-500/10 p-6 text-center">
                  <p className="text-teal-300 font-semibold mb-1">Inscription reussie !</p>
                  <p className="text-slate-400 text-sm">
                    Un email de verification a ete envoye a <span className="text-white">{regEmail}</span>.
                  </p>
                  <button
                    onClick={() => { setTab('login'); setRegSuccess(false); }}
                    className="mt-4 text-teal-400 text-sm hover:text-teal-300 transition-colors"
                  >
                    Retour a la connexion
                  </button>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); void handleRegister(); }} className="space-y-4">
                  <div>
                    <label className="block text-slate-300 text-xs font-medium mb-1.5">Nom complet</label>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Dr Jean Dupont"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-xs font-medium mb-1.5">Email professionnel</label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="vous@clinique.fr"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-xs font-medium mb-1.5">Mot de passe</label>
                    <div className="relative">
                      <input
                        type={showRegPwd ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Min. 8 caracteres"
                        className={inputCls + ' pr-11'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPwd(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showRegPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {regErr && <div className="text-red-400 text-xs px-1">{regErr}</div>}

                  <button
                    type="submit"
                    disabled={regLoading}
                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold text-sm tracking-widest uppercase transition-colors disabled:opacity-50 mt-2"
                  >
                    {regLoading ? 'Inscription…' : 'Creer mon compte'}
                  </button>

                  <p className="text-slate-600 text-[11px] text-center">
                    En creant un compte, vous acceptez les conditions d&apos;utilisation.
                  </p>
                </form>
              )}

              <p className="text-center text-slate-500 text-xs mt-8">
                Deja un compte ?{' '}
                <button
                  onClick={() => { setTab('login'); setRegErr(null); setRegSuccess(false); }}
                  className="text-teal-400 hover:text-teal-300 font-medium transition-colors"
                >
                  Se connecter
                </button>
              </p>
            </>
          )}
        </div>
      </div>

      {/* ── Right panel — branding ────────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-1 flex-col justify-center px-16 py-12"
        style={{ background: '#101e34' }}
      >
        {/* "NOUVEAU" badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-teal-500/40 bg-teal-500/10 w-fit mb-8">
          <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          <span className="text-teal-400 text-xs font-semibold tracking-wider uppercase">Nouveau</span>
        </div>

        <h2 className="text-4xl font-bold text-white leading-tight mb-6">
          Votre vocation, c&apos;est de soigner.{' '}
          La notre, c&apos;est de vous simplifier le quotidien.
        </h2>

        <p className="text-amber-400 text-sm leading-relaxed mb-10 max-w-md">
          Chaque minute gagnee se transforme en temps medical de qualite.
          Concentrez-vous sur vos patients, on s&apos;occupe du reste.
        </p>

        <div className="space-y-4 mb-12">
          {[
            "Facilitez l'acces aux soins pour vos patients",
            "Profitez d'une interface tout-en-un, 100% integree",
            "Valorisez votre expertise et votre temps medical",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <ArrowRight className="w-4 h-4 text-teal-400 flex-shrink-0" />
              <span className="text-slate-200 text-sm">{item}</span>
            </div>
          ))}
        </div>

        <button className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-semibold transition-colors w-fit">
          Decouvrir la plateforme
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Trust badges */}
        <div className="mt-12 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs">
            <Lock className="w-3.5 h-3.5" />
            <span>Donnees hebergees en France, conformement au RGPD, en serveurs certifies</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            {['ISO 27001', 'RGPD', 'Chiffrement E2E'].map(tag => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-full border border-slate-700 text-slate-500 text-[11px]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
