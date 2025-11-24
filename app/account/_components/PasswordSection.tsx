'use client';
import { useState } from 'react';

export default function PasswordSection({
  onSave,
}: { onSave: (data:{ currentPassword:string; newPassword:string })=>Promise<void> }) {
  const [currentPassword, setC] = useState('');
  const [newPassword, setN] = useState('');

  return (
    <div className="card" style={{display:'grid',gap:12}}>
      <h3>Sécurité</h3>
      <div className="grid" style={{gridTemplateColumns:'1fr 1fr', gap:12}}>
        <div>
          <label className="small">Mot de passe actuel</label>
          <input className="input" type="password" value={currentPassword} onChange={e=>setC(e.target.value)}/>
        </div>
        <div>
          <label className="small">Nouveau mot de passe</label>
          <input className="input" type="password" value={newPassword} onChange={e=>setN(e.target.value)}/>
        </div>
      </div>
      <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
        <button className="btn" onClick={() => onSave({ currentPassword, newPassword })} disabled={!currentPassword || !newPassword}>
          Mettre à jour
        </button>
      </div>
    </div>
  );
}