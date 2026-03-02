// app/auth/login/page.tsx (par ex, côté doctor)
'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../_providers/AuthProvider';
import styles from './Login.module.css';

function getApiBase(): string | null {
  let b = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  b = b.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  if (!b) return null;
  try {
    new URL(b);
    return b;
  } catch {
    return null;
  }
}

async function callApi(p: string, i?: RequestInit) {
  const b = getApiBase();
  const u = b ? `${b}${p}` : `/api${p}`;
  return fetch(u, i);
}

export default function Login() {
  const router = useRouter();
  const { login: setAuthToken } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const s = localStorage.getItem('login_email');
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
    setLoading(true);
    try {
      if (!email || !password) {
        setErr('Veuillez renseigner votre email et mot de passe.');
        return;
      }
      if (emailInvalid) {
        setErr('Adresse e-mail invalide.');
        return;
      }

      const r = await callApi('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Send and receive cookies
        body: JSON.stringify({ email, password }),
      });

      if (!r.ok) {
        const errorData = await r.json().catch(() => ({}));
        const msg = errorData.message || (r.status === 401 ? 'Identifiants incorrects.' : `Erreur ${r.status}.`);
        if (typeof msg === 'string' && msg.toLowerCase().includes('not verified')) {
          setShowResend(true);
          setErr('Votre email n\'est pas encore vérifié. Vérifiez votre boîte mail ou renvoyez l\'email.');
        } else {
          setErr(Array.isArray(msg) ? msg.join(', ') : msg);
        }
        return;
      }

      const d = await r.json();

      // Save token from response body (for cross-origin scenarios)
      if (d?.success && d?.token) {
        // Store the JWT token in localStorage
        localStorage.setItem('token', d.token);

        setToken('authenticated');
        remember
          ? localStorage.setItem('login_email', email)
          : localStorage.removeItem('login_email');

        // Fetch user data from /auth/me endpoint
        await setAuthToken();

        // Redirect to planning page for doctors
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
      if (r.ok) {
        setResendSuccess(true);
        setErr(null);
      } else {
        const d = await r.json().catch(() => ({}));
        setErr(d.message || 'Erreur lors de l\'envoi.');
      }
    } catch {
      setErr('Erreur réseau.');
    } finally {
      setResendLoading(false);
    }
  }

return (
  <div className={styles.page}>
    <section className={styles.card}>
      <header className={styles.header}>
        <div className={styles.logo}>🩺</div>
        <div>
          <h1 className={styles.title}>Connexion médecin</h1>
          <p className={styles.sub}>Accédez à votre espace sécurisé</p>
        </div>
      </header>

      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          void handleLogin();
        }}
      >
        <div className={styles.field}>
          <label htmlFor="email" className={styles.label}>
            Email professionnel
          </label>
          <input
            id="email"
            className={styles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={emailInvalid}
            placeholder="vous@clinique.fr"
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="pwd" className={styles.label}>
            Mot de passe
          </label>
          <div className={styles.pwdRow}>
            <input
              id="pwd"
              className={styles.input}
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            {/* garde ta classe .btn existante si tu veux, ou remplace par Tailwind/shadcn */}
            <button
              type="button"
              className="btn outline small"
              onClick={() => setShowPwd((s) => !s)}
            >
              {showPwd ? 'Masquer' : 'Afficher'}
            </button>
          </div>
        </div>

        <div className={styles.inlineBetween}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <span>Se souvenir de moi</span>
          </label>
          <button type="button" className={styles.linkBtn}>
            Mot de passe oublié ?
          </button>
        </div>

        {/* ici tu peux garder tes .banner existantes en global */}
        {err && <div className="banner error">{err}</div>}
        {showResend && !resendSuccess && (
          <button
            type="button"
            onClick={handleResend}
            disabled={resendLoading}
            style={{ marginBottom: '0.75rem', width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #5eead4', background: 'transparent', color: '#2dd4bf', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            {resendLoading ? 'Envoi…' : '📧 Renvoyer l\'email de vérification'}
          </button>
        )}
        {resendSuccess && <div className="banner success">Email envoyé ! Vérifiez votre boîte mail.</div>}
        {token && <div className="banner success">Connecté ✔</div>}

        <button
          type="submit"
          className="btn primary full"
          disabled={loading}
        >
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>

        <p className={styles.help}>
          Compte médecin fourni par l’administrateur de la plateforme.
        </p>
      </form>
    </section>
  </div>
);
}