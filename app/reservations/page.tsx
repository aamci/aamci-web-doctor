'use client';

import { useEffect, useState } from 'react';

export default function ReservationsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [err, setErr] = useState<string|null>(null);
  const [loading, setLoading] = useState(true);
  const api = process.env.NEXT_PUBLIC_API_BASE_URL || '';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${api}/appointments`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(setAppointments)
      .catch(e => setErr(String(e)))
      .finally(() => setLoading(false));
  }, [api]);

  if (loading) return <div className="card">Chargement…</div>;
  if (err) return <div className="card error">Erreur : {err}</div>;

  return (
    <div style={{ padding: 24 }}>
      <h1>Mes Réservations</h1>
      {appointments.length === 0 && <p>Aucun rendez-vous pour l'instant.</p>}
      {appointments.map(a => (
        <div key={a.id} className="card">
          <strong>{a.patient?.email || 'Patient'}</strong><br/>
          {new Date(a.slot?.start).toLocaleString()} – {new Date(a.slot?.end).toLocaleTimeString()}<br/>
          Statut : {a.status}
        </div>
      ))}
    </div>
  );
}