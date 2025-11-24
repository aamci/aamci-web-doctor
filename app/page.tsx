// apps/web-pro/app/page.tsx (exemple)

'use client';

import { useEffect, useState } from 'react';

type Overview = {
  totalAppointments: number;
  upcomingAppointments: number;
  confirmedThisMonth: number;
  revenueThisMonth: number;
  noShowRate: number;
  last30Days: { date: string; count: number }[];
};

function getApiBase(): string | null {
  let b = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  b = b.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  if (!b) return null;
  try { new URL(b); return b; } catch { return null; }
}

export default function Home() {
  const [data, setData] = useState<Overview | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const base = getApiBase();
    const url = base ? `${base}/stats/doctor/overview` : '/stats/doctor/overview';

    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(setData)
      .catch(e => setErr(String(e)));
  }, []);

  if (err) return <div>Erreur : {err}</div>;
  if (!data) return <div>Chargement…</div>;

  return (
    <div style={{ padding: 24 }}>
      <h1>Tableau de bord</h1>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:12, marginTop:16 }}>
        <div className="card">
          <div>Total RDV</div>
          <strong>{data.totalAppointments}</strong>
        </div>
        <div className="card">
          <div>À venir</div>
          <strong>{data.upcomingAppointments}</strong>
        </div>
        <div className="card">
          <div>Confirmés ce mois-ci</div>
          <strong>{data.confirmedThisMonth}</strong>
        </div>
        <div className="card">
          <div>Revenu ce mois-ci</div>
          <strong>{data.revenueThisMonth.toFixed(2)} €</strong>
        </div>
        <div className="card">
          <div>No-show</div>
          <strong>{Math.round(data.noShowRate * 100)}%</strong>
        </div>
      </div>
      {/* tu peux ensuite brancher un vrai graph sur data.last30Days */}
    </div>
  );
}