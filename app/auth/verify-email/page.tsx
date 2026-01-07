'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../_providers/AuthProvider';

function getApiBase(): string | null {
  let base = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  base = base.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  try {
    return base ? new URL(base).toString().replace(/\/$/, '') : null;
  } catch {
    return null;
  }
}

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Vérification de votre email en cours...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token de vérification manquant.');
      return;
    }

    async function verifyEmail() {
      const apiBase = getApiBase();
      const url = apiBase
        ? `${apiBase}/auth/verify-email?token=${token}`
        : `/auth/verify-email?token=${token}`;

      try {
        const res = await fetch(url, {
          method: 'GET',
          credentials: 'include', // Important pour les cookies
        });

        const data = await res.json();

        if (res.ok) {
          setStatus('success');
          setMessage(data.message || 'Email vérifié avec succès !');

          // Refetch user session
          await login();

          // Redirect après 2 secondes
          setTimeout(() => {
            router.push('/');
          }, 2000);
        } else {
          setStatus('error');
          setMessage(data.message || 'Erreur lors de la vérification de l\'email.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Erreur de connexion au serveur.');
      }
    }

    verifyEmail();
  }, [token, router, login]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '24px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: 500,
          textAlign: 'center',
          padding: '40px',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        {status === 'loading' && (
          <>
            <div
              style={{
                fontSize: 48,
                marginBottom: 20,
                animation: 'spin 2s linear infinite',
              }}
            >
              ⏳
            </div>
            <h2 style={{ margin: '0 0 16px', fontSize: 24, color: '#333' }}>
              Vérification en cours...
            </h2>
            <p style={{ margin: 0, color: '#666', lineHeight: 1.6 }}>
              {message}
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ fontSize: 64, marginBottom: 20 }}>✅</div>
            <h2 style={{ margin: '0 0 16px', fontSize: 24, color: '#10b981' }}>
              Email vérifié !
            </h2>
            <p style={{ margin: 0, color: '#666', lineHeight: 1.6 }}>
              {message}
            </p>
            <p style={{ marginTop: 16, color: '#999', fontSize: 14 }}>
              Redirection vers l'accueil...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize: 64, marginBottom: 20 }}>❌</div>
            <h2 style={{ margin: '0 0 16px', fontSize: 24, color: '#ef4444' }}>
              Erreur de vérification
            </h2>
            <p style={{ margin: '0 0 24px', color: '#666', lineHeight: 1.6 }}>
              {message}
            </p>

            {message.includes('expired') && (
              <ResendVerificationForm />
            )}

            <button
              onClick={() => router.push('/auth/login')}
              className="btn primary"
              style={{ marginTop: 16 }}
            >
              Retour à la connexion
            </button>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

function ResendVerificationForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const apiBase = getApiBase();
    const url = apiBase
      ? `${apiBase}/auth/resend-verification`
      : `/auth/resend-verification`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('✅ Email de vérification envoyé ! Vérifiez votre boîte de réception.');
      } else {
        setMessage(`❌ ${data.message || 'Erreur lors de l\'envoi'}`);
      }
    } catch (error) {
      setMessage('❌ Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        marginTop: 24,
        padding: 20,
        background: '#f9fafb',
        borderRadius: 8,
        border: '1px solid #e5e7eb',
      }}
    >
      <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#374151' }}>
        Renvoyer l'email de vérification
      </h3>
      <form onSubmit={handleResend} style={{ display: 'grid', gap: 12 }}>
        <input
          type="email"
          placeholder="Votre email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="input"
          style={{ width: '100%' }}
        />
        <button type="submit" disabled={loading} className="btn primary">
          {loading ? 'Envoi...' : 'Renvoyer l\'email'}
        </button>
        {message && (
          <p style={{ margin: 0, fontSize: 14, textAlign: 'center' }}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
