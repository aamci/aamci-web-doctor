// apps/web-pro/app/admin/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Overview = {
  totals: {
    users: number;
    doctors: number;
    patients: number;
    appointments: number;
  };
  activity: {
    appointmentsLast24h: number;
  };
  revenue: {
    monthlyRevenue: number;
  };
};

type DoctorStats = {
  doctorId: string;
  email: string;
  totalAppointments: number;
  confirmed: number;
  cancelled: number;
  revenueMonth: number;
};

function getApiBase(): string | null {
  let b = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  b = b.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  if (!b) return null;
  try {
    new URL(b);
    return b;
  } catch {
    return null;
  }
}

async function apiFetch(path: string, token: string) {
  const base = getApiBase();
  const url = base ? `${base}${path}` : path;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}${t ? ` — ${t}` : ''}`);
  }
  return res.json();
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [doctors, setDoctors] = useState<DoctorStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined'
      ? localStorage.getItem('token')
      : null;
    if (!token) {
      router.replace('/auth/login');
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const [ov, docs] = await Promise.all([
          apiFetch('/stats/admin/overview', token),
          apiFetch('/stats/admin/doctors', token),
        ]);
        setOverview(ov);
        setDoctors(Array.isArray(docs) ? docs : []);
      } catch (e: any) {
        if (String(e?.message || '').includes('403')) {
          setErr('Accès refusé — réservé aux administrateurs.');
        } else {
          setErr(e?.message || 'Erreur de chargement');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="rounded-2xl border bg-white p-4 text-sm text-slate-600 shadow-sm">
          Chargement du tableau de bord…
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-sm">
          {err}
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="rounded-2xl border bg-white p-4 text-sm text-slate-600 shadow-sm">
          Aucune donnée de statistiques disponible.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Tableau de bord administrateur
          </h1>
          <p className="text-sm text-slate-500">
            Vue globale de l&apos;activité de la plateforme et des revenus.
          </p>
        </div>
      </div>

      {/* Cards overview */}
      <section className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Utilisateurs"
          value={overview.totals.users}
          subtitle="Total comptes créés"
        />
        <StatCard
          title="Médecins"
          value={overview.totals.doctors}
          subtitle="Profils pro"
        />
        <StatCard
          title="Patients"
          value={overview.totals.patients}
          subtitle="Profils patients"
        />
        <StatCard
          title="Rendez-vous"
          value={overview.totals.appointments}
          subtitle="Tous statuts confondus"
        />
      </section>

      {/* Activité & revenu */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">
            Activité récente
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Suivi des nouveaux rendez-vous.
          </p>
          <div className="mt-4 flex items-end gap-4">
            <div>
              <div className="text-2xl font-semibold text-slate-900">
                {overview.activity.appointmentsLast24h}
              </div>
              <div className="text-xs text-slate-500">
                RDV créés sur les 24 dernières heures
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">
            Revenus de la plateforme
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Basé sur les paiements & transactions marqués comme SUCCESS.
          </p>
          <div className="mt-4">
            <div className="text-2xl font-semibold text-emerald-700">
              {overview.revenue.monthlyRevenue.toFixed(2)} FCFA
            </div>
            <div className="text-xs text-slate-500">
              Revenus du mois en cours
            </div>
          </div>
        </div>
      </section>

      {/* Tableau médecins */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            Performance des médecins
          </h2>
          <p className="text-xs text-slate-500">
            Vue consolidée des rendez-vous et revenus par médecin.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-4 py-3">Médecin</th>
                <th className="px-4 py-3">RDV totaux</th>
                <th className="px-4 py-3">Confirmés</th>
                <th className="px-4 py-3">Annulés</th>
                <th className="px-4 py-3">Taux de confirmation</th>
                <th className="px-4 py-3">Revenu (mois)</th>
              </tr>
            </thead>
            <tbody>
              {doctors.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-4 text-center text-xs text-slate-500"
                  >
                    Aucun médecin trouvé.
                  </td>
                </tr>
              )}

              {doctors.map((d) => {
                const rate =
                  d.totalAppointments === 0
                    ? 0
                    : (d.confirmed / d.totalAppointments) * 100;
                return (
                  <tr
                    key={d.doctorId}
                    className="border-t last:border-b hover:bg-slate-50/60"
                  >
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900">
                          {d.email}
                        </span>
                        <span className="text-xs text-slate-500">
                          {d.doctorId.slice(0, 10)}…
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-900">
                        {d.totalAppointments}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-emerald-700">
                        {d.confirmed}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-rose-600">
                        {d.cancelled}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-700">
                        {Math.round(rate)} %
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-slate-900">
                        {d.revenueMonth.toFixed(2)} FCFA
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard(props: {
  title: string;
  value: number | string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="text-xs font-medium text-slate-500">
        {props.title}
      </div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">
        {props.value}
      </div>
      {props.subtitle && (
        <div className="mt-1 text-xs text-slate-500">
          {props.subtitle}
        </div>
      )}
    </div>
  );
}