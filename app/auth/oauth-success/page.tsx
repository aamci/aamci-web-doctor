'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../_providers/AuthProvider';

export default function OAuthSuccessPage() {
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    // Refetch user to get the current session
    login();

    // Redirect to home after a brief delay
    const timer = setTimeout(() => {
      router.push('/');
    }, 1500);

    return () => clearTimeout(timer);
  }, [router, login]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '24px',
      }}
    >
      <div className="card" style={{ maxWidth: 400, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
        <h2 style={{ margin: '0 0 8px', fontSize: 24 }}>Connexion réussie !</h2>
        <p style={{ margin: 0, color: '#666' }}>
          Redirection en cours...
        </p>
      </div>
    </div>
  );
}
