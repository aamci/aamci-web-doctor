'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Wallet,
  Clock,
  ChevronDown,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  CalendarCheck,
  UserPlus,
  Filter,
  Download,
  Loader2,
} from 'lucide-react';

interface AnalyticsData {
  // Période courante
  totalPatients: number;
  newPatients: number;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  totalRevenue: number;
  avgConsultationTime: number;

  // Variations vs période précédente
  patientsChange: number;
  appointmentsChange: number;
  revenueChange: number;

  // Données pour graphiques
  weeklyAppointments: number[];
  weeklyRevenue: number[];
  appointmentsByType: { name: string; count: number; color: string }[];
  patientsByAge: { range: string; count: number }[];
  hourlyDistribution: number[];
}

type Period = '7d' | '30d' | '90d' | '12m';

export default function AnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('30d');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);

  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalPatients: 0,
    newPatients: 0,
    totalAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    totalRevenue: 0,
    avgConsultationTime: 0,
    patientsChange: 0,
    appointmentsChange: 0,
    revenueChange: 0,
    weeklyAppointments: [],
    weeklyRevenue: [],
    appointmentsByType: [],
    patientsByAge: [],
    hourlyDistribution: [],
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/auth/login');
      return;
    }
    loadAnalytics();
  }, [period, router]);

  const loadAnalytics = async () => {
    setLoading(true);

    // Simulate API call with mock data
    await new Promise(resolve => setTimeout(resolve, 800));

    // Generate mock data based on period
    const multiplier = period === '7d' ? 1 : period === '30d' ? 4 : period === '90d' ? 12 : 52;

    setAnalytics({
      totalPatients: 156,
      newPatients: Math.floor(12 * multiplier / 4),
      totalAppointments: Math.floor(45 * multiplier / 4),
      completedAppointments: Math.floor(38 * multiplier / 4),
      cancelledAppointments: Math.floor(7 * multiplier / 4),
      totalRevenue: Math.floor(2850 * multiplier / 4),
      avgConsultationTime: 28,
      patientsChange: 15.3,
      appointmentsChange: 8.7,
      revenueChange: 12.4,
      weeklyAppointments: [12, 18, 15, 22, 19, 8, 14],
      weeklyRevenue: [720, 1080, 900, 1320, 1140, 480, 840],
      appointmentsByType: [
        { name: 'Consultation', count: 45, color: '#0d9488' },
        { name: 'Suivi', count: 28, color: '#3b82f6' },
        { name: 'Urgence', count: 12, color: '#ef4444' },
        { name: 'Téléconsultation', count: 15, color: '#8b5cf6' },
      ],
      patientsByAge: [
        { range: '0-18', count: 18 },
        { range: '19-35', count: 42 },
        { range: '36-50', count: 38 },
        { range: '51-65', count: 35 },
        { range: '65+', count: 23 },
      ],
      hourlyDistribution: [0, 0, 0, 0, 0, 0, 0, 0, 8, 15, 22, 18, 12, 20, 25, 18, 14, 10, 5, 0, 0, 0, 0, 0],
    });

    setLoading(false);
  };

  const periodLabels: Record<Period, string> = {
    '7d': '7 derniers jours',
    '30d': '30 derniers jours',
    '90d': '3 derniers mois',
    '12m': '12 derniers mois',
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const maxWeeklyAppointments = Math.max(...analytics.weeklyAppointments, 1);
  const maxHourlyDistribution = Math.max(...analytics.hourlyDistribution, 1);
  const totalTypeAppointments = analytics.appointmentsByType.reduce((sum, t) => sum + t.count, 0);
  const maxPatientsByAge = Math.max(...analytics.patientsByAge.map(p => p.count), 1);

  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const hours = ['8h', '9h', '10h', '11h', '12h', '13h', '14h', '15h', '16h', '17h', '18h'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
          <p className="mt-3 text-gray-600">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Statistiques & Analytics</h1>
              <p className="text-sm text-gray-500">Analysez vos performances</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Period Selector */}
            <div className="relative">
              <button
                onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                {periodLabels[period]}
                <ChevronDown className="w-4 h-4" />
              </button>

              {showPeriodDropdown && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-10">
                  {(Object.keys(periodLabels) as Period[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setPeriod(p);
                        setShowPeriodDropdown(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl ${
                        period === p ? 'text-teal-600 font-medium bg-teal-50' : 'text-gray-700'
                      }`}
                    >
                      {periodLabels[p]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={loadAnalytics}
              className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-colors border border-gray-200"
              title="Actualiser"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
              <Download className="w-4 h-4" />
              Exporter
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Patients */}
          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                analytics.patientsChange >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
              }`}>
                {analytics.patientsChange >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {Math.abs(analytics.patientsChange)}%
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{analytics.totalPatients}</p>
            <p className="text-sm text-gray-500 mt-1">Patients totaux</p>
            <p className="text-xs text-teal-600 mt-2">+{analytics.newPatients} ce mois</p>
          </div>

          {/* Rendez-vous */}
          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                <CalendarCheck className="w-6 h-6 text-teal-600" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                analytics.appointmentsChange >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
              }`}>
                {analytics.appointmentsChange >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {Math.abs(analytics.appointmentsChange)}%
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{analytics.totalAppointments}</p>
            <p className="text-sm text-gray-500 mt-1">Rendez-vous</p>
            <div className="flex items-center gap-3 mt-2 text-xs">
              <span className="text-green-600">{analytics.completedAppointments} réalisés</span>
              <span className="text-red-600">{analytics.cancelledAppointments} annulés</span>
            </div>
          </div>

          {/* Revenus */}
          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-green-600" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                analytics.revenueChange >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
              }`}>
                {analytics.revenueChange >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {Math.abs(analytics.revenueChange)}%
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(analytics.totalRevenue)}</p>
            <p className="text-sm text-gray-500 mt-1">Revenus</p>
            <p className="text-xs text-gray-400 mt-2">
              Moy. {formatCurrency(analytics.totalRevenue / (analytics.completedAppointments || 1))}/consultation
            </p>
          </div>

          {/* Temps moyen */}
          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{analytics.avgConsultationTime} min</p>
            <p className="text-sm text-gray-500 mt-1">Durée moyenne</p>
            <p className="text-xs text-gray-400 mt-2">Par consultation</p>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Weekly Appointments Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Rendez-vous par jour</h3>
              <span className="text-xs text-gray-500">Cette semaine</span>
            </div>

            <div className="flex items-end justify-between gap-2 h-48">
              {analytics.weeklyAppointments.map((value, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col items-center justify-end h-40">
                    <span className="text-xs text-gray-600 mb-1">{value}</span>
                    <div
                      className="w-full bg-teal-500 rounded-t-lg transition-all hover:bg-teal-600"
                      style={{ height: `${(value / maxWeeklyAppointments) * 100}%`, minHeight: value > 0 ? '8px' : '0' }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 mt-2">{days[index]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Appointments by Type */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Types de consultation</h3>
              <span className="text-xs text-gray-500">{totalTypeAppointments} total</span>
            </div>

            <div className="space-y-4">
              {analytics.appointmentsByType.map((type, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }} />
                      <span className="text-sm text-gray-700">{type.name}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {type.count} ({Math.round((type.count / totalTypeAppointments) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(type.count / totalTypeAppointments) * 100}%`,
                        backgroundColor: type.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Patients by Age */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Patients par tranche d'âge</h3>

            <div className="space-y-3">
              {analytics.patientsByAge.map((group, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-12">{group.range}</span>
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${(group.count / maxPatientsByAge) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8 text-right">{group.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hourly Distribution */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Distribution horaire des rendez-vous</h3>

            <div className="flex items-end gap-1 h-32">
              {analytics.hourlyDistribution.slice(8, 19).map((value, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-purple-400 rounded-t transition-all hover:bg-purple-500"
                    style={{ height: `${(value / maxHourlyDistribution) * 100}%`, minHeight: value > 0 ? '4px' : '0' }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              {hours.map((hour, index) => (
                <span key={index} className="text-xs text-gray-500">{hour}</span>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-500" />
                <span>Pic d'activité: 14h-15h</span>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Revenue Trend */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Revenus hebdomadaires</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Total: {formatCurrency(analytics.weeklyRevenue.reduce((a, b) => a + b, 0))}</span>
            </div>
          </div>

          <div className="flex items-end justify-between gap-4 h-48">
            {analytics.weeklyRevenue.map((value, index) => {
              const maxRevenue = Math.max(...analytics.weeklyRevenue);
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col items-center justify-end h-40">
                    <span className="text-xs text-gray-600 mb-1">{formatCurrency(value)}</span>
                    <div
                      className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg transition-all hover:from-green-600 hover:to-green-500"
                      style={{ height: `${(value / maxRevenue) * 100}%`, minHeight: value > 0 ? '8px' : '0' }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 mt-2">{days[index]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Retour au tableau de bord
          </button>
          <button
            onClick={() => router.push('/patients')}
            className="px-4 py-2 text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors"
          >
            Voir les patients →
          </button>
        </div>
      </div>
    </div>
  );
}
