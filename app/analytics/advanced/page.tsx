'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Clock,
  ChevronDown,
  RefreshCw,
  Calendar,
  Wallet,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Percent,
  Repeat,
  UserMinus,
  CalendarX,
  Loader2,
  Download,
  Info,
  ArrowUpRight,
  Sparkles,
  PieChart,
  LineChart,
} from 'lucide-react';

interface AdvancedMetrics {
  // Rétention
  retentionRate: number;
  churnRate: number;
  avgVisitsPerPatient: number;
  returningPatients: number;
  newVsReturning: { new: number; returning: number };

  // No-shows et annulations
  noShowRate: number;
  cancellationRate: number;
  lastMinuteCancellations: number;
  noShowTrend: number[];

  // Objectifs
  revenueGoal: number;
  revenueActual: number;
  appointmentsGoal: number;
  appointmentsActual: number;
  newPatientsGoal: number;
  newPatientsActual: number;

  // Comparaisons
  currentPeriodRevenue: number;
  previousPeriodRevenue: number;
  currentPeriodAppointments: number;
  previousPeriodAppointments: number;

  // Prévisions
  projectedMonthlyRevenue: number;
  projectedMonthlyAppointments: number;

  // Performance par jour
  performanceByDay: { day: string; appointments: number; revenue: number; noShows: number }[];

  // Top services
  topServices: { name: string; count: number; revenue: number; growth: number }[];

  // Tendances mensuelles
  monthlyTrends: { month: string; revenue: number; appointments: number; patients: number }[];
}

type ComparisonPeriod = 'previous' | 'lastYear';

