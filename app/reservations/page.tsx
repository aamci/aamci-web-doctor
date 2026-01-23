'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  User,
  Search,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  AlertCircle,
  CalendarDays,
  CalendarCheck,
  CalendarX,
  UserX,
  RefreshCw,
  MoreHorizontal,
  Phone,
  Mail,
  FileText,
  Loader2,
  List,
  LayoutGrid,
} from 'lucide-react';

type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'NO_SHOW';

type Appointment = {
  id: string;
  status: AppointmentStatus;
  notes?: string | null;
  type?: string | null;
  kindId?: string | null;
  kind?: {
    id: string;
    name: string;
  } | null;
  slot?: {
    start?: string;
    end?: string;
  } | null;
  patient?: {
    id?: string;
    email?: string;
    fullName?: string;
    avatarUrl?: string | null;
    phone?: string | null;
  } | null;
  createdAt?: string;
};

type SortField = 'date' | 'patient' | 'status' | 'createdAt';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'table' | 'cards';
type DateFilter = 'all' | 'today' | 'tomorrow' | 'week' | 'month' | 'past';

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

async function authedFetch(path: string, init?: RequestInit) {
  const base = getApiBase();
  const url = base ? `${base}${path}` : path;

  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (!token) throw new Error('Non authentifié');

  const headers: Record<string, string> = {
    ...(init?.headers as any),
    Authorization: `Bearer ${token}`,
  };
  if (init?.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, { ...init, headers, cache: 'no-store' });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}${t ? ` — ${t}` : ''}`);
  }
  return res;
}

export default function ReservationsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Tri
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Vue
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Menu actions
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const fetchAppointments = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await authedFetch('/appointments');
      const data = await res.json();
      const list = Array.isArray(data) ? data : data?.data || [];
      setAppointments(list);
    } catch (e: any) {
      if (String(e?.message || '').includes('Non authentifié')) {
        router.replace('/auth/login');
      } else {
        setErr(e?.message || 'Erreur de chargement');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/auth/login');
      return;
    }
    fetchAppointments();
  }, [router]);

  // Stats
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const pending = appointments.filter((a) => a.status === 'PENDING').length;
    const confirmed = appointments.filter((a) => a.status === 'CONFIRMED').length;
    const cancelled = appointments.filter((a) => a.status === 'CANCELLED').length;
    const noShow = appointments.filter((a) => a.status === 'NO_SHOW').length;

    const todayCount = appointments.filter((a) => {
      if (!a.slot?.start) return false;
      const date = new Date(a.slot.start);
      date.setHours(0, 0, 0, 0);
      return date.getTime() === today.getTime();
    }).length;

    const upcomingCount = appointments.filter((a) => {
      if (!a.slot?.start) return false;
      return new Date(a.slot.start) > new Date();
    }).length;

    return { pending, confirmed, cancelled, noShow, todayCount, upcomingCount, total: appointments.length };
  }, [appointments]);

  // Filtrage et tri
  const filteredAppointments = useMemo(() => {
    let result = [...appointments];

    // Recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.patient?.fullName?.toLowerCase().includes(query) ||
          a.patient?.email?.toLowerCase().includes(query) ||
          a.patient?.phone?.includes(query) ||
          a.type?.toLowerCase().includes(query) ||
          a.kind?.name?.toLowerCase().includes(query)
      );
    }

    // Filtre par statut
    if (statusFilter !== 'all') {
      result = result.filter((a) => a.status === statusFilter);
    }

    // Filtre par date
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const monthEnd = new Date(today);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    if (dateFilter !== 'all') {
      result = result.filter((a) => {
        if (!a.slot?.start) return false;
        const date = new Date(a.slot.start);
        switch (dateFilter) {
          case 'today':
            return date >= today && date < tomorrow;
          case 'tomorrow':
            const dayAfter = new Date(tomorrow);
            dayAfter.setDate(dayAfter.getDate() + 1);
            return date >= tomorrow && date < dayAfter;
          case 'week':
            return date >= today && date < weekEnd;
          case 'month':
            return date >= today && date < monthEnd;
          case 'past':
            return date < today;
          default:
            return true;
        }
      });
    }

    // Tri
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date':
          const dateA = a.slot?.start ? new Date(a.slot.start).getTime() : 0;
          const dateB = b.slot?.start ? new Date(b.slot.start).getTime() : 0;
          comparison = dateA - dateB;
          break;
        case 'patient':
          comparison = (a.patient?.fullName || '').localeCompare(b.patient?.fullName || '');
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'createdAt':
          const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          comparison = createdA - createdB;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [appointments, searchQuery, statusFilter, dateFilter, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAppointments.length / ITEMS_PER_PAGE);
  const paginatedAppointments = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAppointments.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAppointments, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, dateFilter, sortField, sortOrder]);

  // Actions
  const handleStatusChange = async (appointmentId: string, newStatus: AppointmentStatus) => {
    setActionLoading(appointmentId);
    setOpenMenuId(null);
    try {
      await authedFetch(`/appointments/${appointmentId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setAppointments((prev) =>
        prev.map((a) => (a.id === appointmentId ? { ...a, status: newStatus } : a))
      );
    } catch (e: any) {
      setErr(e?.message || 'Erreur lors de la mise à jour');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'CONFIRMED':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'NO_SHOW':
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: AppointmentStatus) => {
    switch (status) {
      case 'PENDING':
        return 'En attente';
      case 'CONFIRMED':
        return 'Confirmé';
      case 'CANCELLED':
        return 'Annulé';
      case 'NO_SHOW':
        return 'Absent';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
          <p className="mt-3 text-gray-600">Chargement des réservations...</p>
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
            <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Réservations</h1>
              <p className="text-sm text-gray-500">
                {stats.total} rendez-vous au total
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchAppointments}
              disabled={loading}
              className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-colors border border-gray-200"
              title="Actualiser"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'table' ? 'bg-teal-100 text-teal-700' : 'text-gray-500 hover:bg-gray-100'
                }`}
                title="Vue tableau"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'cards' ? 'bg-teal-100 text-teal-700' : 'text-gray-500 hover:bg-gray-100'
                }`}
                title="Vue cartes"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Erreur */}
        {err && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {err}
            <button onClick={() => setErr(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.todayCount}</p>
                <p className="text-xs text-gray-500">Aujourd'hui</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                <CalendarCheck className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.upcomingCount}</p>
                <p className="text-xs text-gray-500">À venir</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                <p className="text-xs text-gray-500">En attente</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.confirmed}</p>
                <p className="text-xs text-gray-500">Confirmés</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <CalendarX className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.cancelled}</p>
                <p className="text-xs text-gray-500">Annulés</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <UserX className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.noShow}</p>
                <p className="text-xs text-gray-500">Absents</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Recherche */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher un patient, type de consultation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Filtres rapides par statut */}
            <div className="flex items-center gap-2">
              {(['all', 'PENDING', 'CONFIRMED', 'CANCELLED'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                    statusFilter === status
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? 'Tous' : getStatusLabel(status)}
                </button>
              ))}
            </div>

            {/* Bouton filtres avancés */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-colors ${
                showFilters || dateFilter !== 'all'
                  ? 'border-teal-500 bg-teal-50 text-teal-700'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              Plus de filtres
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Filtres avancés */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex flex-wrap gap-6">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">Période</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'all', label: 'Toutes' },
                      { value: 'today', label: "Aujourd'hui" },
                      { value: 'tomorrow', label: 'Demain' },
                      { value: 'week', label: 'Cette semaine' },
                      { value: 'month', label: 'Ce mois' },
                      { value: 'past', label: 'Passés' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setDateFilter(option.value as DateFilter)}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                          dateFilter === option.value
                            ? 'bg-teal-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">Trier par</label>
                  <div className="flex items-center gap-2">
                    <select
                      value={sortField}
                      onChange={(e) => setSortField(e.target.value as SortField)}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white"
                    >
                      <option value="date">Date du RDV</option>
                      <option value="patient">Patient</option>
                      <option value="status">Statut</option>
                      <option value="createdAt">Date de création</option>
                    </select>
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                  </div>
                </div>
              </div>

              {(dateFilter !== 'all' || statusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setDateFilter('all');
                    setStatusFilter('all');
                  }}
                  className="mt-3 text-sm text-teal-600 hover:text-teal-700 font-medium"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          )}
        </div>

        {/* Résultats */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            {filteredAppointments.length} réservation{filteredAppointments.length > 1 ? 's' : ''} trouvée{filteredAppointments.length > 1 ? 's' : ''}
          </p>
          <p className="text-sm text-gray-400">
            Page {currentPage} sur {totalPages || 1}
          </p>
        </div>

        {/* Contenu */}
        {paginatedAppointments.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
            <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Aucune réservation trouvée</p>
            <p className="text-sm text-gray-400 mt-1">
              {searchQuery || statusFilter !== 'all' || dateFilter !== 'all'
                ? 'Essayez de modifier vos filtres'
                : 'Les réservations de vos patients apparaîtront ici'}
            </p>
          </div>
        ) : viewMode === 'table' ? (
          /* Vue Tableau */
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Patient</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date & Heure</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedAppointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {apt.patient?.avatarUrl ? (
                          <img
                            src={apt.patient.avatarUrl}
                            alt={apt.patient.fullName || 'Patient'}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                            <span className="text-teal-700 font-semibold text-sm">
                              {getInitials(apt.patient?.fullName)}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{apt.patient?.fullName || 'Patient'}</p>
                          <p className="text-xs text-gray-500">{apt.patient?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {apt.slot?.start ? (
                        <div>
                          <p className="font-medium text-gray-900">{formatDate(apt.slot.start)}</p>
                          <p className="text-xs text-gray-500">
                            {formatTime(apt.slot.start)}
                            {apt.slot.end && ` - ${formatTime(apt.slot.end)}`}
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Non défini</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {apt.kind?.name || apt.type || 'Consultation'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(apt.status)}`}>
                        {getStatusLabel(apt.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === apt.id ? null : apt.id)}
                          disabled={actionLoading === apt.id}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          {actionLoading === apt.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                          ) : (
                            <MoreHorizontal className="w-4 h-4 text-gray-500" />
                          )}
                        </button>

                        {openMenuId === apt.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenMenuId(null)}
                            />
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                              {apt.status !== 'CONFIRMED' && (
                                <button
                                  onClick={() => handleStatusChange(apt.id, 'CONFIRMED')}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <Check className="w-4 h-4 text-green-600" />
                                  Confirmer
                                </button>
                              )}
                              {apt.status !== 'CANCELLED' && (
                                <button
                                  onClick={() => handleStatusChange(apt.id, 'CANCELLED')}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <X className="w-4 h-4 text-red-600" />
                                  Annuler
                                </button>
                              )}
                              {apt.status !== 'NO_SHOW' && (
                                <button
                                  onClick={() => handleStatusChange(apt.id, 'NO_SHOW')}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <UserX className="w-4 h-4 text-gray-600" />
                                  Marquer absent
                                </button>
                              )}
                              {apt.patient?.id && (
                                <button
                                  onClick={() => {
                                    router.push(`/patients/${apt.patient?.id}`);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-t border-gray-100"
                                >
                                  <User className="w-4 h-4 text-teal-600" />
                                  Voir le dossier
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Vue Cartes */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedAppointments.map((apt) => (
              <div key={apt.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {apt.patient?.avatarUrl ? (
                      <img
                        src={apt.patient.avatarUrl}
                        alt={apt.patient.fullName || 'Patient'}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
                        <span className="text-teal-700 font-semibold">
                          {getInitials(apt.patient?.fullName)}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">{apt.patient?.fullName || 'Patient'}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(apt.status)}`}>
                        {getStatusLabel(apt.status)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setOpenMenuId(openMenuId === apt.id ? null : apt.id)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg"
                  >
                    <MoreHorizontal className="w-4 h-4 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-2 text-sm">
                  {apt.slot?.start && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{formatDate(apt.slot.start)} à {formatTime(apt.slot.start)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-600">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span>{apt.kind?.name || apt.type || 'Consultation'}</span>
                  </div>
                  {apt.patient?.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{apt.patient.phone}</span>
                    </div>
                  )}
                  {apt.patient?.email && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{apt.patient.email}</span>
                    </div>
                  )}
                </div>

                {apt.status === 'PENDING' && (
                  <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleStatusChange(apt.id, 'CONFIRMED')}
                      disabled={actionLoading === apt.id}
                      className="flex-1 py-2 px-3 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      {actionLoading === apt.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Confirmer
                    </button>
                    <button
                      onClick={() => handleStatusChange(apt.id, 'CANCELLED')}
                      disabled={actionLoading === apt.id}
                      className="flex-1 py-2 px-3 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Annuler
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === pageNum
                      ? 'bg-teal-600 text-white'
                      : 'border border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
