// app/_components/Navbar.tsx
'use client';
import Link from 'next/link'; 
import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../_providers/AuthProvider';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // fermer le menu cliquer dehors
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const linksForDoctor = [
    { href: '/availability', label: 'Planning' },
    { href: '/appointments', label: 'Mes rendez-vous' },
  ];

  const linksForPatient = [
    { href: '/', label: 'Accueil' },
    { href: '/doctors', label: 'Trouver un médecin' },
    { href: '/facilities', label: 'Établissements' },
    { href: '/appointments', label: 'Mes rendez-vous' },
  ];

  const links = user?.role === 'DOCTOR' ? linksForDoctor : linksForPatient;

  return (
    <header
      style={{
        borderBottom: '1px solid #eee',
        background: '#fff',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          gap: 16,
        }}
      >
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
          onClick={() => router.push('/')}
        >
          <span style={{ fontWeight: 700 }}>Plateforme Santé</span>
          {user?.role && (
            <span
              style={{
                fontSize: 11,
                background: '#eef2ff',
                color: '#4338ca',
                padding: '2px 6px',
                borderRadius: 999,
              }}
            >
              {user.role === 'DOCTOR' ? 'Espace médecin' : 'Espace patient'}
            </span>
          )}
        </div>

        <nav style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {links.map((l) => (
            <button
              key={l.href}
              onClick={() => router.push(l.href as any)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                padding: '4px 8px',
                borderRadius: 6,
                color: pathname === l.href ? '#0f62fe' : '#111',
                fontWeight: pathname === l.href ? 600 : 400,
              }}
            >
              {l.label}
            </button>
          ))}
        </nav>

        {/* droite */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {!user ? (
            <button
              onClick={() => router.push('/auth/login')}
              style={{
                background: '#0f62fe',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '6px 14px',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Connexion
            </button>
          ) : (
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button
                onClick={() => setOpen((o) => !o)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <AvatarSmall name={user.email} src={user.avatarUrl || null} />
                <span style={{ fontSize: 12 }}>{user.email}</span>
                <span style={{ fontSize: 10 }}>▼</span>
              </button>
              {open && (
                <div className="card" style={{ position:'absolute', right:0, top:'calc(100% + 8px)', width:240, display:'grid', gap:6, padding:8 }}>
                  <Link
                    href="/account"
                    onClick={(e)=>{ e.stopPropagation(); setOpen(false); }}
                    className="item"
                  >
                    Mon compte
                  </Link>

                  <Link
                    href="/"
                    onClick={(e)=>{ e.stopPropagation(); setOpen(false); }}
                    className="item"
                  >
                    Mes documents
                  </Link>

                  <Link
                    href="/appointments"
                    onClick={(e)=>{ e.stopPropagation(); setOpen(false); }}
                    className="item"
                  >
                    Mes rendez-vous
                  </Link>

                  <hr style={{margin:'6px 0'}}/>

                  <button
                    type="button"
                    onClick={(e)=>{ e.stopPropagation(); logout(); }}
                    className="item"
                    style={{ textAlign:'left', color:'#b91c1c' }}
                  >
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function AvatarSmall({ src, name }: { src: string | null; name: string }) {
  const initials = name?.charAt(0)?.toUpperCase() || 'U';
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{ width: 28, height: 28, borderRadius: '999px', objectFit: 'cover' }}
      />
    );
  }
  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: '999px',
        background: '#dfe3e8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 600,
        color: '#333',
      }}
    >
      {initials}
    </div>
  );
}

function DropdownItem({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        background: 'transparent',
        border: 'none',
        padding: '8px 12px',
        fontSize: 13,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}