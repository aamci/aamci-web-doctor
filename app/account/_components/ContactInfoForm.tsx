'use client';
import { useMemo, useState } from 'react';

type PartialProfile = { address?: string|null; city?: string|null };

export default function ContactInfoForm({
  user,
  profile,
  onSave,
}: {
  user?: { phone?: string|null } | null;
  profile?: PartialProfile | null; // 🔸 optionnel
  onSave: (data: { phone?: string; address?: string; city?: string }) => Promise<void>;
}) {
  // 🔒 p est toujours un objet
  const p = useMemo<PartialProfile>(() => profile ?? {}, [profile]);

  // 🔒 valeurs contrôlées avec défauts
  const [phone, setPhone] = useState<string>(user?.phone ?? '');
  const [address, setAddress] = useState<string>(p.address ?? '');
  const [city, setCity] = useState<string>(p.city ?? '');

  return (
    <div className="card" style={{ display:'grid', gap:12 }}>
      <h3>Contact</h3>
      <div className="grid" style={{ gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div>
          <label className="small">Téléphone</label>
          <input className="input" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+33…" />
        </div>
        <div>
          <label className="small">Ville</label>
          <input className="input" value={city} onChange={e=>setCity(e.target.value)} placeholder="Paris" />
        </div>
        <div style={{ gridColumn:'1/-1' }}>
          <label className="small">Adresse</label>
          <input className="input" value={address} onChange={e=>setAddress(e.target.value)} placeholder="12 rue Exemple" />
        </div>
      </div>
      <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
        <button className="btn" onClick={() => onSave({ phone, address, city })}>
          Enregistrer
        </button>
      </div>
    </div>
  );
}