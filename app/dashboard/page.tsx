'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Calendar,
  CalendarCheck,
  Clock,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  Bell,
  Wallet,
  UserPlus,
  Activity,
  ArrowUpRight,
  RefreshCw,
  Loader2,
  CalendarDays,
  Phone,
  Video,
  FileText,
} from 'lucide-react';

interface DashboardStats {
  totalPatients: number;
  newPatientsThisMonth: number;
  appointmentsToday: number;
  appointmentsThisWeek: number;
  pendingAppointments: number;
  completedThisMonth: number;
  revenue: number;
  revenueChange: number;
}

interface Appointment {
  id: string;
  status: string;
  slot?: {
    start?: string;
    end?: string;
  };
  patient?: {
    id?: string;
    fullName?: string;
    avatarUrl?: string | null;
    phone?: string;
  };
  kind?: {
    name?: string;
  };
  type?: string;
}

interface RecentActivity {
  id: string;
  type: 'appointment' | 'patient' | 'payment' | 'note';
  title: string;
  description: string;
  time: string;
  icon: 'calendar' | 'user' | 'wallet' | 'file';
}

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

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/auth/login');
      return;
    }
    fetchData();
  }, [router]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [appointmentsRes, patientsRes] = await Promise.all([
        authedFetch('/appointments'),
        authedFetch('/patients'),
      ]);

      const appointmentsData = await appointmentsRes.json();
      const patientsData = await patientsRes.json();

      setAppointments(Array.isArray(appointmentsData) ? appointmentsData : appointmentsData?.data || []);
      setPatients(Array.isArray(patientsData) ? patientsData : patientsData?.data || []);
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

  // Calculer les statistiques
  const stats = useMemo((): DashboardStats => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const appointmentsToday = appointments.filter((a) => {
      if (!a.slot?.start) return false;
      const date = new Date(a.slot.start);
      return date >= today && date < tomorrow;
    }).length;

    const appointmentsThisWeek = appointments.filter((a) => {
      if (!a.slot?.start) return false;
      const date = new Date(a.slot.start);
      return date >= today && date < weekEnd;
    }).length;

    const pendingAppointments = appointments.filter((a) => a.status === 'PENDING').length;

    const completedThisMonth = appointments.filter((a) => {
      if (a.status !== 'CONFIRMED') return false;
      if (!a.slot?.start) return false;
      const date = new Date(a.slot.start);
      return date >= monthStart && date <= now;
    }).length;

    const newPatientsThisMonth = patients.filter((p) => {
      const created = new Date(p.createdAt);
      return created >= monthStart;
    }).length;

    return {
      totalPatients: patients.length,
      newPatientsThisMonth,
      appointmentsToday,
      appointmentsThisWeek,
      pendingAppointments,
      completedThisMonth,
      revenue: completedThisMonth * 50, // Estimation
      revenueChange: 12.5, // Placeholder
    };
  }, [appointments, patients]);

  // RDV du jour
  const todayAppointments = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return appointments
      .filter((a) => {
        if (!a.slot?.start) return false;
        const date = new Date(a.slot.start);
        return date >= today && date < tomorrow;
      })
      .sort((a, b) => {
        const dateA = a.slot?.start ? new Date(a.slot.start).getTime() : 0;
        const dateB = b.slot?.start ? new Date(b.slot.start).getTime() : 0;
        return dateA - dateB;
      })
      .slice(0, 5);
  }, [appointments]);

  // Activité récente simulée
  const recentActivity: RecentActivity[] = useMemo(() => {
    const activities: RecentActivity[] = [];

    // Ajouter les derniers patients
    patients.slice(0, 2).forEach((p) => {
      activities.push({
        id: `patient-${p.id}`,
        type: 'patient',
        title: 'Nouveau patient',
        description: p.fullName || p.email,
        time: formatRelativeTime(p.createdAt),
        icon: 'user',
      });
    });

    // Ajouter les derniers RDV
    appointments.slice(0, 3).forEach((a) => {
      activities.push({
        id: `apt-${a.id}`,
        type: 'appointment',
        title: a.status === 'CONFIRMED' ? 'RDV confirmé' : a.status === 'CANCELLED' ? 'RDV annulé' : 'Nouveau RDV',
        description: `${a.patient?.fullName || 'Patient'} - ${a.kind?.name || a.type || 'Consultation'}`,
        time: formatRelativeTime(a.slot?.start || ''),
        icon: 'calendar',
      });
    });

    return activities.slice(0, 5);
  }, [appointments, patients]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatRelativeTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString('fr-FR');
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-700';
      case 'CONFIRMED':
        return 'bg-green-100 text-green-700';
      case 'CANCELLED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'En attente';
      case 'CONFIRMED':
        return 'Confirmé';
      case 'CANCELLED':
        return 'Annulé';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
          <p className="mt-3 text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
            <p className="text-sm text-gray-500">
              {new Date().toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-colors border border-gray-200"
              title="Actualiser"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button className="relative p-2.5 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-colors border border-gray-200">
              <Bell className="w-4 h-4" />
              {stats.pendingAppointments > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {stats.pendingAppointments}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Erreur */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                <TrendingUp className="w-3 h-3" />
                +{stats.newPatientsThisMonth}
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalPatients}</p>
            <p className="text-sm text-gray-500 mt-1">Patients totaux</p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                <CalendarCheck className="w-6 h-6 text-teal-600" />
              </div>
              {stats.appointmentsToday > 0 && (
                <span className="text-xs font-medium text-teal-600 bg-teal-50 px-2 py-1 rounded-full">
                  Aujourd'hui
                </span>
              )}
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.appointmentsToday}</p>
            <p className="text-sm text-gray-500 mt-1">RDV aujourd'hui</p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              {stats.pendingAppointments > 0 && (
                <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                  Action requise
                </span>
              )}
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.pendingAppointments}</p>
            <p className="text-sm text-gray-500 mt-1">En attente de confirmation</p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-green-600" />
              </div>
              <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                <TrendingUp className="w-3 h-3" />
                +{stats.revenueChange}%
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.revenue} FCFA</p>
            <p className="text-sm text-gray-500 mt-1">Revenus ce mois</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne gauche - RDV du jour */}
          <div className="lg:col-span-2 space-y-6">
            {/* RDV Aujourd'hui */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                    <CalendarDays className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">Rendez-vous du jour</h2>
                    <p className="text-xs text-gray-500">{stats.appointmentsToday} rendez-vous prévus</p>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/planning')}
                  className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
                >
                  Voir le planning
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {todayAppointments.length === 0 ? (
                <div className="p-8 text-center">
                  <CalendarCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">Aucun rendez-vous aujourd'hui</p>
                  <p className="text-sm text-gray-400 mt-1">Profitez de votre journée libre !</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {todayAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => router.push('/reservations')}
                    >
                      <div className="flex items-center gap-4">
                        {/* Heure */}
                        <div className="text-center min-w-[60px]">
                          <p className="text-lg font-bold text-gray-900">
                            {apt.slot?.start ? formatTime(apt.slot.start) : '--:--'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {apt.slot?.end ? formatTime(apt.slot.end) : ''}
                          </p>
                        </div>

                        {/* Ligne verticale */}
                        <div className="w-1 h-12 bg-teal-500 rounded-full" />

                        {/* Avatar */}
                        {apt.patient?.avatarUrl ? (
                          <img
                            src={apt.patient.avatarUrl}
                            alt={apt.patient.fullName || 'Patient'}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <span className="text-gray-600 font-semibold text-sm">
                              {getInitials(apt.patient?.fullName)}
                            </span>
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900">{apt.patient?.fullName || 'Patient'}</p>
                          <p className="text-sm text-gray-500">{apt.kind?.name || apt.type || 'Consultation'}</p>
                        </div>

                        {/* Statut et actions */}
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(apt.status)}`}>
                            {getStatusLabel(apt.status)}
                          </span>
                          {apt.patient?.phone && (
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                              <Phone className="w-4 h-4 text-gray-500" />
                            </button>
                          )}
                          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <Video className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Statistiques hebdomadaires */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Cette semaine</h2>
                <button
                  onClick={() => router.push('/reservations')}
                  className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                >
                  Voir détails
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-2xl font-bold text-gray-900">{stats.appointmentsThisWeek}</p>
                  <p className="text-sm text-gray-500">RDV prévus</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-2xl font-bold text-gray-900">{stats.completedThisMonth}</p>
                  <p className="text-sm text-gray-500">Consultations</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-2xl font-bold text-gray-900">{stats.newPatientsThisMonth}</p>
                  <p className="text-sm text-gray-500">Nouveaux patients</p>
                </div>
              </div>
            </div>
          </div>

          {/* Colonne droite - Activité et raccourcis */}
          <div className="space-y-6">
            {/* Actions rapides */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Actions rapides</h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => router.push('/planning')}
                  className="flex flex-col items-center gap-2 p-4 bg-teal-50 hover:bg-teal-100 rounded-xl transition-colors"
                >
                  <CalendarCheck className="w-6 h-6 text-teal-600" />
                  <span className="text-sm font-medium text-teal-700">Nouveau RDV</span>
                </button>
                <button
                  onClick={() => router.push('/patients')}
                  className="flex flex-col items-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                >
                  <UserPlus className="w-6 h-6 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">Nouveau patient</span>
                </button>
                <button
                  onClick={() => router.push('/reservations')}
                  className="flex flex-col items-center gap-2 p-4 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors"
                >
                  <Clock className="w-6 h-6 text-amber-600" />
                  <span className="text-sm font-medium text-amber-700">En attente</span>
                </button>
                <button
                  onClick={() => router.push('/medical-notes')}
                  className="flex flex-col items-center gap-2 p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors"
                >
                  <FileText className="w-6 h-6 text-purple-600" />
                  <span className="text-sm font-medium text-purple-700">Notes</span>
                </button>
              </div>
            </div>

            {/* Activité récente */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Activité récente</h2>
              </div>

              {recentActivity.length === 0 ? (
                <div className="p-6 text-center">
                  <Activity className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Aucune activité récente</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="px-5 py-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          activity.icon === 'calendar' ? 'bg-teal-100' :
                          activity.icon === 'user' ? 'bg-blue-100' :
                          activity.icon === 'wallet' ? 'bg-green-100' :
                          'bg-purple-100'
                        }`}>
                          {activity.icon === 'calendar' && <Calendar className="w-4 h-4 text-teal-600" />}
                          {activity.icon === 'user' && <Users className="w-4 h-4 text-blue-600" />}
                          {activity.icon === 'wallet' && <Wallet className="w-4 h-4 text-green-600" />}
                          {activity.icon === 'file' && <FileText className="w-4 h-4 text-purple-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                          <p className="text-xs text-gray-500 truncate">{activity.description}</p>
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">{activity.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Alertes */}
            {stats.pendingAppointments > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">
                      {stats.pendingAppointments} RDV en attente
                    </p>
                    <p className="text-sm text-amber-700 mt-1">
                      Des rendez-vous nécessitent votre confirmation.
                    </p>
                    <button
                      onClick={() => router.push('/reservations?status=PENDING')}
                      className="mt-2 text-sm font-medium text-amber-800 hover:text-amber-900 flex items-center gap-1"
                    >
                      Voir les demandes
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
