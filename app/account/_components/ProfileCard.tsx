import React from 'react';

export default function ProfileCard({
  fullName, email, city, avatarUrl, children,
}: { fullName: string; email: string; city?: string; avatarUrl?: string|null; children?: React.ReactNode }) {
  return (
    <div className="card" style={{display:'flex', alignItems:'center', gap:16}}>
      {avatarUrl ? (
        <img src={avatarUrl} alt={fullName} style={{width:64,height:64,borderRadius:'999px',objectFit:'cover'}}/>
      ) : (
        <div style={{width:64,height:64,borderRadius:'999px',background:'#dbeafe',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700}}>
          {fullName?.[0]?.toUpperCase() ?? 'D'}
        </div>
      )}
      <div style={{flex:1}}>
        <div style={{fontWeight:700}}>{fullName}</div>
        <div className="small" style={{color:'var(--muted)'}}>{email}{city ? ` • ${city}` : ''}</div>
        <div style={{marginTop:10}}>{children}</div>
      </div>
    </div>
  );
}