export default function AdvancedAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<AdvancedMetrics | null>(null);
  const [comparisonPeriod, setComparisonPeriod] = useState<ComparisonPeriod>('previous');
  const [showGoalEditor, setShowGoalEditor] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/auth/login');
      return;
    }
    loadMetrics();
  }, [router]);

  const loadMetrics = async () => {
    setLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));

    setMetrics({
      // Rétention
      retentionRate: 78.5,
      churnRate: 21.5,
      avgVisitsPerPatient: 2.4,
      returningPatients: 89,
      newVsReturning: { new: 34, returning: 89 },

      // No-shows
      noShowRate: 8.2,
      cancellationRate: 12.4,
      lastMinuteCancellations: 5,
      noShowTrend: [12, 10, 8, 11, 7, 9, 6],

      // Objectifs
      revenueGoal: 5000,
      revenueActual: 3850,
      appointmentsGoal: 60,
      appointmentsActual: 48,
      newPatientsGoal: 15,
      newPatientsActual: 12,

      // Comparaisons
      currentPeriodRevenue: 3850,
      previousPeriodRevenue: 3420,
      currentPeriodAppointments: 48,
      previousPeriodAppointments: 42,

      // Prévisions
      projectedMonthlyRevenue: 4800,
      projectedMonthlyAppointments: 58,

      // Performance par jour
      performanceByDay: [
        { day: 'Lundi', appointments: 12, revenue: 720, noShows: 1 },
        { day: 'Mardi', appointments: 14, revenue: 840, noShows: 2 },
        { day: 'Mercredi', appointments: 10, revenue: 600, noShows: 0 },
        { day: 'Jeudi', appointments: 15, revenue: 900, noShows: 1 },
        { day: 'Vendredi', appointments: 11, revenue: 660, noShows: 1 },
        { day: 'Samedi', appointments: 4, revenue: 240, noShows: 0 },
      ],

      // Top services
      topServices: [
        { name: 'Consultation générale', count: 45, revenue: 2250, growth: 12 },
        { name: 'Suivi', count: 28, revenue: 1120, growth: 8 },
        { name: 'Urgence', count: 15, revenue: 1050, growth: -5 },
        { name: 'Téléconsultation', count: 18, revenue: 720, growth: 25 },
      ],

      // Tendances mensuelles
      monthlyTrends: [
        { month: 'Sept', revenue: 3200, appointments: 40, patients: 28 },
        { month: 'Oct', revenue: 3450, appointments: 43, patients: 32 },
        { month: 'Nov', revenue: 3100, appointments: 38, patients: 25 },
        { month: 'Déc', revenue: 2800, appointments: 35, patients: 22 },
        { month: 'Jan', revenue: 3420, appointments: 42, patients: 30 },
        { month: 'Fév', revenue: 3850, appointments: 48, patients: 34 },
      ],
    });

    setLoading(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getProgressColor = (actual: number, goal: number) => {
    const progress = (actual / goal) * 100;
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-teal-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading || !metrics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
          <p className="mt-3 text-gray-600">Chargement des analyses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/analytics')}
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Analyses avancées</h1>
                <p className="text-sm text-gray-500">Métriques détaillées et prévisions</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadMetrics}
              className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-colors border border-gray-200"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
              <Download className="w-4 h-4" />
              Exporter rapport
            </button>
          </div>
        </div>

        {/* Goals Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-teal-600" />
              <h2 className="text-lg font-semibold text-gray-900">Objectifs du mois</h2>
            </div>
            <button
              onClick={() => setShowGoalEditor(!showGoalEditor)}
              className="text-sm text-teal-600 hover:text-teal-700 font-medium"
            >
              Modifier les objectifs
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Revenue Goal */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Revenus</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(metrics.revenueActual)} / {formatCurrency(metrics.revenueGoal)}
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getProgressColor(metrics.revenueActual, metrics.revenueGoal)}`}
                  style={{ width: `${Math.min((metrics.revenueActual / metrics.revenueGoal) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {((metrics.revenueActual / metrics.revenueGoal) * 100).toFixed(0)}% atteint
              </p>
            </div>

            {/* Appointments Goal */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Rendez-vous</span>
                <span className="text-sm font-medium text-gray-900">
                  {metrics.appointmentsActual} / {metrics.appointmentsGoal}
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getProgressColor(metrics.appointmentsActual, metrics.appointmentsGoal)}`}
                  style={{ width: `${Math.min((metrics.appointmentsActual / metrics.appointmentsGoal) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {((metrics.appointmentsActual / metrics.appointmentsGoal) * 100).toFixed(0)}% atteint
              </p>
            </div>

            {/* New Patients Goal */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Nouveaux patients</span>
                <span className="text-sm font-medium text-gray-900">
                  {metrics.newPatientsActual} / {metrics.newPatientsGoal}
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getProgressColor(metrics.newPatientsActual, metrics.newPatientsGoal)}`}
                  style={{ width: `${Math.min((metrics.newPatientsActual / metrics.newPatientsGoal) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {((metrics.newPatientsActual / metrics.newPatientsGoal) * 100).toFixed(0)}% atteint
              </p>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Retention Rate */}
          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Repeat className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded-full font-medium">
                +2.3%
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatPercent(metrics.retentionRate)}</p>
            <p className="text-sm text-gray-500 mt-1">Taux de rétention</p>
            <p className="text-xs text-gray-400 mt-2">
              {metrics.returningPatients} patients fidèles
            </p>
          </div>

          {/* Churn Rate */}
          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <UserMinus className="w-6 h-6 text-red-600" />
              </div>
              <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-full font-medium">
                -1.2%
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatPercent(metrics.churnRate)}</p>
            <p className="text-sm text-gray-500 mt-1">Taux d'attrition</p>
            <p className="text-xs text-gray-400 mt-2">
              Patients non revenus depuis 6 mois
            </p>
          </div>

          {/* No-show Rate */}
          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <CalendarX className="w-6 h-6 text-amber-600" />
              </div>
              <span className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded-full font-medium">
                -0.8%
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatPercent(metrics.noShowRate)}</p>
            <p className="text-sm text-gray-500 mt-1">Taux de no-show</p>
            <p className="text-xs text-gray-400 mt-2">
              {metrics.lastMinuteCancellations} annulations dernière minute
            </p>
          </div>

          {/* Avg Visits */}
          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{metrics.avgVisitsPerPatient}</p>
            <p className="text-sm text-gray-500 mt-1">Visites / patient</p>
            <p className="text-xs text-gray-400 mt-2">
              Moyenne annuelle
            </p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* New vs Returning */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Nouveaux vs Récurrents</h3>
            <div className="flex items-center gap-8">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="16"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="#14b8a6"
                    strokeWidth="16"
                    strokeDasharray={`${(metrics.newVsReturning.returning / (metrics.newVsReturning.new + metrics.newVsReturning.returning)) * 351.86} 351.86`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">
                    {Math.round((metrics.newVsReturning.returning / (metrics.newVsReturning.new + metrics.newVsReturning.returning)) * 100)}%
                  </span>
                </div>
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-teal-500 rounded-full" />
                      <span className="text-sm text-gray-700">Patients récurrents</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{metrics.newVsReturning.returning}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-full"
                      style={{ width: `${(metrics.newVsReturning.returning / (metrics.newVsReturning.new + metrics.newVsReturning.returning)) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full" />
                      <span className="text-sm text-gray-700">Nouveaux patients</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{metrics.newVsReturning.new}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${(metrics.newVsReturning.new / (metrics.newVsReturning.new + metrics.newVsReturning.returning)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* No-show Trend */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Tendance des no-shows (7 dernières semaines)</h3>
            <div className="flex items-end gap-2 h-32">
              {metrics.noShowTrend.map((value, index) => {
                const maxValue = Math.max(...metrics.noShowTrend);
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-amber-400 rounded-t transition-all hover:bg-amber-500"
                      style={{ height: `${(value / maxValue) * 100}%`, minHeight: '4px' }}
                    />
                    <span className="text-xs text-gray-500 mt-2">S{index + 1}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-green-600">
              <TrendingDown className="w-4 h-4" />
              <span>Tendance à la baisse (-15% sur 7 semaines)</span>
            </div>
          </div>
        </div>

        {/* Performance by Day */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Performance par jour</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Jour</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">RDV</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Revenus</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">No-shows</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Efficacité</th>
                </tr>
              </thead>
              <tbody>
                {metrics.performanceByDay.map((day) => {
                  const efficiency = ((day.appointments - day.noShows) / day.appointments) * 100;
                  return (
                    <tr key={day.day} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{day.day}</td>
                      <td className="py-3 px-4 text-right text-gray-600">{day.appointments}</td>
                      <td className="py-3 px-4 text-right text-gray-600">{formatCurrency(day.revenue)}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`${day.noShows === 0 ? 'text-green-600' : 'text-amber-600'}`}>
                          {day.noShows}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`text-sm font-medium ${efficiency >= 90 ? 'text-green-600' : efficiency >= 80 ? 'text-amber-600' : 'text-red-600'}`}>
                          {efficiency.toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Services */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Top services</h3>
            <div className="space-y-4">
              {metrics.topServices.map((service, index) => (
                <div key={service.name} className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm font-bold text-gray-600">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">{service.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        service.growth >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {service.growth >= 0 ? '+' : ''}{service.growth}%
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{service.count} consultations</span>
                      <span>{formatCurrency(service.revenue)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Projections */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Prévisions fin de mois</h3>
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Revenus projetés</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.projectedMonthlyRevenue)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">vs objectif</p>
                    <p className={`text-lg font-semibold ${
                      metrics.projectedMonthlyRevenue >= metrics.revenueGoal ? 'text-green-600' : 'text-amber-600'
                    }`}>
                      {metrics.projectedMonthlyRevenue >= metrics.revenueGoal ? '+' : ''}
                      {formatCurrency(metrics.projectedMonthlyRevenue - metrics.revenueGoal)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">RDV projetés</p>
                    <p className="text-2xl font-bold text-gray-900">{metrics.projectedMonthlyAppointments}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">vs objectif</p>
                    <p className={`text-lg font-semibold ${
                      metrics.projectedMonthlyAppointments >= metrics.appointmentsGoal ? 'text-green-600' : 'text-amber-600'
                    }`}>
                      {metrics.projectedMonthlyAppointments >= metrics.appointmentsGoal ? '+' : ''}
                      {metrics.projectedMonthlyAppointments - metrics.appointmentsGoal}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Prévisions basées sur la tendance des 2 dernières semaines</span>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Trends Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Tendances sur 6 mois</h3>
          <div className="space-y-6">
            {/* Revenue Trend */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Revenus</span>
                <div className="flex items-center gap-4 text-xs">
                  {metrics.monthlyTrends.map((m) => (
                    <span key={m.month} className="text-gray-500">{m.month}</span>
                  ))}
                </div>
              </div>
              <div className="flex items-end gap-2 h-24">
                {metrics.monthlyTrends.map((m) => {
                  const maxRevenue = Math.max(...metrics.monthlyTrends.map(t => t.revenue));
                  return (
                    <div key={m.month} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t transition-all hover:from-green-600 hover:to-green-500"
                        style={{ height: `${(m.revenue / maxRevenue) * 100}%` }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Appointments Trend */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Rendez-vous</span>
              </div>
              <div className="flex items-end gap-2 h-16">
                {metrics.monthlyTrends.map((m) => {
                  const maxAppointments = Math.max(...metrics.monthlyTrends.map(t => t.appointments));
                  return (
                    <div key={m.month} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-gradient-to-t from-teal-500 to-teal-400 rounded-t transition-all hover:from-teal-600 hover:to-teal-500"
                        style={{ height: `${(m.appointments / maxAppointments) * 100}%` }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            onClick={() => router.push('/analytics')}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← Retour aux statistiques
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors"
          >
            Tableau de bord →
          </button>
        </div>
      </div>
    </div>
  );
}
