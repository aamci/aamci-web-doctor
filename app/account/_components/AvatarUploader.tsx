'use client';
import { useRef, useState } from 'react';
import { api } from '../_lib/api';

export default function AvatarUploader({
  avatarUrl, onUploaded,
}: { avatarUrl: string|null; onUploaded: (url: string)=>Promise<void>|void }) {
  const inputRef = useRef<HTMLInputElement|null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string| null>(null);

  async function pick() { inputRef.current?.click(); }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if(!f) return;
    setPreview(URL.createObjectURL(f));
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', f);
      // à adapter: endpoint d’upload (S3/MinIO) — renvoyer { url }
      const res = await api.upload('/upload/avatar', fd);
      await onUploaded(res.url);
    } finally { setBusy(false); }
  }

  return (
    <div className="card" style={{display:'flex', alignItems:'center', gap:12}}>
      <img
        src={preview || avatarUrl || '/avatar-default.png'}
        alt="Avatar"
        style={{width:72,height:72,borderRadius:'999px',objectFit:'cover',border:'2px solid #eee'}}
      />
      <div style={{flex:1}}>
        <div style={{fontWeight:600}}>Photo de profil</div>
        <div className="small" style={{color:'var(--muted)'}}>PNG/JPG, carré de préférence.</div>
      </div>
      <input ref={inputRef} type="file" hidden accept="image/*" onChange={onFile}/>
      <button className="btn" onClick={pick} disabled={busy}>{busy?'Envoi…':'Changer'}</button>
    </div>
  );
}