'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
function getApiBase(): string | null { let b=process.env.NEXT_PUBLIC_API_BASE_URL??''; b=b.trim().replace(/^['"]|['"]$/g,'').replace(/\/+$/,''); if(!b) return null; try{ new URL(b); return b;}catch{return null;} }
async function callApi(p:string,i?:RequestInit){ const b=getApiBase(); const u=b?`${b}${p}`:p; return fetch(u,i); }
export default function Login(){
  const router=useRouter();
  const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [showPwd,setShowPwd]=useState(false);
  const [remember,setRemember]=useState(true); const [token,setToken]=useState<string|null>(null); const [err,setErr]=useState<string|null>(null); const [loading,setLoading]=useState(false);
  useEffect(()=>{ const s=localStorage.getItem('login_email'); if(s) setEmail(s); },[]);
  const emailInvalid=useMemo(()=>!email?false:!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),[email]);
  async function handle(action:'login'|'register'){ setErr(null); setLoading(true);
    try{
      if(!email||!password){ setErr('Veuillez renseigner votre email et mot de passe.'); return; }
      if(emailInvalid){ setErr('Adresse e-mail invalide.'); return; }
      const body= action==='register'? {email,password,role:'PATIENT'} : {email,password};
      const r=await callApi(action==='register'?'/auth/register':'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      if(!r.ok){ setErr(r.status===401?'Identifiants incorrects.':`Erreur ${r.status}.`); return; }
      const d=await r.json(); if(d?.access_token){ setToken(d.access_token); localStorage.setItem('token',d.access_token); remember?localStorage.setItem('login_email',email):localStorage.removeItem('login_email'); router.replace('/'); } else setErr('Réponse inattendue du serveur.');
    }catch(e:any){ setErr(e?.message||'Erreur réseau'); } finally{ setLoading(false); }
  }
  return (<div className="auth-wrap"><section className="auth-card">
    <header className="auth-head"><div className="auth-logo">🩺</div><div><h1 className="auth-title">Connexion </h1><p className="auth-sub">Accédez à votre espace patient</p></div></header>
    <div className="form">
      <div><label htmlFor="email" className="small" style={{fontWeight:700,color:'#111827'}}>Email</label><input id="email" className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} aria-invalid={emailInvalid} placeholder="vous@exemple.com"/></div>
      <div><label htmlFor="pwd" className="small" style={{fontWeight:700,color:'#111827'}}>Mot de passe</label><div className="pwd-row"><input id="pwd" className="input" type={showPwd?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/><button type="button" className="btn outline" onClick={()=>setShowPwd(s=>!s)}>{showPwd?'Masquer':'Afficher'}</button></div></div>
      <div className="row" style={{justifyContent:'space-between'}}><label className="row" style={{gap:8}}><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)}/><span className="small">Se souvenir de moi</span></label><a className="link small" href="#">Mot de passe oublié ?</a></div>
      {err&&<div className="banner error">{err}</div>}{token&&<div className="banner success">Connecté ✔</div>}
      <div className="row" style={{flexWrap:'wrap'}}><button className="btn primary" disabled={loading} onClick={()=>handle('login')}>{loading?'Connexion…':'Se connecter'}</button><button className="btn ghost" disabled={loading} onClick={()=>handle('register')}>Créer un compte</button></div>
      <div className="row" style={{justifyContent:'center',color:'var(--muted)'}}>— ou —</div>
      <div className="row" style={{flexWrap:'wrap'}}><button className="btn outline" disabled>Continuer avec Google (bientôt)</button><button className="btn outline" disabled>Continuer avec Apple (bientôt)</button></div>
      <p className="small">En vous connectant, vous acceptez nos <a className="link" href="#">Conditions</a> et notre <a className="link" href="#">Politique de confidentialité</a>.</p>
      <a className="btn secondary" href="/protected">Aller à la page protégée</a>
    </div>
  </section></div>);
}
