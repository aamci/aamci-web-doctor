'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

function getApiBase(): string | null {
  let base = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  console.log('API BASE ENV:',base);
  base = base.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  try { return base ? new URL(base).toString().replace(/\/$/,'') : null; } catch { return null; }
}
async function callApi(path: string, init?: RequestInit) {
  const base = getApiBase();
   console.log('API BASE:',base);
  const url = base ? `${base}${path}` : path;
  return fetch(url, init);
}

const demoSlots = (ownerId: string) => {
  const now = Date.now();
  return [
    { id:`${ownerId}-s1`, start: new Date(now + 2*3600e3).toISOString(), label: 'Aujourd’hui 14:00' },
    { id:`${ownerId}-s2`, start: new Date(now + 3*3600e3).toISOString(), label: 'Aujourd’hui 15:00' },
    { id:`${ownerId}-s3`, start: new Date(now + 26*3600e3).toISOString(), label: 'Demain 10:00' },
  ];
};

export default function DoctorClient({ id }: { id: string }) {
  const router = useRouter();
  const [doctor, setDoctor] = useState<any>(null);
  const [slots, setSlots] = useState<{id:string; start:string; label:string}[]>([]);
  const [err, setErr] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const base = getApiBase();
        const url = base ? `${base}/search/doctors` : `/search/doctors`;
        const r = await fetch(url); const list = await r.json().catch(()=>[]);
        const found = Array.isArray(list) ? list.find((d: any) => d.id === id) : null;
        setDoctor(found || { id, name:'Dr. Démo', specialty:'Médecine générale', city:'Paris', hospital:'Centre' });
        setSlots(demoSlots(id));
      } catch {
        setDoctor({ id, name:'Dr. Démo', specialty:'Médecine générale', city:'Paris', hospital:'Centre' });
        setSlots(demoSlots(id));
      }
    })();
  }, [id]);

  async function book(slotId: string) {
    setErr(null); setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) { setErr('Veuillez vous connecter.'); router.push('/auth/login'); return; }
      const r = await callApi('/appointments', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ slotId, notes: `RDV avec ${doctor?.name}` })
      });
      if (!r.ok) { setErr(`Erreur ${r.status}`); return; }
      const data = await r.json();
      router.push(`/doctors/${id}/success?aid=${data.id||''}`);
    } catch (e:any) {
      setErr(e?.message||'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }

  if (!doctor) return <div style={{ padding:'24px 0' }}>Chargement…</div>;

  return (
    <div style={{ display:'grid', gap:16, padding:'24px 0' }}>
      <a className="link" href="/doctors">← Retour à la liste</a>
      <div className="card">
        <h1 style={{ margin:'4px 0 6px' }}>{doctor.name}</h1>
        <div className="small" style={{ color:'var(--muted)' }}>
          {doctor.specialty} • {doctor.city} • {doctor.hospital}
        </div>
        <p style={{ marginTop:12 }}>
          Consultation en présentiel. Apportez votre pièce d’identité et carte vitale.
        </p>
      </div>
      <div id="slots" className="card">
        <h3>Créneaux disponibles</h3>
        <div className="row" style={{ flexWrap:'wrap', gap:8, marginTop:8 }}>
          {slots.map(s => (
            <button key={s.id} className="btn outline" disabled={loading} onClick={()=>book(s.id)}>
              {s.label}
            </button>
          ))}
        </div>
        {err && <div className="banner error" style={{ marginTop:12 }}>{err}</div>}
      </div>
    </div>
  );
}
