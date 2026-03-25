'use client';

import { useState, useEffect, useMemo } from 'react';
import { required, minLen, maxLen, email as emailVal, phone as phoneVal, hasErrors, type FormErrors } from '@/lib/validation';
import { useRouter } from 'next/navigation';
import { useAuth } from '../_providers/AuthProvider';
import {
  Search,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ChevronRight,
  ChevronLeft,
  UserPlus,
  X,
  FileText,
  Clock,
  AlertTriangle,
  User,
  Plus,
  Filter,
  SortAsc,
  SortDesc,
  Users,
  CalendarCheck,
  Loader2,
  RefreshCw,
  ArrowRightLeft,
} from 'lucide-react';

interface ReceivedPatient {
  id: string;
  patient: {
    id: string;
    fullName: string | null;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
    birthdate: string | null;
  };
  fromDoctor: { id: string; fullName: string | null };
  respondedAt: string | null;
  reason: string;
}

interface Patient {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  sex: string | null;
  birthdate: string | null;
  city: string | null;
  createdAt: string;
  appointmentCount: number;
  lastAppointmentDate: string | null;
  nextAppointmentDate: string | null;
}

type SortField = 'fullName' | 'createdAt' | 'appointmentCount' | 'lastAppointmentDate';
type SortOrder = 'asc' | 'desc';

interface PatientDetails {
  patient: Patient;
  appointments: any[];
  stats: {
    totalAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    upcomingAppointments: number;
  };
}

interface AppointmentKind {
  id: string;
  name: string;
  duration?: number;
}

interface NewPatientForm {
  gender: 'male' | 'female';
  lastName: string;
  firstName: string;
  birthName: string;
  birthDate: string;
  birthPlace: 'france' | 'abroad';
  birthCity: string;
  phone: string;
  email: string;
}

