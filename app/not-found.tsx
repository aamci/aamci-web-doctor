// app/not-found.tsx
export default function NotFound() {
  return (
    <div
      style={{
        maxWidth: 480,
        margin: '48px auto',
        padding: '24px 20px',
        borderRadius: 16,
        border: '1px solid #e5e7eb',
        background: '#ffffff',
        boxShadow:
          '0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.06)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 999,
          margin: '0 auto 12px',
          background: '#eff6ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
        }}
      >
        🩺
      </div>

      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 6 }}>
        Page introuvable
      </h1>
      <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
        La page que vous cherchez n’existe pas ou n’est plus disponible.
      </p>

      <a
        href="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 14px',
          borderRadius: 999,
          border: '1px solid #2563eb',
          background: '#2563eb',
          color: '#ffffff',
          fontSize: 14,
          textDecoration: 'none',
        }}
      >
        ← Retour à l&apos;accueil
      </a>
    </div>
  );
}