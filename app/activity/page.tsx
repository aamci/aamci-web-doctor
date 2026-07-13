'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  Download,
  Calendar,
  Users,
  Euro,
  TrendingUp,
  TrendingDown,
  Video,
  MapPin,
  Home,
  Stethoscope,
  ChevronDown,
  Filter,
  FileText,
  Pill,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  Loader2,
  RefreshCw,
  X,
  Printer,
  FileSpreadsheet,
  CalendarDays,
  Target,
  Award,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

// Types
interface DoctorOverview {
  totalAppointments: number;
  upcomingAppointments: number;
  confirmedThisMonth: number;
  revenueThisMonth: number;
  noShowRate: number;
  last30Days: Array<{ date: string; count: number }>;
}

interface RevenueTimeline {
  date: string;
  amount: number;
}

interface ActivityStats {
  consultations: number;
  consultationsTrend: number;
  newPatients: number;
  newPatientsTrend: number;
  revenue: number;
  revenueTrend: number;
  cancellationRate: number;
  cancellationTrend: number;
  prescriptions: number;
  noShowRate: number;
}

interface TypeDistribution {
  type: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

interface DiagnosisStats {
  diagnosis: string;
  count: number;
  percentage: number;
}

interface PatientDemographics {
  ageGroup: string;
  count: number;
  percentage: number;
}

const PERIOD_OPTIONS = [
  { value: '7', label: '7 derniers jours', days: 7 },
  { value: '30', label: '30 derniers jours', days: 30 },
  { value: '60', label: '60 derniers jours', days: 60 },
  { value: '90', label: '3 derniers mois', days: 90 },
];

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

async function authedFetch(path: string) {
  const base = getApiBase();
  const url = base ? `${base}${path}` : path;
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (!token) throw new Error('Non authentifié');

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res;
}

export default function ActivityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('30');

  // API data
  const [overview, setOverview] = useState<DoctorOverview | null>(null);
  const [revenueTimeline, setRevenueTimeline] = useState<RevenueTimeline[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);

