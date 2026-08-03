'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../_providers/AuthProvider';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  Calendar,
  Users,
  DollarSign,
  AlertTriangle,
  Clock,
  BarChart2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

type Overview = {
  totalAppointments: number;
  upcomingAppointments: number;
  confirmedThisMonth: number;
  revenueThisMonth: number;
  noShowRate: number;
  last30Days: { date: string; count: number }[];
};

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n));
}

function BarChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const weeks = [];
  for (let i = 0; i < data.length; i += 7) weeks.push(data.slice(i, i + 7));

  return (
    <div className="flex items-end gap-px h-28 w-full">
      {data.map((d, i) => {
        const pct = (d.count / max) * 100;
        const date = new Date(d.date);
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div
              className={`w-full rounded-t transition-all duration-300 ${
                isWeekend ? 'bg-slate-600' : 'bg-teal-500 group-hover:bg-teal-400'
              }`}
              style={{ height: `${Math.max(pct, 2)}%` }}
            />
            {/* tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10 pointer-events-none">
              <div className="bg-slate-700 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg border border-slate-600">
                {date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}: {d.count}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RevenueChart({ data }: { data: { date: string; amount: number }[] }) {
  const max = Math.max(...data.map((d) => d.amount), 1);
  if (max === 0) {
    return (
      <div className="h-28 flex items-center justify-center text-slate-500 text-sm">
        Aucun revenu enregistré sur la période
      </div>
    );
  }

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - (d.amount / max) * 90;
    return `${x},${y}`;
  });
  const polyline = points.join(' ');

  const areaPoints = `0,100 ${polyline} 100,100`;

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-28">
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#grad)" />
      <polyline
        points={polyline}
        fill="none"
        stroke="#14b8a6"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color: string;
  trend?: 'up' | 'down' | null;
}) {
  return (
    <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700/60 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">{label}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-white">{value}</span>
        {trend && (
          <span className={`flex items-center text-xs mb-0.5 ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          </span>
        )}
      </div>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

export default function StatsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [revenue, setRevenue] = useState<{ date: string; amount: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'DOCTOR') {
      router.replace('/planning');
      return;
    }
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        const [ovRes, revRes] = await Promise.all([
          fetch(`${API_BASE}/stats/doctor/overview`, { headers }),
          fetch(`${API_BASE}/stats/doctor/revenue-timeline?days=30`, { headers }),
        ]);
        if (!ovRes.ok) throw new Error(`Erreur ${ovRes.status}`);
        const [ov, rev] = await Promise.all([ovRes.json(), revRes.json()]);
        setOverview(ov);
        setRevenue(Array.isArray(rev) ? rev : []);
      } catch (e: any) {
        setError(e.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const totalRevenue30 = useMemo(() => revenue.reduce((s, d) => s + d.amount, 0), [revenue]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Chargement des statistiques…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <p className="text-white font-medium mb-1">Impossible de charger les statistiques</p>
          <p className="text-slate-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!overview) return null;

  const noShowPct = Math.round(overview.noShowRate * 100);

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="pl-20">
        <div className="max-w-6xl mx-auto px-6 py-8">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-6 h-6 text-teal-400" />
              Statistiques
            </h1>
            <p className="text-slate-400 mt-1 text-sm">Tableau de bord de votre activité médicale</p>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <KpiCard
              label="Total rendez-vous"
              value={fmt(overview.totalAppointments)}
              sub="Depuis le début"
              icon={Calendar}
              color="bg-teal-500/10 text-teal-400"
            />
            <KpiCard
              label="À venir"
              value={String(overview.upcomingAppointments)}
              sub="Non annulés"
              icon={Clock}
              color="bg-blue-500/10 text-blue-400"
              trend="up"
            />
            <KpiCard
              label="Confirmés ce mois"
              value={String(overview.confirmedThisMonth)}
              sub={new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              icon={Users}
              color="bg-emerald-500/10 text-emerald-400"
            />
            <KpiCard
              label="Taux d'absences"
              value={`${noShowPct}%`}
              sub="Patients absents / total consulté"
              icon={AlertTriangle}
              color={noShowPct > 20 ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}
              trend={noShowPct > 20 ? 'down' : null}
            />
          </div>

          {/* Revenue banner */}
          <div className="grid lg:grid-cols-2 gap-4 mb-8">
            <div className="bg-gradient-to-br from-teal-600/20 to-emerald-600/10 border border-teal-500/20 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-teal-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-6 h-6 text-teal-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Revenus ce mois</p>
                <p className="text-3xl font-bold text-white">{fmtCurrency(overview.revenueThisMonth)} <span className="text-sm font-normal text-slate-400">FCFA</span></p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-violet-600/20 to-purple-600/10 border border-violet-500/20 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-violet-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Revenus 30 derniers jours</p>
                <p className="text-3xl font-bold text-white">{fmtCurrency(totalRevenue30)} <span className="text-sm font-normal text-slate-400">FCFA</span></p>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6">

            {/* Activity chart */}
            <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700/60">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-white font-semibold text-sm">Activité — 30 derniers jours</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Rendez-vous créés par jour</p>
                </div>
                <span className="px-2.5 py-1 bg-teal-500/10 text-teal-400 text-xs rounded-lg">
                  Total : {overview.last30Days.reduce((s, d) => s + d.count, 0)}
                </span>
              </div>
              {overview.last30Days.length > 0 ? (
                <>
                  <BarChart data={overview.last30Days} />
                  <div className="flex justify-between mt-2 text-xs text-slate-600">
                    <span>
                      {new Date(overview.last30Days[0].date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </span>
                    <span>
                      {new Date(overview.last30Days[overview.last30Days.length - 1].date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </>
              ) : (
                <div className="h-28 flex items-center justify-center text-slate-500 text-sm">
                  Aucune donnée disponible
                </div>
              )}
            </div>

            {/* Revenue timeline */}
            <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700/60">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-white font-semibold text-sm">Revenus — 30 derniers jours</h3>
                  <p className="text-xs text-slate-500 mt-0.5">FCFA encaissés par jour</p>
                </div>
                <span className="px-2.5 py-1 bg-violet-500/10 text-violet-400 text-xs rounded-lg">
                  {fmtCurrency(totalRevenue30)} FCFA
                </span>
              </div>
              <RevenueChart data={revenue} />
              {revenue.length > 0 && (
                <div className="flex justify-between mt-2 text-xs text-slate-600">
                  <span>
                    {new Date(revenue[0].date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </span>
                  <span>
                    {new Date(revenue[revenue.length - 1].date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              )}
            </div>

            {/* No-show breakdown */}
            <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700/60">
              <h3 className="text-white font-semibold text-sm mb-4">Taux d'absence (no-show)</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Patients présents</span>
                  <span className="text-white font-medium">{100 - noShowPct}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2.5">
                  <div
                    className="bg-emerald-500 h-2.5 rounded-full transition-all duration-700"
                    style={{ width: `${100 - noShowPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Patients absents</span>
                  <span className={`font-medium ${noShowPct > 20 ? 'text-rose-400' : 'text-amber-400'}`}>{noShowPct}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-700 ${noShowPct > 20 ? 'bg-rose-500' : 'bg-amber-500'}`}
                    style={{ width: `${noShowPct}%` }}
                  />
                </div>
              </div>
              {noShowPct > 20 && (
                <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400">
                  Taux d'absence élevé — envisagez des rappels SMS/email automatiques avant les rendez-vous.
                </div>
              )}
            </div>

            {/* Summary table */}
            <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700/60">
              <h3 className="text-white font-semibold text-sm mb-4">Récapitulatif</h3>
              <div className="divide-y divide-slate-700/50">
                {[
                  { label: 'Total RDV (historique)', value: fmt(overview.totalAppointments) },
                  { label: 'RDV à venir', value: String(overview.upcomingAppointments) },
                  { label: 'Confirmés ce mois', value: String(overview.confirmedThisMonth) },
                  { label: 'Taux no-show', value: `${noShowPct}%` },
                  { label: 'Revenus ce mois', value: `${fmtCurrency(overview.revenueThisMonth)} FCFA` },
                  { label: 'Revenus 30j', value: `${fmtCurrency(totalRevenue30)} FCFA` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between py-2.5 text-sm">
                    <span className="text-slate-400">{label}</span>
                    <span className="text-white font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
