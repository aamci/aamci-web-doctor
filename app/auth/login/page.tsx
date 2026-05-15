'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../_providers/AuthProvider';
import {
  Eye, EyeOff, Key, Lock, Mail, User,
  Loader2, CheckCircle, AlertTriangle, ArrowRight,
  Calendar, Users, Wallet, Shield,
} from 'lucide-react';

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
    if (!email) { setErr('Entrez votre email pour renvoyer la vérification.'); return; }
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

  const inputCls = (hasIcon = true, error = false) =>
    `w-full ${hasIcon ? 'pl-11' : 'px-4'} pr-4 py-3 text-sm bg-slate-800 border rounded-xl text-white placeholder-slate-500 outline-none transition-all ` +
    (error
      ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
      : 'border-slate-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20');

  return (
    <div className="min-h-screen bg-slate-900 flex">

      {/* ── Left panel — branding ──────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-800 p-12 flex-col justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center">
            <span className="text-xl font-bold text-white">M</span>
          </div>
          <span className="text-white text-lg font-bold">MedPro</span>
        </div>

        {/* Main copy */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-600/20 rounded-full text-teal-400 text-sm">
            <span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
            Espace Médecin
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight">
            Votre vocation,<br />c'est de soigner.<br />
            <span className="text-teal-400">On s'occupe du reste.</span>
          </h1>
          <p className="text-slate-400 text-base max-w-md leading-relaxed">
            Gérez votre agenda, suivez vos patients et développez votre activité depuis une seule interface.
          </p>

          {/* Feature cards */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="bg-slate-700/50 rounded-xl p-4">
              <Calendar className="w-7 h-7 text-teal-400 mb-2" />
              <div className="text-white text-sm font-semibold">Planning</div>
              <div className="text-slate-400 text-xs">Agenda en temps réel</div>
            </div>
            <div className="bg-slate-700/50 rounded-xl p-4">
              <Users className="w-7 h-7 text-teal-400 mb-2" />
              <div className="text-white text-sm font-semibold">Patients</div>
              <div className="text-slate-400 text-xs">Dossiers centralisés</div>
            </div>
            <div className="bg-slate-700/50 rounded-xl p-4">
              <Wallet className="w-7 h-7 text-teal-400 mb-2" />
              <div className="text-white text-sm font-semibold">Revenus</div>
              <div className="text-slate-400 text-xs">Suivi financier</div>
            </div>
          </div>
        </div>

        {/* Trust badges */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <Shield className="w-3.5 h-3.5 shrink-0" />
            <span>Données hébergées en France · RGPD · Chiffrement E2E</span>
          </div>
          <div className="flex items-center gap-2">
            {['ISO 27001', 'HDS', 'RGPD'].map(tag => (
              <span key={tag} className="px-2.5 py-1 rounded-full border border-slate-700 text-slate-500 text-[11px]">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel — form ─────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[420px]">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center">
              <span className="text-xl font-bold text-white">M</span>
            </div>
            <span className="text-white text-lg font-bold">MedPro</span>
          </div>

          {/* Header */}
          <div className="mb-6 text-center lg:text-left">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-teal-600/20 text-teal-400 rounded-full text-xs font-medium mb-4">
              Espace Médecin
            </span>
            <h2 className="text-2xl font-bold text-white">
              {tab === 'login' ? 'Bon retour !' : 'Créer un compte'}
            </h2>
            <p className="text-slate-400 mt-1 text-sm">
              {tab === 'login'
                ? 'Connectez-vous à votre espace professionnel'
                : 'Rejoignez la plateforme en quelques secondes'}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex bg-slate-800 rounded-xl p-1 mb-6">
            <button
              type="button"
              onClick={() => { setTab('login'); setErr(null); }}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                tab === 'login' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => { setTab('register'); setRegErr(null); setRegSuccess(false); }}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                tab === 'register' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Inscription
            </button>
          </div>

          {/* ── Login form ── */}
          {tab === 'login' && (
            <>
              {err && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm mb-4 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{err}</span>
                </div>
              )}
              {showResend && !resendSuccess && (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendLoading}
                  className="w-full py-2.5 mb-4 border border-teal-500/40 text-teal-400 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-teal-500/10 disabled:opacity-50 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  {resendLoading ? 'Envoi…' : "Renvoyer l'email de vérification"}
                </button>
              )}
              {resendSuccess && (
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm mb-4 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  Email envoyé ! Vérifiez votre boîte mail.
                </div>
              )}

              <form onSubmit={(e) => { e.preventDefault(); void handleLogin(); }} className="space-y-4">
                <div>
                  <label className="block text-slate-300 text-xs font-medium mb-1.5">Adresse e-mail</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="vous@clinique.fr"
                      className={inputCls(true)}
                    />
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-medium mb-1.5">Mot de passe</label>
                  <div className="relative">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`${inputCls(true)} pr-11`}
                    />
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowPwd(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="w-3.5 h-3.5 accent-teal-500"
                    />
                    <span className="text-slate-400 text-xs">Se souvenir de moi</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => router.push('/auth/forgot-password' as any)}
                    className="text-teal-400 text-xs hover:text-teal-300 transition-colors"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Connexion…</>
                  ) : (
                    <>Se connecter <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>

                <div className="flex items-center gap-3 my-2">
                  <div className="flex-1 h-px bg-slate-700" />
                  <span className="text-slate-500 text-xs">OU</span>
                  <div className="flex-1 h-px bg-slate-700" />
                </div>

                <button
                  type="button"
                  className="w-full py-3 flex items-center justify-center gap-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800 transition-colors"
                >
                  <Key className="w-4 h-4 text-teal-400" />
                  S'identifier avec Pro Santé Connect
                </button>
              </form>
            </>
          )}

          {/* ── Register form ── */}
          {tab === 'register' && (
            <>
              {regSuccess ? (
                <div className="rounded-xl border border-teal-500/30 bg-teal-500/10 p-6 text-center">
                  <CheckCircle className="w-10 h-10 text-teal-400 mx-auto mb-3" />
                  <p className="text-teal-300 font-semibold mb-1">Inscription réussie !</p>
                  <p className="text-slate-400 text-sm">
                    Un email de vérification a été envoyé à{' '}
                    <span className="text-white">{regEmail}</span>.
                  </p>
                  <button
                    onClick={() => { setTab('login'); setRegSuccess(false); }}
                    className="mt-4 text-teal-400 text-sm hover:text-teal-300 transition-colors"
                  >
                    Retour à la connexion
                  </button>
                </div>
              ) : (
                <>
                  {regErr && (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm mb-4 flex items-start gap-3">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{regErr}</span>
                    </div>
                  )}

                  <form onSubmit={(e) => { e.preventDefault(); void handleRegister(); }} className="space-y-4">
                    <div>
                      <label className="block text-slate-300 text-xs font-medium mb-1.5">Nom complet</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="Dr Jean Dupont"
                          className={inputCls(true)}
                        />
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 text-xs font-medium mb-1.5">Email professionnel</label>
                      <div className="relative">
                        <input
                          type="email"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="vous@clinique.fr"
                          className={inputCls(true)}
                        />
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 text-xs font-medium mb-1.5">Mot de passe</label>
                      <div className="relative">
                        <input
                          type={showRegPwd ? 'text' : 'password'}
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Min. 8 caractères"
                          className={`${inputCls(true)} pr-11`}
                        />
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                        <button
                          type="button"
                          onClick={() => setShowRegPwd(s => !s)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          {showRegPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={regLoading}
                      className="w-full py-3.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                      {regLoading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Inscription…</>
                      ) : (
                        <>Créer mon compte <ArrowRight className="w-4 h-4" /></>
                      )}
                    </button>

                    <p className="text-slate-600 text-[11px] text-center">
                      En créant un compte, vous acceptez nos{' '}
                      <a href="/conditions-utilisation" target="_blank" className="text-teal-600 hover:underline">conditions d&apos;utilisation</a>
                      {' '}et notre{' '}
                      <a href="/politique-confidentialite" target="_blank" className="text-teal-600 hover:underline">politique de confidentialité</a>.
                    </p>
                  </form>
                </>
              )}
            </>
          )}

          {/* Footer link */}
          <p className="text-center text-slate-500 text-xs mt-8">
            {tab === 'login' ? (
              <>
                Pas encore de compte ?{' '}
                <button
                  onClick={() => { setTab('register'); setErr(null); }}
                  className="text-teal-400 hover:text-teal-300 font-medium transition-colors"
                >
                  Créer un compte
                </button>
              </>
            ) : (
              <>
                Déjà un compte ?{' '}
                <button
                  onClick={() => { setTab('login'); setRegErr(null); setRegSuccess(false); }}
                  className="text-teal-400 hover:text-teal-300 font-medium transition-colors"
                >
                  Se connecter
                </button>
              </>
            )}
          </p>
          <div className="mt-6 flex items-center justify-center gap-3 text-[11px] text-slate-500">
            <a href="/conditions-utilisation" className="hover:text-teal-600 transition-colors">CGU</a>
            <span>·</span>
            <a href="/politique-confidentialite" className="hover:text-teal-600 transition-colors">Confidentialité</a>
          </div>
        </div>
      </div>
    </div>
  );
}
