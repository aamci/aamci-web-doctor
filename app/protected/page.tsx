'use client';
import { useEffect, useState } from 'react';
export default function Protected(){
  const [me,setMe] = useState<any>(null);
  const api = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
  useEffect(()=>{ const t = localStorage.getItem('token'); if(!t){ setMe({error:'missing token'}); return; }
    fetch(`${api}/me`, { headers:{ Authorization:`Bearer ${t}` }})
      .then(r=>r.json()).then(setMe).catch(()=>setMe({error:'unauthorized'})); },[]);
  return (<div className='card'>
    <h3>Page protégée</h3>
    {!me && 'Chargement…'}
    {me && me.error && <div>Erreur: {me.error}</div>}
    {me && !me.error && <div>Email: {me.email} — Rôle: {me.role}</div>}
  </div>);
}