  // UI state
  const [showExportModal, setShowExportModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'patients' | 'prescriptions' | 'revenue'>('overview');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/auth/login');
      return;
    }
    fetchData();
  }, [router, period]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewRes, revenueRes, appointmentsRes, patientsRes, prescriptionsRes] = await Promise.all([
        authedFetch('/stats/doctor/overview'),
        authedFetch(`/stats/doctor/revenue-timeline?days=${period}`),
        authedFetch('/appointments'),
        authedFetch('/patients'),
        authedFetch('/prescriptions').catch(() => ({ json: () => [] })),
      ]);

      const overviewData = await overviewRes.json();
      const revenueData = await revenueRes.json();
      const appointmentsData = await appointmentsRes.json();
      const patientsData = await patientsRes.json();
      const prescriptionsData = await prescriptionsRes.json();

      setOverview(overviewData);
      setRevenueTimeline(Array.isArray(revenueData) ? revenueData : []);
      setAppointments(Array.isArray(appointmentsData) ? appointmentsData : appointmentsData?.data || []);
      setPatients(Array.isArray(patientsData) ? patientsData : patientsData?.data || []);
      setPrescriptions(Array.isArray(prescriptionsData) ? prescriptionsData : prescriptionsData?.data || []);
    } catch (e: any) {
      if (e.message?.includes('Non authentifié')) {
        router.replace('/auth/login');
      } else {
        setError(e.message || 'Erreur de chargement');
      }
    } finally {
      setLoading(false);
    }
  };

  // Computed stats
  const stats = useMemo((): ActivityStats => {
    const now = new Date();
    const periodDays = parseInt(period);
    const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
    const prevPeriodStart = new Date(periodStart.getTime() - periodDays * 24 * 60 * 60 * 1000);

    // Filter appointments for current period
    const currentPeriodAppts = appointments.filter(a => {
      const date = new Date(a.createdAt || a.slot?.start);
      return date >= periodStart && date <= now;
    });

    const prevPeriodAppts = appointments.filter(a => {
      const date = new Date(a.createdAt || a.slot?.start);
      return date >= prevPeriodStart && date < periodStart;
    });

    // Consultations
    const consultations = currentPeriodAppts.filter(a => a.status === 'CONFIRMED').length;
    const prevConsultations = prevPeriodAppts.filter(a => a.status === 'CONFIRMED').length;
    const consultationsTrend = prevConsultations > 0
      ? Math.round(((consultations - prevConsultations) / prevConsultations) * 100)
      : 0;

    // New patients
    const newPatients = patients.filter(p => {
      const created = new Date(p.createdAt);
      return created >= periodStart;
    }).length;
    const prevNewPatients = patients.filter(p => {
      const created = new Date(p.createdAt);
      return created >= prevPeriodStart && created < periodStart;
    }).length;
    const newPatientsTrend = prevNewPatients > 0
      ? Math.round(((newPatients - prevNewPatients) / prevNewPatients) * 100)
      : 0;

    // Revenue
    const revenue = overview?.revenueThisMonth || 0;
    // Calculate revenue trend from timeline data
    const halfIdx = Math.floor(revenueTimeline.length / 2);
    const recentRevenue = revenueTimeline.slice(halfIdx).reduce((s, d) => s + d.amount, 0);
    const olderRevenue = revenueTimeline.slice(0, halfIdx).reduce((s, d) => s + d.amount, 0);
    const revenueTrend = olderRevenue > 0 ? Math.round(((recentRevenue - olderRevenue) / olderRevenue) * 100) : 0;

    // Cancellation rate
    const cancelled = currentPeriodAppts.filter(a => a.status === 'CANCELLED').length;
    const totalAppts = currentPeriodAppts.length;
    const cancellationRate = totalAppts > 0 ? Math.round((cancelled / totalAppts) * 100) : 0;

    const prevCancelled = prevPeriodAppts.filter(a => a.status === 'CANCELLED').length;
    const prevTotal = prevPeriodAppts.length;
    const prevCancellationRate = prevTotal > 0 ? Math.round((prevCancelled / prevTotal) * 100) : 0;
    const cancellationTrend = cancellationRate - prevCancellationRate;

    // Prescriptions
    const periodPrescriptions = prescriptions.filter(p => {
      const created = new Date(p.createdAt);
      return created >= periodStart;
    }).length;

    return {
      consultations,
      consultationsTrend,
      newPatients,
      newPatientsTrend,
      revenue,
      revenueTrend,
      cancellationRate,
      cancellationTrend,
      prescriptions: periodPrescriptions,
      noShowRate: overview?.noShowRate ? Math.round(overview.noShowRate * 100) : 0,
    };
  }, [appointments, patients, prescriptions, overview, period, revenueTimeline]);

  // Type distribution
  const typeDistribution = useMemo((): TypeDistribution[] => {
    const typeCounts: Record<string, number> = {};
    appointments.forEach(a => {
      const type = a.type || a.kind?.name || 'Consultation';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const total = appointments.length || 1;
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4'];

    return Object.entries(typeCounts)
      .map(([type, count], i) => ({
        type,
        label: type,
        count,
        percentage: Math.round((count / total) * 100),
        color: colors[i % colors.length],
      }))
      .slice(0, 6);
  }, [appointments]);

  // Top diagnoses from prescriptions
  const topDiagnoses = useMemo((): DiagnosisStats[] => {
    const diagnosisCounts: Record<string, number> = {};
    prescriptions.forEach(p => {
      if (p.diagnosis) {
        diagnosisCounts[p.diagnosis] = (diagnosisCounts[p.diagnosis] || 0) + 1;
      }
    });

    const total = prescriptions.filter(p => p.diagnosis).length || 1;

    return Object.entries(diagnosisCounts)
      .map(([diagnosis, count]) => ({
        diagnosis,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [prescriptions]);

  // Patient demographics
  const patientDemographics = useMemo((): PatientDemographics[] => {
    const ageGroups: Record<string, number> = {
      '0-18': 0,
      '19-35': 0,
      '36-50': 0,
      '51-65': 0,
      '65+': 0,
    };

    patients.forEach(p => {
      if (p.dateOfBirth) {
        const age = Math.floor((Date.now() - new Date(p.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        if (age <= 18) ageGroups['0-18']++;
        else if (age <= 35) ageGroups['19-35']++;
        else if (age <= 50) ageGroups['36-50']++;
        else if (age <= 65) ageGroups['51-65']++;
        else ageGroups['65+']++;
      }
    });

    const total = patients.filter(p => p.dateOfBirth).length || 1;

    return Object.entries(ageGroups).map(([ageGroup, count]) => ({
      ageGroup,
      count,
      percentage: Math.round((count / total) * 100),
    }));
  }, [patients]);

  // Chart data
  const chartData = useMemo(() => {
    if (overview?.last30Days) {
      return overview.last30Days.slice(-parseInt(period));
    }
    return [];
  }, [overview, period]);

  const maxChartValue = useMemo(() => {
    return Math.max(...chartData.map(d => d.count), 1);
  }, [chartData]);

  const maxRevenueValue = useMemo(() => {
    return Math.max(...revenueTimeline.map(d => d.amount), 1);
  }, [revenueTimeline]);

  // Export functions
  const exportToCSV = (type: 'appointments' | 'patients' | 'prescriptions' | 'all') => {
    setExporting(true);

    let csvContent = '';
    const now = new Date().toISOString().split('T')[0];

    if (type === 'appointments' || type === 'all') {
      csvContent += 'RENDEZ-VOUS\n';
      csvContent += 'Date,Patient,Type,Statut\n';
      appointments.forEach(a => {
        csvContent += `${a.slot?.start || ''},${a.patient?.fullName || ''},${a.kind?.name || a.type || 'Consultation'},${a.status}\n`;
      });
      csvContent += '\n';
    }

    if (type === 'patients' || type === 'all') {
      csvContent += 'PATIENTS\n';
      csvContent += 'Nom,Email,Téléphone,Date de naissance\n';
      patients.forEach(p => {
        csvContent += `${p.fullName || ''},${p.email || ''},${p.phone || ''},${p.dateOfBirth || ''}\n`;
      });
      csvContent += '\n';
    }

    if (type === 'prescriptions' || type === 'all') {
      csvContent += 'PRESCRIPTIONS\n';
      csvContent += 'Date,Patient,Diagnostic,Statut,Médicaments\n';
      prescriptions.forEach(p => {
        const meds = p.medications?.map((m: any) => m.name).join('; ') || '';
        csvContent += `${p.createdAt || ''},${p.patient?.fullName || ''},${p.diagnosis || ''},${p.status || ''},${meds}\n`;
      });
    }

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rapport-${type}-${now}.csv`;
    link.click();

    setTimeout(() => setExporting(false), 500);
  };

  const generateReport = () => {
    const reportContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Rapport d'activité - ${new Date().toLocaleDateString('fr-FR')}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #0D9488; border-bottom: 2px solid #0D9488; padding-bottom: 10px; }
    h2 { color: #374151; margin-top: 30px; }
    .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
    .stat-card { background: #F3F4F6; padding: 15px; border-radius: 8px; }
    .stat-value { font-size: 24px; font-weight: bold; color: #111827; }
    .stat-label { color: #6B7280; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #E5E7EB; }
    th { background: #F9FAFB; font-weight: 600; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; color: #6B7280; font-size: 12px; }
    @media print { body { max-width: 100%; } }
  </style>
</head>
<body>
  <h1>Rapport d'activité médicale</h1>
  <p>Période: ${PERIOD_OPTIONS.find(p => p.value === period)?.label || period + ' jours'}</p>
  <p>Généré le: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>

  <h2>Statistiques générales</h2>
  <div class="stat-grid">
    <div class="stat-card">
      <div class="stat-value">${stats.consultations}</div>
      <div class="stat-label">Consultations</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.newPatients}</div>
      <div class="stat-label">Nouveaux patients</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.revenue.toLocaleString('fr-FR')} FCFA</div>
      <div class="stat-label">Revenus</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.prescriptions}</div>
      <div class="stat-label">Prescriptions</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.cancellationRate}%</div>
      <div class="stat-label">Taux d'annulation</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.noShowRate}%</div>
      <div class="stat-label">Taux de no-show</div>
    </div>
  </div>

  <h2>Top 5 diagnostics</h2>
  <table>
    <tr><th>Diagnostic</th><th>Nombre</th><th>%</th></tr>
    ${topDiagnoses.map(d => `<tr><td>${d.diagnosis}</td><td>${d.count}</td><td>${d.percentage}%</td></tr>`).join('')}
  </table>

  <h2>Démographie des patients</h2>
  <table>
    <tr><th>Tranche d'âge</th><th>Nombre</th><th>%</th></tr>
    ${patientDemographics.map(d => `<tr><td>${d.ageGroup} ans</td><td>${d.count}</td><td>${d.percentage}%</td></tr>`).join('')}
  </table>

  <h2>Répartition par type de consultation</h2>
  <table>
    <tr><th>Type</th><th>Nombre</th><th>%</th></tr>
    ${typeDistribution.map(t => `<tr><td>${t.label}</td><td>${t.count}</td><td>${t.percentage}%</td></tr>`).join('')}
  </table>

  <div class="footer">
    <p>Ce rapport a été généré automatiquement par le système de gestion médicale.</p>
  </div>
</body>
</html>
    `;

    const blob = new Blob([reportContent], { type: 'text/html;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rapport-activite-${new Date().toISOString().split('T')[0]}.html`;
    link.click();
  };

  const printReport = () => {
    generateReport();
  };

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
      {/* Header - sticky below the global Navbar (h-16) */}
      <div className="sticky top-16 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-6 h-6 text-teal-600" />
                <h1 className="text-2xl font-bold text-gray-900">Statistiques & Rapports</h1>
              </div>
              <p className="text-gray-500 text-sm">
                Analysez votre activité et générez des rapports détaillés
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchData}
                disabled={loading}
                className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Actualiser"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setShowReportModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Générer rapport
              </button>
              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Exporter
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Period Filter & Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Period selector */}
              <div className="relative">
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-2.5 bg-teal-50 border border-teal-200 rounded-lg text-sm font-medium text-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  {PERIOD_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-600 pointer-events-none" />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
              {[
                { id: 'overview', label: 'Vue générale', icon: BarChart3 },
                { id: 'patients', label: 'Patients', icon: Users },
                { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
                { id: 'revenue', label: 'Revenus', icon: Euro },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-blue-600" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${stats.consultationsTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.consultationsTrend >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {Math.abs(stats.consultationsTrend)}%
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stats.consultations}</p>
            <p className="text-sm text-gray-500">Consultations</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${stats.newPatientsTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.newPatientsTrend >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {Math.abs(stats.newPatientsTrend)}%
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stats.newPatients}</p>
            <p className="text-sm text-gray-500">Nouveaux patients</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Euro className="w-5 h-5 text-purple-600" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${stats.revenueTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.revenueTrend >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {Math.abs(stats.revenueTrend)}%
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stats.revenue.toLocaleString('fr-FR')} FCFA</p>
            <p className="text-sm text-gray-500">Revenus ce mois</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Pill className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stats.prescriptions}</p>
            <p className="text-sm text-gray-500">Prescriptions</p>
          </div>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <X className="w-4 h-4 text-red-600" />
              </div>
              <span className="text-sm text-gray-500">Taux d'annulation</span>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-2xl font-bold text-gray-900">{stats.cancellationRate}%</p>
              <span className={`text-sm ${stats.cancellationTrend <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.cancellationTrend <= 0 ? '↓' : '↑'} {Math.abs(stats.cancellationTrend)}%
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
              </div>
              <span className="text-sm text-gray-500">Taux de no-show</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.noShowRate}%</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-teal-600" />
              </div>
              <span className="text-sm text-gray-500">RDV à venir</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{overview?.upcomingAppointments || 0}</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Appointments Evolution Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-900">Évolution des consultations</h3>
              <span className="text-sm text-gray-500">{period} derniers jours</span>
            </div>

            <div className="h-64 relative">
              {chartData.length > 0 ? (
                <>
                  {/* Y-axis labels */}
                  <div className="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between text-xs text-gray-400">
                    <span>{maxChartValue}</span>
                    <span>{Math.round(maxChartValue * 0.5)}</span>
                    <span>0</span>
                  </div>

                  {/* Chart area */}
                  <div className="ml-10 h-full flex items-end gap-1 pb-8">
                    {chartData.map((day, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center group">
                        <div className="relative w-full">
                          <div
                            className="w-full bg-teal-500 rounded-t-sm hover:bg-teal-600 transition-colors cursor-pointer"
                            style={{ height: `${Math.max((day.count / maxChartValue) * 180, 2)}px` }}
                          />
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            {day.count} consultations
                          </div>
                        </div>
                        {i % Math.ceil(chartData.length / 7) === 0 && (
                          <span className="text-xs text-gray-400 mt-2">
                            {new Date(day.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  <p>Aucune donnée disponible</p>
                </div>
              )}
            </div>
          </div>

          {/* Revenue Timeline Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-900">Évolution des revenus</h3>
              <span className="text-sm text-gray-500">{period} derniers jours</span>
            </div>

            <div className="h-64 relative">
              {revenueTimeline.length > 0 ? (
                <>
                  {/* Y-axis labels */}
                  <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-gray-400">
                    <span>{maxRevenueValue} FCFA</span>
                    <span>{Math.round(maxRevenueValue * 0.5)} FCFA</span>
                    <span>0 FCFA</span>
                  </div>

                  {/* SVG Line Chart */}
                  <div className="ml-14 h-full pb-8 relative">
                    <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${revenueTimeline.length * 20} 180`} preserveAspectRatio="none">
                      {/* Area fill */}
                      <path
                        d={`M 0 180 ${revenueTimeline.map((d, i) => `L ${i * 20 + 10} ${180 - (d.amount / maxRevenueValue) * 170}`).join(' ')} L ${(revenueTimeline.length - 1) * 20 + 10} 180 Z`}
                        fill="url(#revenueGradient)"
                      />
                      {/* Line */}
                      <path
                        d={`M ${revenueTimeline.map((d, i) => `${i * 20 + 10} ${180 - (d.amount / maxRevenueValue) * 170}`).join(' L ')}`}
                        fill="none"
                        stroke="#8B5CF6"
                        strokeWidth="2"
                      />
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  <p>Aucune donnée disponible</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Row - Distribution Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Type Distribution */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Répartition par type</h3>

            {typeDistribution.length > 0 ? (
              <div className="space-y-3">
                {typeDistribution.map((item) => (
                  <div key={item.type}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-700">{item.label}</span>
                      <span className="text-gray-500">{item.count} ({item.percentage}%)</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">Aucune donnée</p>
            )}
          </div>

          {/* Top Diagnoses */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Top diagnostics</h3>

            {topDiagnoses.length > 0 ? (
              <div className="space-y-3">
                {topDiagnoses.map((item, i) => (
                  <div key={item.diagnosis} className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-xs font-medium">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">{item.diagnosis}</p>
                      <p className="text-xs text-gray-500">{item.count} cas ({item.percentage}%)</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">Aucune donnée</p>
            )}
          </div>

          {/* Patient Demographics */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Démographie patients</h3>

            <div className="space-y-3">
              {patientDemographics.map((item) => (
                <div key={item.ageGroup}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-700">{item.ageGroup} ans</span>
                    <span className="text-gray-500">{item.count} ({item.percentage}%)</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Exporter les données</h2>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-3">
              <button
                onClick={() => { exportToCSV('appointments'); setShowExportModal(false); }}
                disabled={exporting}
                className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left"
              >
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">Rendez-vous</p>
                  <p className="text-sm text-gray-500">Exporter tous les rendez-vous en CSV</p>
                </div>
              </button>

              <button
                onClick={() => { exportToCSV('patients'); setShowExportModal(false); }}
                disabled={exporting}
                className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left"
              >
                <Users className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">Patients</p>
                  <p className="text-sm text-gray-500">Exporter la liste des patients</p>
                </div>
              </button>

              <button
                onClick={() => { exportToCSV('prescriptions'); setShowExportModal(false); }}
                disabled={exporting}
                className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left"
              >
                <Pill className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="font-medium text-gray-900">Prescriptions</p>
                  <p className="text-sm text-gray-500">Exporter l'historique des prescriptions</p>
                </div>
              </button>

              <button
                onClick={() => { exportToCSV('all'); setShowExportModal(false); }}
                disabled={exporting}
                className="w-full flex items-center gap-3 p-4 bg-teal-50 hover:bg-teal-100 rounded-xl transition-colors text-left border-2 border-teal-200"
              >
                <FileSpreadsheet className="w-5 h-5 text-teal-600" />
                <div>
                  <p className="font-medium text-teal-900">Tout exporter</p>
                  <p className="text-sm text-teal-600">Exporter toutes les données en un seul fichier</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Générer un rapport</h2>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-6">
                Le rapport inclura toutes les statistiques de la période sélectionnée ({PERIOD_OPTIONS.find(p => p.value === period)?.label}).
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => { generateReport(); setShowReportModal(false); }}
                  className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left"
                >
                  <Download className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">Télécharger le rapport</p>
                    <p className="text-sm text-gray-500">Format HTML imprimable</p>
                  </div>
                </button>

                <button
                  onClick={() => { printReport(); setShowReportModal(false); }}
                  className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left"
                >
                  <Printer className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-gray-900">Imprimer le rapport</p>
                    <p className="text-sm text-gray-500">Ouvrir dans une nouvelle fenêtre</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
