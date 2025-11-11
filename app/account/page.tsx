'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../_providers/AuthProvider';

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

export default function AccountPage() {
  const { token, updateUser } = useAuth();
  const router = useRouter();
  const apiBase = useMemo(() => getApiBase(), []);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  // champs du profil
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [sex, setSex] = useState<'MALE' | 'FEMALE' | 'OTHER' | ''>('');
  const [birthdate, setBirthdate] = useState(''); // yyyy-mm-dd
  const [city, setCity] = useState('');

  // champs mot de passe
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  function buildUrl(path: string) {
    return apiBase ? `${apiBase}${path}` : `/api-proxy${path}`;
  }

  async function authedFetch(path: string, init?: RequestInit) {
    if (!token) throw new Error('Non authentifié');
    const headers: Record<string, string> = { ...(init?.headers as any) };
    headers['Authorization'] = `Bearer ${token}`;
    if (init?.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
    const r = await fetch(buildUrl(path), { ...init, headers, cache: 'no-store' });
    if (!r.ok) {
      const t = await r.text().catch(() => '');
      throw new Error(`HTTP ${r.status}${t ? ` — ${t}` : ''}`);
    }
    return r;
  }

  // charger le profil au montage
  useEffect(() => {
    if (!token) {
      router.replace('/auth/login');
      return;
    }
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const r = await authedFetch('/me', { method: 'GET' });
        const data = await r.json();
        setEmail(data.email ?? '');
        setFullName(data.fullName ?? '');
        setAvatarUrl(data.avatarUrl ?? '');
        setPhone(data.phone ?? '');
        setSex(data.sex ?? '');
        setCity(data.city ?? '');
        // si c'est du ISO on peut faire split
        if (data.birthdate) {
          setBirthdate(String(data.birthdate).substring(0, 10));
        }
      } catch (e: any) {
        setErr(e.message || 'Impossible de charger le compte');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);
    try {
      const r = await authedFetch('/me', {
        method: 'PUT',
        body: JSON.stringify({
          email,
          fullName,
          avatarUrl: avatarUrl || null,
          phone,
          sex: sex || null,
          birthdate: birthdate ? new Date(birthdate).toISOString() : null,
          city,
        }),
      });
      const updated = await r.json();
      // met à jour le contexte → navbar
      updateUser({
        email: updated.email,
        fullName: updated.fullName,
        avatarUrl: updated.avatarUrl,
      });
      setOk('Profil mis à jour ✅');
    } catch (e: any) {
      setErr(e.message || 'Mise à jour impossible');
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);
    if (!newPwd || newPwd.length < 6) {
      setErr('Le nouveau mot de passe doit faire au moins 6 caractères.');
      return;
    }
    if (newPwd !== confirmPwd) {
      setErr('Les deux mots de passe ne correspondent pas.');
      return;
    }
    try {
      const r = await authedFetch('/me/password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: currentPwd,
          newPassword: newPwd,
        }),
      });
      await r.json();
      setOk('Mot de passe mis à jour ✅');
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } catch (e: any) {
      setErr(e.message || 'Impossible de changer le mot de passe');
    }
  }

  if (loading) {
    return <div style={{ padding: 24 }}>Chargement…</div>;
  }

  return (
    <div style={{ maxWidth: 650, margin: '24px auto', display: 'grid', gap: 20 }}>
      <h1>Mon compte</h1>
      {err && <div className="banner error">{err}</div>}
      {ok && <div className="banner success">{ok}</div>}

      {/* Formulaire profil */}
      <form
        onSubmit={handleProfileSubmit}
        style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 16, display: 'grid', gap: 14 }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 600 }}>Informations personnelles</h2>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <AvatarLarge src={avatarUrl} name={fullName || email} />
          <div>
            <label className="small">URL de la photo</label>
            <input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://..." />
            <div style={{ fontSize: 11, color: '#777' }}>Upload viendra plus tard</div>
          </div>
        </div>

        <div>
          <label className="small">Nom complet</label>
          <input value={fullName} onChange={e => setFullName(e.target.value)} />
        </div>

        <div>
          <label className="small">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
        </div>

        <div>
          <label className="small">Téléphone</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+33..." />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label className="small">Sexe</label>
            <select value={sex} onChange={e => setSex(e.target.value as any)}>
              <option value="">—</option>
              <option value="MALE">Homme</option>
              <option value="FEMALE">Femme</option>
              <option value="OTHER">Autre</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label className="small">Date de naissance</label>
            <input type="date" value={birthdate} onChange={e => setBirthdate(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="small">Ville</label>
          <input value={city} onChange={e => setCity(e.target.value)} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="submit" className="btn primary">
            Enregistrer
          </button>
        </div>
      </form>

      {/* Formulaire mot de passe */}
      <form
        onSubmit={handlePasswordSubmit}
        style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 16, display: 'grid', gap: 12 }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 600 }}>Mot de passe</h2>
        <div>
          <label className="small">Mot de passe actuel</label>
          <input type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} />
        </div>
        <div>
          <label className="small">Nouveau mot de passe</label>
          <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} />
        </div>
        <div>
          <label className="small">Confirmer le mot de passe</label>
          <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn">
            Mettre à jour le mot de passe
          </button>
        </div>
      </form>
    </div>
  );
}

function AvatarLarge({ src, name }: { src?: string | null; name: string }) {
  const initials = name
    .split(' ')
    .map(p => p.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{ width: 58, height: 58, borderRadius: '999px', objectFit: 'cover' }}
      />
    );
  }
  return (
    <div
      style={{
        width: 58,
        height: 58,
        borderRadius: '999px',
        background: '#dfe3e8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 16,
        fontWeight: 600,
        color: '#333',
      }}
    >
      {initials || 'U'}
    </div>
  );
}