export default function PatientsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isSecretary = user?.role === 'SECRETARY';
  const [mainTab, setMainTab] = useState<'patients' | 'received'>('patients');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [receivedPatients, setReceivedPatients] = useState<ReceivedPatient[]>([]);
  const [loadingReceived, setLoadingReceived] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Tri et filtres
  const [sortField, setSortField] = useState<SortField>('fullName');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [filterGender, setFilterGender] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  // Panel latéral
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientDetails, setPatientDetails] = useState<PatientDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<'infos' | 'rdv' | 'notes'>('infos');

  // Modals
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [showNewRdvModal, setShowNewRdvModal] = useState(false);
  const [showNewNoteModal, setShowNewNoteModal] = useState(false);
  const [rdvPatient, setRdvPatient] = useState<Patient | null>(null);
  const [notePatient, setNotePatient] = useState<Patient | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3002';

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (mainTab === 'received') fetchReceivedPatients();
  }, [mainTab]);

  // Filtrage, tri et recherche
  const filteredPatients = useMemo(() => {
    let result = [...patients];

    // Recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.fullName?.toLowerCase().includes(query) ||
          p.email.toLowerCase().includes(query) ||
          p.phone?.includes(searchQuery) ||
          formatBirthDate(p.birthdate)?.includes(searchQuery)
      );
    }

    // Filtre par genre
    if (filterGender !== 'all') {
      result = result.filter((p) => p.sex === filterGender);
    }

    // Tri
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'fullName':
          comparison = (a.fullName || '').localeCompare(b.fullName || '');
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'appointmentCount':
          comparison = a.appointmentCount - b.appointmentCount;
          break;
        case 'lastAppointmentDate':
          const dateA = a.lastAppointmentDate ? new Date(a.lastAppointmentDate).getTime() : 0;
          const dateB = b.lastAppointmentDate ? new Date(b.lastAppointmentDate).getTime() : 0;
          comparison = dateA - dateB;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [patients, searchQuery, filterGender, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredPatients.length / ITEMS_PER_PAGE);
  const paginatedPatients = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPatients.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPatients, currentPage]);

  // Reset page quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterGender, sortField, sortOrder]);

  // Stats
  const stats = useMemo(() => {
    const total = patients.length;
    const withUpcoming = patients.filter((p) => p.nextAppointmentDate).length;
    const newThisMonth = patients.filter((p) => {
      const created = new Date(p.createdAt);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length;
    const male = patients.filter((p) => p.sex === 'M').length;
    const female = patients.filter((p) => p.sex === 'F').length;
    return { total, withUpcoming, newThisMonth, male, female };
  }, [patients]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/patients`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPatients(data);
      }
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReceivedPatients = async () => {
    setLoadingReceived(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/referrals/received-patients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReceivedPatients(data);
      }
    } catch (error) {
      console.error('Failed to fetch received patients:', error);
    } finally {
      setLoadingReceived(false);
    }
  };

  const fetchPatientDetails = async (patientId: string) => {
    setLoadingDetails(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/patients/${patientId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPatientDetails(data);
      }
    } catch (error) {
      console.error('Failed to fetch patient details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handlePatientClick = (patient: Patient) => {
    setSelectedPatient(patient);
    setActiveTab('infos');
    fetchPatientDetails(patient.id);
  };

  const closePanel = () => {
    setSelectedPatient(null);
    setPatientDetails(null);
  };

  const handleNewRdv = (patient: Patient) => {
    setRdvPatient(patient);
    setShowNewRdvModal(true);
  };

  const handleNewNote = (patient: Patient) => {
    setNotePatient(patient);
    setShowNewNoteModal(true);
  };

  const handlePatientCreated = () => {
    fetchPatients();
    setShowNewPatientModal(false);
  };

  const handleRdvCreated = () => {
    if (selectedPatient) {
      fetchPatientDetails(selectedPatient.id);
    }
    fetchPatients();
    setShowNewRdvModal(false);
    setRdvPatient(null);
  };

  const handleNoteCreated = () => {
    if (selectedPatient) {
      fetchPatientDetails(selectedPatient.id);
    }
    setShowNewNoteModal(false);
    setNotePatient(null);
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const calculateAge = (birthdate: string | null) => {
    if (!birthdate) return null;
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const formatBirthDate = (birthdate: string | null) => {
    if (!birthdate) return null;
    const date = new Date(birthdate);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Liste principale */}
      <div className={`flex-1 transition-all duration-300 ${selectedPatient ? 'mr-[420px]' : ''}`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dossiers Patients</h1>
                <p className="text-sm text-gray-500">{patients.length} patients enregistrés</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchPatients}
                disabled={loading}
                className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Actualiser"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setShowNewPatientModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium text-sm"
              >
                <UserPlus className="w-4 h-4" />
                Nouveau Patient
              </button>
            </div>
          </div>

          {/* Main tabs */}
          <div className="flex gap-1 mb-6 border-b border-gray-200">
            <button
              onClick={() => setMainTab('patients')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                mainTab === 'patients'
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-4 h-4" />
              Mes patients
            </button>
            {!isSecretary && <button
              onClick={() => setMainTab('received')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                mainTab === 'received'
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4" />
              Dossiers reçus
              {receivedPatients.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-teal-100 text-teal-700 text-xs rounded-full">
                  {receivedPatients.length}
                </span>
              )}
            </button>}
          </div>

          {/* Received patients view */}
          {mainTab === 'received' && (
            <div>
              {loadingReceived ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                </div>
              ) : receivedPatients.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  <ArrowRightLeft className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium text-gray-500">Aucun dossier transféré accepté</p>
                  <p className="text-sm mt-1">Les patients transférés et acceptés apparaîtront ici.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {receivedPatients.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => router.push(`/patients/${r.patient.id}` as any)}
                      className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 hover:border-teal-200 hover:shadow-sm transition-all cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center font-semibold text-teal-700 text-sm flex-shrink-0">
                        {r.patient.fullName?.charAt(0) ?? '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{r.patient.fullName || r.patient.email}</p>
                        <p className="text-xs text-gray-500 truncate">{r.patient.email}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-gray-500">De Dr {r.fromDoctor?.fullName ?? '—'}</p>
                        <p className="text-xs text-gray-400">
                          {r.respondedAt ? new Date(r.respondedAt).toLocaleDateString('fr-FR') : '—'}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Regular patients list (only shown on 'patients' tab) */}
          {mainTab === 'patients' && <>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-xs text-gray-500">Total patients</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CalendarCheck className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.withUpcoming}</p>
                  <p className="text-xs text-gray-500">RDV à venir</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Plus className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.newThisMonth}</p>
                  <p className="text-xs text-gray-500">Nouveaux ce mois</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.male} <span className="text-gray-400 text-sm font-normal">H</span> / {stats.female} <span className="text-gray-400 text-sm font-normal">F</span>
                  </p>
                  <p className="text-xs text-gray-500">Répartition</p>
                </div>
              </div>
            </div>
          </div>

          {/* Barre de recherche et filtres */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Recherche */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher un patient (nom, téléphone, email...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Bouton filtres */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-colors ${
                  showFilters || filterGender !== 'all'
                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filtres
                {filterGender !== 'all' && (
                  <span className="w-5 h-5 bg-teal-600 text-white text-xs rounded-full flex items-center justify-center">
                    1
                  </span>
                )}
              </button>

              {/* Tri */}
              <div className="flex items-center gap-2">
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as SortField)}
                  className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500"
                >
                  <option value="fullName">Nom</option>
                  <option value="createdAt">Date création</option>
                  <option value="appointmentCount">Nb RDV</option>
                  <option value="lastAppointmentDate">Dernier RDV</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  title={sortOrder === 'asc' ? 'Tri croissant' : 'Tri décroissant'}
                >
                  {sortOrder === 'asc' ? (
                    <SortAsc className="w-4 h-4 text-gray-600" />
                  ) : (
                    <SortDesc className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Panneau de filtres */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex flex-wrap gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Genre</label>
                    <div className="flex gap-2">
                      {[
                        { value: 'all', label: 'Tous' },
                        { value: 'M', label: 'Hommes' },
                        { value: 'F', label: 'Femmes' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setFilterGender(option.value)}
                          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                            filterGender === option.value
                              ? 'bg-teal-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {filterGender !== 'all' && (
                  <button
                    onClick={() => setFilterGender('all')}
                    className="mt-3 text-sm text-teal-600 hover:text-teal-700 font-medium"
                  >
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Résultats info */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              {filteredPatients.length} patient{filteredPatients.length > 1 ? 's' : ''} trouvé{filteredPatients.length > 1 ? 's' : ''}
              {searchQuery && ` pour "${searchQuery}"`}
            </p>
            <p className="text-sm text-gray-400">
              Page {currentPage} sur {totalPages || 1}
            </p>
          </div>

          {/* Liste des patients */}
          <div className="space-y-3">
            {loading ? (
              <div className="bg-white rounded-xl p-12 text-center">
                <Loader2 className="w-8 h-8 text-teal-500 animate-spin mx-auto" />
                <p className="mt-4 text-gray-600">Chargement des patients...</p>
              </div>
            ) : paginatedPatients.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center">
                <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">
                  {searchQuery ? 'Aucun patient trouvé' : 'Aucun patient pour le moment'}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {searchQuery ? 'Essayez avec d\'autres termes de recherche' : 'Commencez par créer votre premier patient'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => setShowNewPatientModal(true)}
                    className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700"
                  >
                    Créer votre premier patient
                  </button>
                )}
              </div>
            ) : (
              paginatedPatients.map((patient) => (
                <PatientCard
                  key={patient.id}
                  patient={patient}
                  isSelected={selectedPatient?.id === patient.id}
                  onClick={() => handlePatientClick(patient)}
                  calculateAge={calculateAge}
                  formatBirthDate={formatBirthDate}
                />
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                        : 'border border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
          </>}
        </div>
      </div>

      {/* Panel latéral */}
      {selectedPatient && (
        <div className="fixed right-0 top-0 h-full w-[420px] bg-white border-l border-gray-200 shadow-xl overflow-y-auto z-40">
          <PatientSidePanel
            patient={selectedPatient}
            details={patientDetails}
            loading={loadingDetails}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onClose={closePanel}
            onViewFullProfile={() => router.push(`/patients/${selectedPatient.id}`)}
            onNewRdv={() => handleNewRdv(selectedPatient)}
            onNewNote={() => handleNewNote(selectedPatient)}
            calculateAge={calculateAge}
            formatDate={formatDate}
            getInitials={getInitials}
          />
        </div>
      )}

      {/* Modal Nouveau Patient */}
      {showNewPatientModal && (
        <NewPatientModal
          apiBase={API_BASE_URL}
          onClose={() => setShowNewPatientModal(false)}
          onCreated={handlePatientCreated}
        />
      )}

      {/* Modal Nouveau RDV */}
      {showNewRdvModal && rdvPatient && (
        <NewRdvModal
          apiBase={API_BASE_URL}
          patient={rdvPatient}
          onClose={() => {
            setShowNewRdvModal(false);
            setRdvPatient(null);
          }}
          onCreated={handleRdvCreated}
        />
      )}

      {/* Modal Nouvelle Note */}
      {showNewNoteModal && notePatient && (
        <NewNoteModal
          apiBase={API_BASE_URL}
          patient={notePatient}
          onClose={() => {
            setShowNewNoteModal(false);
            setNotePatient(null);
          }}
          onCreated={handleNoteCreated}
        />
      )}
    </div>
  );
}

// Composant carte patient
function PatientCard({
  patient,
  isSelected,
  onClick,
  calculateAge,
  formatBirthDate,
}: {
  patient: Patient;
  isSelected: boolean;
  onClick: () => void;
  calculateAge: (date: string | null) => number | null;
  formatBirthDate: (date: string | null) => string | null;
}) {
  const age = calculateAge(patient.birthdate);
  const birthDateStr = formatBirthDate(patient.birthdate);

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const avatarColors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-cyan-500',
  ];
  const colorIndex = patient.id.charCodeAt(0) % avatarColors.length;
  const avatarColor = avatarColors[colorIndex];

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-4 cursor-pointer transition-all border-2 ${
        isSelected
          ? 'border-teal-500 shadow-md'
          : 'border-transparent hover:border-gray-200 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {patient.avatarUrl ? (
            <img
              src={patient.avatarUrl}
              alt={patient.fullName || 'Patient'}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className={`w-12 h-12 rounded-full ${avatarColor} flex items-center justify-center`}>
              <span className="text-white font-semibold text-sm">
                {getInitials(patient.fullName)}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold text-gray-900 truncate">
              {patient.fullName?.split(' ').slice(-1)[0]?.toUpperCase() || 'NOM'}{' '}
              <span className="font-normal capitalize">
                {patient.fullName?.split(' ').slice(0, -1).join(' ') || ''}
              </span>
            </h3>
            {patient.sex && (
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                patient.sex === 'M'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-pink-100 text-pink-700'
              }`}>
                {patient.sex === 'M' ? 'H' : 'F'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
            {age && <span>{age} ans</span>}
            {birthDateStr && <span>• {birthDateStr}</span>}
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            {patient.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                <span>{patient.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 truncate">
              <Mail className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{patient.email}</span>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {patient.nextAppointmentDate && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-medium">
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>RDV prévu</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              {patient.appointmentCount}
            </span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </div>
    </div>
  );
}

// Composant panel latéral
function PatientSidePanel({
  patient,
  details,
  loading,
  activeTab,
  setActiveTab,
  onClose,
  onViewFullProfile,
  onNewRdv,
  onNewNote,
  calculateAge,
  formatDate,
  getInitials,
}: {
  patient: Patient;
  details: PatientDetails | null;
  loading: boolean;
  activeTab: 'infos' | 'rdv' | 'notes';
  setActiveTab: (tab: 'infos' | 'rdv' | 'notes') => void;
  onClose: () => void;
  onViewFullProfile: () => void;
  onNewRdv: () => void;
  onNewNote: () => void;
  calculateAge: (date: string | null) => number | null;
  formatDate: (date: string | null) => string;
  getInitials: (name: string | null) => string;
}) {
  const age = calculateAge(patient.birthdate);

  return (
    <div className="h-full flex flex-col">
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
              <span className="text-teal-700 font-semibold text-lg">
                {getInitials(patient.fullName)}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">
                {patient.sex === 'M' ? 'MONSIEUR' : patient.sex === 'F' ? 'MADAME' : ''}
              </p>
              <h2 className="text-lg font-bold text-gray-900">
                {patient.fullName?.toUpperCase() || 'NOM'}
              </h2>
              <p className="text-sm text-gray-500">
                {patient.sex === 'M' ? 'H' : patient.sex === 'F' ? 'F' : ''} • {formatDate(patient.birthdate)} • {age ? `${age} ans` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={onViewFullProfile}
            className="flex-1 py-2 px-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Ouvrir le dossier complet
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onNewRdv}
            className="flex-1 py-2 px-3 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
          >
            + Nouveau RDV
          </button>
          <button
            onClick={onNewNote}
            className="flex-1 py-2 px-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            + Ajouter note
          </button>
        </div>
      </div>

      <div className="px-5 py-3 bg-amber-50 border-b border-amber-100">
        <div className="flex items-center gap-2 text-amber-700">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-medium">Alertes patient</span>
        </div>
        <p className="text-sm text-amber-600 mt-1 ml-6">
          Aucune alerte pour ce patient
        </p>
      </div>

      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('infos')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'infos'
              ? 'text-teal-600 border-b-2 border-teal-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Infos
        </button>
        <button
          onClick={() => setActiveTab('rdv')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'rdv'
              ? 'text-teal-600 border-b-2 border-teal-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          RDV ({details?.stats.totalAppointments || 0})
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'notes'
              ? 'text-teal-600 border-b-2 border-teal-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Notes (0)
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-teal-500 border-t-transparent"></div>
          </div>
        ) : activeTab === 'infos' ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Contact</h3>
              <div className="space-y-2">
                {patient.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{patient.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-teal-600">{patient.email}</span>
                </div>
                {patient.city && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{patient.city}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">
                Informations Médicales
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Médecin traitant</span>
                  <span className="text-gray-900 font-medium">-</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Couverture</span>
                  <span className="text-gray-900">-</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">N° SS</span>
                  <span className="text-gray-900">-</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">
                Administratif
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Créé le</span>
                  <span className="text-gray-900">{formatDate(patient.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'rdv' ? (
          <div className="space-y-4">
            {details?.appointments && details.appointments.length > 0 ? (
              details.appointments.slice(0, 5).map((apt: any) => (
                <div
                  key={apt.id}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {apt.kind?.name || 'Consultation'}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        apt.status === 'CONFIRMED'
                          ? 'bg-green-100 text-green-700'
                          : apt.status === 'CANCELLED'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {apt.status === 'CONFIRMED'
                        ? 'Confirmé'
                        : apt.status === 'CANCELLED'
                        ? 'Annulé'
                        : 'En attente'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {new Date(apt.slot?.start).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">
                Aucun rendez-vous
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Aucune note pour ce patient</p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200 flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Fermer
        </button>
        <button
          onClick={onViewFullProfile}
          className="flex-1 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
        >
          Dossier complet
        </button>
      </div>
    </div>
  );
}

// Modal Nouveau Patient
function NewPatientModal({
  apiBase,
  onClose,
  onCreated,
}: {
  apiBase: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FormErrors<'lastName' | 'firstName' | 'email' | 'phone' | 'birthDate'>>({});
  const [form, setForm] = useState<NewPatientForm>({
    gender: 'male',
    lastName: '',
    firstName: '',
    birthName: '',
    birthDate: '',
    birthPlace: 'france',
    birthCity: '',
    phone: '',
    email: '',
  });

  const setField = <K extends keyof NewPatientForm>(key: K, value: NewPatientForm[K]) => {
    setForm(f => ({ ...f, [key]: value }));
    setFieldErrors(fe => ({ ...fe, [key]: null }));
  };

  const handleSubmit = async () => {
    const errors: typeof fieldErrors = {
      lastName: required(form.lastName, 'Nom') ?? minLen(form.lastName, 2, 'Nom') ?? maxLen(form.lastName, 80, 'Nom'),
      firstName: required(form.firstName, 'Prénom') ?? minLen(form.firstName, 2, 'Prénom') ?? maxLen(form.firstName, 80, 'Prénom'),
      email: required(form.email, 'Email') ?? emailVal(form.email),
      phone: phoneVal(form.phone),
    };
    if (form.birthDate) {
      const bd = new Date(form.birthDate);
      const today = new Date();
      if (bd > today) errors.birthDate = 'La date de naissance ne peut pas être dans le futur';
    }
    setFieldErrors(errors);
    if (hasErrors(errors)) return;

    setIsCreating(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`;

      const response = await fetch(`${apiBase}/users/create-patient`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName,
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          gender: form.gender,
          birthDate: form.birthDate || undefined,
          birthPlace: form.birthPlace === 'france' ? form.birthCity : `Étranger - ${form.birthCity}`,
          birthName: form.birthName.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Erreur lors de la création');
      }

      onCreated();
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la création du patient');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3 px-5 py-4 border-b">
          <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
            <UserPlus className="h-5 w-5 text-teal-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            Ajouter un nouveau patient
          </h2>
          <button
            onClick={onClose}
            className="ml-auto text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Genre</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={form.gender === 'male'}
                  onChange={() => setForm({ ...form, gender: 'male' })}
                  className="w-4 h-4 text-teal-600"
                />
                <span className="text-sm text-gray-700">Homme</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={form.gender === 'female'}
                  onChange={() => setForm({ ...form, gender: 'female' })}
                  className="w-4 h-4 text-teal-600"
                />
                <span className="text-sm text-gray-700">Femme</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom *</label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => setField('lastName', e.target.value)}
                placeholder="Nom"
                required
                maxLength={80}
                className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50 ${fieldErrors.lastName ? 'border-red-400' : 'border-gray-200'}`}
              />
              {fieldErrors.lastName && <p className="text-xs text-red-500 mt-1">{fieldErrors.lastName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Prénom *</label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => setField('firstName', e.target.value)}
                placeholder="Prénom"
                required
                maxLength={80}
                className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50 ${fieldErrors.firstName ? 'border-red-400' : 'border-gray-200'}`}
              />
              {fieldErrors.firstName && <p className="text-xs text-red-500 mt-1">{fieldErrors.firstName}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date de naissance</label>
              <input
                type="date"
                value={form.birthDate}
                onChange={(e) => setField('birthDate', e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50 ${fieldErrors.birthDate ? 'border-red-400' : 'border-gray-200'}`}
              />
              {fieldErrors.birthDate && <p className="text-xs text-red-500 mt-1">{fieldErrors.birthDate}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Lieu de naissance</label>
              <select
                value={form.birthPlace}
                onChange={(e) => setForm({ ...form, birthPlace: e.target.value as 'france' | 'abroad' })}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50"
              >
                <option value="france">Né(e) en France</option>
                <option value="abroad">Né(e) à l'étranger</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Téléphone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setField('phone', e.target.value)}
                placeholder="06 12 34 56 78"
                maxLength={20}
                className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50 ${fieldErrors.phone ? 'border-red-400' : 'border-gray-200'}`}
              />
              {fieldErrors.phone && <p className="text-xs text-red-500 mt-1">{fieldErrors.phone}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                placeholder="email@exemple.fr"
                required
                maxLength={100}
                className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50 ${fieldErrors.email ? 'border-red-400' : 'border-gray-200'}`}
              />
              {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={isCreating}
              className="px-5 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isCreating ? 'Création...' : 'Ajouter le patient'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Modal Nouveau RDV
function NewRdvModal({
  apiBase,
  patient,
  onClose,
  onCreated,
}: {
  apiBase: string;
  patient: Patient;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [appointmentKinds, setAppointmentKinds] = useState<AppointmentKind[]>([]);
  const [selectedKindId, setSelectedKindId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAppointmentKinds();
  }, []);

  const fetchAppointmentKinds = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiBase}/appointment-kinds`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAppointmentKinds(Array.isArray(data) ? data : data?.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch appointment kinds:', error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedKindId) {
      setError('Veuillez sélectionner un type de consultation');
      return;
    }
    if (!selectedDate || !selectedTime) {
      setError('Veuillez sélectionner une date et une heure');
      return;
    }

    const slotStart = new Date(`${selectedDate}T${selectedTime}`);
    const selectedKind = appointmentKinds.find((k) => k.id === selectedKindId);
    const duration = selectedKind?.duration || 30;
    const slotEnd = new Date(slotStart.getTime() + duration * 60000);

    if (slotStart < new Date()) {
      setError('La date ne peut pas être dans le passé');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiBase}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patientId: patient.id,
          kindId: selectedKindId,
          slotStart: slotStart.toISOString(),
          slotEnd: slotEnd.toISOString(),
          notes: notes || undefined,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Erreur lors de la création');
      }

      onCreated();
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la création du rendez-vous');
    } finally {
      setIsCreating(false);
    }
  };

  // Générer la date minimale (aujourd'hui)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center gap-3 px-5 py-4 border-b">
          <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
            <Calendar className="h-5 w-5 text-teal-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Nouveau rendez-vous</h2>
            <p className="text-sm text-gray-500">{patient.fullName}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Type de consultation *
            </label>
            <select
              value={selectedKindId}
              onChange={(e) => setSelectedKindId(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50"
            >
              <option value="">Sélectionner</option>
              {appointmentKinds.map((kind) => (
                <option key={kind.id} value={kind.id}>
                  {kind.name} {kind.duration ? `(${kind.duration}min)` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date *</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={today}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Heure *</label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes (optionnel)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Motif de la consultation..."
              rows={3}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50 resize-none"
            />
          </div>

          <div className="pt-4 border-t flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={isCreating}
              className="px-5 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isCreating ? 'Création...' : 'Créer le RDV'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Modal Nouvelle Note
function NewNoteModal({
  apiBase,
  patient,
  onClose,
  onCreated,
}: {
  apiBase: string;
  patient: Patient;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError('Veuillez saisir le contenu de la note');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiBase}/medical-notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patientId: patient.id,
          title: title.trim() || 'Note de consultation',
          content: content.trim(),
          tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Erreur lors de la création');
      }

      onCreated();
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la création de la note');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center gap-3 px-5 py-4 border-b">
          <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
            <FileText className="h-5 w-5 text-teal-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Nouvelle note</h2>
            <p className="text-sm text-gray-500">{patient.fullName}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Titre (optionnel)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Consultation du jour"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Contenu *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Saisissez votre note..."
              rows={5}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tags (séparés par des virgules)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Ex: suivi, diabète, tension"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50"
            />
          </div>

          <div className="pt-4 border-t flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={isCreating}
              className="px-5 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isCreating ? 'Enregistrement...' : 'Enregistrer la note'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
