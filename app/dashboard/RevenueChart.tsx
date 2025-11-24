// apps/web-pro/app/dashboard/RevenueChart.tsx
'use client';

import { useEffect, useState } from 'react';

type Point = { date: string; amount: number };

function getApiBase(): string | null {
  let b = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  b = b.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  if (!b) return null;
  try { new URL(b); return b; } catch { return null; }
}

export default function RevenueChart() {
  const [data, setData] = useState<Point[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const base = getApiBase();
    const url = base ? `${base}/stats/doctor/revenue-timeline?days=30` : '/stats/doctor/revenue-timeline?days=30';

    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(setData)
      .catch(e => setErr(String(e)));
  }, []);

  if (err) return <div className="card">Erreur: {err}</div>;
  if (!data.length) return <div className="card">Pas encore de revenus.</div>;

  return (
    <div className="card">
      <h3>Revenus (30 derniers jours)</h3>
      <ul style={{ fontSize: 12, marginTop: 8 }}>
        {data.map(p => (
          <li key={p.date}>
            {p.date} : {p.amount.toFixed(2)} €
          </li>
        ))}
      </ul>
      {/* Tu peux remplacer ce <ul> par un vrai chart (Recharts / Nivo) */}
    </div>
  );
}