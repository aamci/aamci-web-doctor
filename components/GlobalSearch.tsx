'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  User,
  Calendar,
  Pill,
  FileText,
  Clock,
  ArrowRight,
  Command,
  History,
  Filter,
  Bookmark,
  Trash2,
  ChevronRight,
  Loader2,
  Phone,
  Mail,
  CalendarCheck,
  AlertCircle,
} from 'lucide-react';

// Types
interface SearchResult {
  id: string;
  type: 'patient' | 'appointment' | 'prescription';
  title: string;
  subtitle: string;
  meta?: string;
  status?: string;
  avatar?: string | null;
  data: any;
}

interface SavedFilter {
  id: string;
  name: string;
  filters: FilterState;
  createdAt: string;
}

interface FilterState {
  entityTypes: ('patient' | 'appointment' | 'prescription')[];
  dateRange: 'all' | 'today' | 'week' | 'month' | 'custom';
  customDateStart?: string;
  customDateEnd?: string;
  status?: string[];
  gender?: string;
}

interface GlobalSearchProps {
  isOpen?: boolean;
  onClose?: () => void;
  standalone?: boolean;
}

const STORAGE_KEY_HISTORY = 'globalSearchHistory';
const STORAGE_KEY_FILTERS = 'globalSearchSavedFilters';
const MAX_HISTORY_ITEMS = 10;

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

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res;
}

export default function GlobalSearch({ isOpen = false, onClose, standalone = false }: GlobalSearchProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // State
  const [query, setQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(isOpen);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showFilters, setShowFilters] = useState(false);
  const [showSaveFilter, setShowSaveFilter] = useState(false);
  const [filterName, setFilterName] = useState('');

  // Data caches
  const [patients, setPatients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // History and saved filters
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);

  // Filters
  const [filters, setFilters] = useState<FilterState>({
    entityTypes: ['patient', 'appointment', 'prescription'],
    dateRange: 'all',
  });

  // Load history and saved filters from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const history = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (history) {
      try {
        setSearchHistory(JSON.parse(history));
      } catch {}
    }

    const filters = localStorage.getItem(STORAGE_KEY_FILTERS);
    if (filters) {
      try {
        setSavedFilters(JSON.parse(filters));
      } catch {}
    }
  }, []);

  // Sync isOpen prop
  useEffect(() => {
    setIsSearchOpen(isOpen);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Keyboard shortcut to open search (Cmd/Ctrl + K)
  useEffect(() => {
    if (standalone) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape' && isSearchOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, standalone]);

  // Fetch all data when search opens
  useEffect(() => {
    if (isSearchOpen && !dataLoaded) {
      fetchAllData();
    }
  }, [isSearchOpen, dataLoaded]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [patientsRes, appointmentsRes, prescriptionsRes] = await Promise.all([
        authedFetch('/patients'),
        authedFetch('/appointments'),
        authedFetch('/prescriptions').catch(() => ({ json: () => [] })),
      ]);

      const patientsData = await patientsRes.json();
      const appointmentsData = await appointmentsRes.json();
      const prescriptionsData = await prescriptionsRes.json();

      setPatients(Array.isArray(patientsData) ? patientsData : patientsData?.data || []);
      setAppointments(Array.isArray(appointmentsData) ? appointmentsData : appointmentsData?.data || []);
      setPrescriptions(Array.isArray(prescriptionsData) ? prescriptionsData : prescriptionsData?.data || []);
      setDataLoaded(true);
    } catch (e) {
      console.error('Error loading search data:', e);
    } finally {
      setLoading(false);
    }
  };

  // Search logic
  const searchResults = useMemo((): SearchResult[] => {
    if (!query.trim() && !showFilters) return [];

    const q = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    // Search patients
    if (filters.entityTypes.includes('patient')) {
      patients.forEach((p) => {
        const matches =
          !q ||
          p.fullName?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q) ||
          p.phone?.includes(q);

        if (matches) {
          // Apply gender filter
          if (filters.gender && filters.gender !== 'all' && p.sex !== filters.gender) {
            return;
          }

          results.push({
            id: p.id,
            type: 'patient',
            title: p.fullName || p.email,
            subtitle: p.email,
            meta: p.phone || undefined,
            avatar: p.avatarUrl,
            data: p,
          });
        }
      });
    }

    // Search appointments
    if (filters.entityTypes.includes('appointment')) {
      appointments.forEach((a) => {
        const matches =
          !q ||
          a.patient?.fullName?.toLowerCase().includes(q) ||
          a.patient?.email?.toLowerCase().includes(q) ||
          a.kind?.name?.toLowerCase().includes(q) ||
          a.type?.toLowerCase().includes(q);

        if (matches) {
          // Apply date filter
          if (filters.dateRange !== 'all' && a.slot?.start) {
            const appointmentDate = new Date(a.slot.start);
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            if (filters.dateRange === 'today') {
              const tomorrow = new Date(today);
              tomorrow.setDate(tomorrow.getDate() + 1);
              if (appointmentDate < today || appointmentDate >= tomorrow) return;
            } else if (filters.dateRange === 'week') {
              const weekEnd = new Date(today);
              weekEnd.setDate(weekEnd.getDate() + 7);
              if (appointmentDate < today || appointmentDate >= weekEnd) return;
            } else if (filters.dateRange === 'month') {
              const monthEnd = new Date(today);
              monthEnd.setMonth(monthEnd.getMonth() + 1);
              if (appointmentDate < today || appointmentDate >= monthEnd) return;
            } else if (filters.dateRange === 'custom') {
              if (filters.customDateStart && appointmentDate < new Date(filters.customDateStart)) return;
              if (filters.customDateEnd && appointmentDate > new Date(filters.customDateEnd)) return;
            }
          }

          // Apply status filter
          if (filters.status?.length && !filters.status.includes(a.status)) {
            return;
          }

          const date = a.slot?.start
            ? new Date(a.slot.start).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : '';

          results.push({
            id: a.id,
            type: 'appointment',
            title: a.patient?.fullName || 'Patient',
            subtitle: a.kind?.name || a.type || 'Consultation',
            meta: date,
            status: a.status,
            avatar: a.patient?.avatarUrl,
            data: a,
          });
        }
      });
    }

    // Search prescriptions
    if (filters.entityTypes.includes('prescription')) {
      prescriptions.forEach((p) => {
        const matches =
          !q ||
          p.patient?.fullName?.toLowerCase().includes(q) ||
          p.diagnosis?.toLowerCase().includes(q) ||
          p.medications?.some((m: any) => m.name?.toLowerCase().includes(q));

        if (matches) {
          // Apply date filter
          if (filters.dateRange !== 'all' && p.createdAt) {
            const prescriptionDate = new Date(p.createdAt);
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            if (filters.dateRange === 'today') {
              const tomorrow = new Date(today);
              tomorrow.setDate(tomorrow.getDate() + 1);
              if (prescriptionDate < today || prescriptionDate >= tomorrow) return;
            } else if (filters.dateRange === 'week') {
              const weekStart = new Date(today);
              weekStart.setDate(weekStart.getDate() - 7);
              if (prescriptionDate < weekStart) return;
            } else if (filters.dateRange === 'month') {
              const monthStart = new Date(today);
              monthStart.setMonth(monthStart.getMonth() - 1);
              if (prescriptionDate < monthStart) return;
            }
          }

          const medCount = p.medications?.length || 0;
          const date = p.createdAt
            ? new Date(p.createdAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : '';

          results.push({
            id: p.id,
            type: 'prescription',
            title: p.patient?.fullName || 'Patient',
            subtitle: p.diagnosis || `${medCount} médicament${medCount > 1 ? 's' : ''}`,
            meta: date,
            status: p.status,
            data: p,
          });
        }
      });
    }

    // Limit results
    return results.slice(0, 20);
  }, [query, patients, appointments, prescriptions, filters, showFilters]);

  // Update results
  useEffect(() => {
    setResults(searchResults);
    setSelectedIndex(-1);
  }, [searchResults]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleResultClick(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsSearchOpen(false);
    setQuery('');
    setResults([]);
    setSelectedIndex(-1);
    setShowFilters(false);
    onClose?.();
  };

  const handleResultClick = (result: SearchResult) => {
    // Save to history
    if (query.trim()) {
      const newHistory = [query, ...searchHistory.filter((h) => h !== query)].slice(0, MAX_HISTORY_ITEMS);
      setSearchHistory(newHistory);
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(newHistory));
    }

    // Navigate
    if (result.type === 'patient') {
      router.push(`/patients/${result.id}`);
    } else if (result.type === 'appointment') {
      router.push('/reservations');
    } else if (result.type === 'prescription') {
      router.push('/prescriptions');
    }

    handleClose();
  };

  const handleHistoryClick = (term: string) => {
    setQuery(term);
    inputRef.current?.focus();
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem(STORAGE_KEY_HISTORY);
  };

  const saveCurrentFilter = () => {
    if (!filterName.trim()) return;

    const newFilter: SavedFilter = {
      id: `filter-${Date.now()}`,
      name: filterName.trim(),
      filters: { ...filters },
      createdAt: new Date().toISOString(),
    };

    const newSavedFilters = [...savedFilters, newFilter];
    setSavedFilters(newSavedFilters);
    localStorage.setItem(STORAGE_KEY_FILTERS, JSON.stringify(newSavedFilters));
    setFilterName('');
    setShowSaveFilter(false);
  };

  const loadSavedFilter = (filter: SavedFilter) => {
    setFilters(filter.filters);
    setShowFilters(true);
  };

  const deleteSavedFilter = (filterId: string) => {
    const newSavedFilters = savedFilters.filter((f) => f.id !== filterId);
    setSavedFilters(newSavedFilters);
    localStorage.setItem(STORAGE_KEY_FILTERS, JSON.stringify(newSavedFilters));
  };

  const resetFilters = () => {
    setFilters({
      entityTypes: ['patient', 'appointment', 'prescription'],
      dateRange: 'all',
    });
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'PENDING':
      case 'DRAFT':
        return 'bg-amber-100 text-amber-700';
      case 'CONFIRMED':
      case 'ACTIVE':
        return 'bg-green-100 text-green-700';
      case 'CANCELLED':
      case 'EXPIRED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'PENDING':
        return 'En attente';
      case 'CONFIRMED':
        return 'Confirmé';
      case 'CANCELLED':
        return 'Annulé';
      case 'DRAFT':
        return 'Brouillon';
      case 'ACTIVE':
        return 'Active';
      case 'EXPIRED':
        return 'Expirée';
      default:
        return status;
    }
  };

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'patient':
        return <User className="w-4 h-4" />;
      case 'appointment':
        return <Calendar className="w-4 h-4" />;
      case 'prescription':
        return <Pill className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'patient':
        return 'bg-blue-100 text-blue-600';
      case 'appointment':
        return 'bg-teal-100 text-teal-600';
      case 'prescription':
        return 'bg-amber-100 text-amber-600';
    }
  };

  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'patient':
        return 'Patient';
      case 'appointment':
        return 'RDV';
      case 'prescription':
        return 'Prescription';
    }
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.entityTypes.length < 3) count++;
    if (filters.dateRange !== 'all') count++;
    if (filters.status?.length) count++;
    if (filters.gender && filters.gender !== 'all') count++;
    return count;
  }, [filters]);

  // Standalone mode (inline search bar)
  if (standalone) {
    return (
      <div className="relative" ref={containerRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsSearchOpen(true)}
            placeholder="Rechercher patients, RDV, prescriptions..."
            className="w-full pl-10 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                <X className="w-3 h-3 text-gray-400" />
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-1 rounded transition-colors ${
                showFilters || activeFilterCount > 0
                  ? 'bg-teal-100 text-teal-600'
                  : 'hover:bg-gray-200 text-gray-400'
              }`}
            >
              <Filter className="w-4 h-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-teal-600 text-white text-xs rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Results dropdown */}
        {isSearchOpen && (query || showFilters) && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-xl z-50 max-h-[500px] overflow-hidden">
            {/* Filters Panel */}
            {showFilters && (
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">Filtres avancés</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={resetFilters}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Réinitialiser
                    </button>
                    <button
                      onClick={() => setShowSaveFilter(true)}
                      className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                    >
                      Sauvegarder
                    </button>
                  </div>
                </div>

                {/* Entity Type Filter */}
                <div className="mb-3">
                  <label className="text-xs text-gray-500 mb-1.5 block">Type</label>
                  <div className="flex gap-2">
                    {(['patient', 'appointment', 'prescription'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          const types = filters.entityTypes.includes(type)
                            ? filters.entityTypes.filter((t) => t !== type)
                            : [...filters.entityTypes, type];
                          setFilters({ ...filters, entityTypes: types.length ? types : [type] });
                        }}
                        className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                          filters.entityTypes.includes(type)
                            ? 'bg-teal-600 text-white'
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {getTypeLabel(type)}s
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Filter */}
                <div className="mb-3">
                  <label className="text-xs text-gray-500 mb-1.5 block">Période</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'all', label: 'Toutes' },
                      { value: 'today', label: "Aujourd'hui" },
                      { value: 'week', label: 'Cette semaine' },
                      { value: 'month', label: 'Ce mois' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setFilters({ ...filters, dateRange: option.value as FilterState['dateRange'] })}
                        className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                          filters.dateRange === option.value
                            ? 'bg-teal-600 text-white'
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Filter */}
                {filters.entityTypes.includes('appointment') && (
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">Statut RDV</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 'PENDING', label: 'En attente' },
                        { value: 'CONFIRMED', label: 'Confirmé' },
                        { value: 'CANCELLED', label: 'Annulé' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            const status = filters.status?.includes(option.value)
                              ? filters.status.filter((s) => s !== option.value)
                              : [...(filters.status || []), option.value];
                            setFilters({ ...filters, status: status.length ? status : undefined });
                          }}
                          className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                            filters.status?.includes(option.value)
                              ? 'bg-teal-600 text-white'
                              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Saved Filters */}
                {savedFilters.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <label className="text-xs text-gray-500 mb-1.5 block">Filtres sauvegardés</label>
                    <div className="flex flex-wrap gap-2">
                      {savedFilters.map((filter) => (
                        <div
                          key={filter.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg"
                        >
                          <button
                            onClick={() => loadSavedFilter(filter)}
                            className="text-xs text-gray-700 hover:text-teal-600"
                          >
                            <Bookmark className="w-3 h-3 inline mr-1" />
                            {filter.name}
                          </button>
                          <button
                            onClick={() => deleteSavedFilter(filter.id)}
                            className="p-0.5 text-gray-400 hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Save Filter Modal */}
                {showSaveFilter && (
                  <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg">
                    <input
                      type="text"
                      value={filterName}
                      onChange={(e) => setFilterName(e.target.value)}
                      placeholder="Nom du filtre..."
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg mb-2"
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setShowSaveFilter(false)}
                        className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={saveCurrentFilter}
                        className="px-3 py-1.5 text-xs bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                      >
                        Sauvegarder
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Results */}
            <div className="max-h-[350px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 text-teal-500 animate-spin mx-auto" />
                  <p className="text-sm text-gray-500 mt-2">Chargement...</p>
                </div>
              ) : results.length > 0 ? (
                <div className="py-2">
                  {results.map((result, index) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleResultClick(result)}
                      className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left ${
                        index === selectedIndex ? 'bg-gray-50' : ''
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getTypeColor(result.type)}`}>
                        {getTypeIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">{result.title}</p>
                          {result.status && (
                            <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(result.status)}`}>
                              {getStatusLabel(result.status)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{result.subtitle}</p>
                        {result.meta && (
                          <p className="text-xs text-gray-400">{result.meta}</p>
                        )}
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-lg ${getTypeColor(result.type)}`}>
                        {getTypeLabel(result.type)}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                  ))}
                </div>
              ) : query ? (
                <div className="p-8 text-center">
                  <Search className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Aucun résultat pour "{query}"</p>
                  <p className="text-xs text-gray-400 mt-1">Essayez avec d'autres termes</p>
                </div>
              ) : (
                <>
                  {/* Recent Searches */}
                  {searchHistory.length > 0 && (
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <History className="w-3.5 h-3.5" />
                          Recherches récentes
                        </div>
                        <button
                          onClick={clearHistory}
                          className="text-xs text-gray-400 hover:text-red-500"
                        >
                          Effacer
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {searchHistory.map((term, i) => (
                          <button
                            key={i}
                            onClick={() => handleHistoryClick(term)}
                            className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Access */}
                  <div className="p-4">
                    <p className="text-xs text-gray-500 mb-2">Accès rapide</p>
                    <div className="space-y-1">
                      <button
                        onClick={() => { router.push('/patients'); handleClose(); }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <User className="w-4 h-4 text-blue-500" />
                        Tous les patients
                        <span className="ml-auto text-xs text-gray-400">{patients.length}</span>
                      </button>
                      <button
                        onClick={() => { router.push('/reservations'); handleClose(); }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <Calendar className="w-4 h-4 text-teal-500" />
                        Tous les RDV
                        <span className="ml-auto text-xs text-gray-400">{appointments.length}</span>
                      </button>
                      <button
                        onClick={() => { router.push('/prescriptions'); handleClose(); }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <Pill className="w-4 h-4 text-amber-500" />
                        Toutes les prescriptions
                        <span className="ml-auto text-xs text-gray-400">{prescriptions.length}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <span>
                  <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs">↑↓</kbd> naviguer
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs">↵</kbd> sélectionner
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs">esc</kbd> fermer
                </span>
              </div>
              {results.length > 0 && (
                <span>{results.length} résultat{results.length > 1 ? 's' : ''}</span>
              )}
            </div>
          </div>
        )}

        {/* Click outside to close */}
        {isSearchOpen && (query || showFilters) && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setIsSearchOpen(false);
              setShowFilters(false);
            }}
          />
        )}
      </div>
    );
  }

  // Modal mode (Cmd+K)
  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-black/50">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden" ref={containerRef}>
        {/* Search Input */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Rechercher patients, rendez-vous, prescriptions..."
              className="w-full pl-12 pr-20 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-teal-500 text-base"
              autoFocus
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {query && (
                <button onClick={() => setQuery('')} className="p-1 hover:bg-gray-200 rounded">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-1.5 rounded-lg transition-colors ${
                  showFilters || activeFilterCount > 0 ? 'bg-teal-100 text-teal-600' : 'hover:bg-gray-200 text-gray-400'
                }`}
              >
                <Filter className="w-4 h-4" />
              </button>
              <button onClick={handleClose} className="p-1 hover:bg-gray-200 rounded">
                <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-xs text-gray-500">esc</kbd>
              </button>
            </div>
          </div>
        </div>

        {/* Content area - same as standalone dropdown content */}
        <div className="max-h-[60vh] overflow-y-auto">
          {showFilters && (
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              {/* Same filter content as standalone */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Filtres avancés</h3>
                <button onClick={resetFilters} className="text-xs text-gray-500 hover:text-gray-700">
                  Réinitialiser
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Type</label>
                  <div className="flex flex-col gap-1">
                    {(['patient', 'appointment', 'prescription'] as const).map((type) => (
                      <label key={type} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.entityTypes.includes(type)}
                          onChange={() => {
                            const types = filters.entityTypes.includes(type)
                              ? filters.entityTypes.filter((t) => t !== type)
                              : [...filters.entityTypes, type];
                            setFilters({ ...filters, entityTypes: types.length ? types : [type] });
                          }}
                          className="w-4 h-4 text-teal-600 rounded"
                        />
                        <span className="text-sm text-gray-700">{getTypeLabel(type)}s</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Période</label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters({ ...filters, dateRange: e.target.value as FilterState['dateRange'] })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                  >
                    <option value="all">Toutes les dates</option>
                    <option value="today">Aujourd'hui</option>
                    <option value="week">Cette semaine</option>
                    <option value="month">Ce mois</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Statut RDV</label>
                  <select
                    value={filters.status?.[0] || 'all'}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value === 'all' ? undefined : [e.target.value] })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="PENDING">En attente</option>
                    <option value="CONFIRMED">Confirmé</option>
                    <option value="CANCELLED">Annulé</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 text-teal-500 animate-spin mx-auto" />
              <p className="text-sm text-gray-500 mt-3">Chargement des données...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  className={`w-full px-4 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left ${
                    index === selectedIndex ? 'bg-teal-50' : ''
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getTypeColor(result.type)}`}>
                    {getTypeIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{result.title}</p>
                      {result.status && (
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(result.status)}`}>
                          {getStatusLabel(result.status)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{result.subtitle}</p>
                    {result.meta && <p className="text-xs text-gray-400 mt-0.5">{result.meta}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-lg ${getTypeColor(result.type)}`}>
                      {getTypeLabel(result.type)}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </button>
              ))}
            </div>
          ) : query ? (
            <div className="p-12 text-center">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Aucun résultat pour "{query}"</p>
              <p className="text-sm text-gray-400 mt-1">Essayez avec d'autres termes de recherche</p>
            </div>
          ) : (
            <div className="py-4">
              {searchHistory.length > 0 && (
                <div className="px-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5" /> Recherches récentes
                    </span>
                    <button onClick={clearHistory} className="text-xs text-gray-400 hover:text-red-500">
                      Effacer
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {searchHistory.map((term, i) => (
                      <button
                        key={i}
                        onClick={() => handleHistoryClick(term)}
                        className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="px-4">
                <p className="text-xs font-medium text-gray-500 mb-2">Accès rapide</p>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => { router.push('/patients'); handleClose(); }}
                    className="flex flex-col items-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                  >
                    <User className="w-6 h-6 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">Patients</span>
                    <span className="text-xs text-blue-500">{patients.length}</span>
                  </button>
                  <button
                    onClick={() => { router.push('/reservations'); handleClose(); }}
                    className="flex flex-col items-center gap-2 p-4 bg-teal-50 hover:bg-teal-100 rounded-xl transition-colors"
                  >
                    <Calendar className="w-6 h-6 text-teal-600" />
                    <span className="text-sm font-medium text-teal-700">Rendez-vous</span>
                    <span className="text-xs text-teal-500">{appointments.length}</span>
                  </button>
                  <button
                    onClick={() => { router.push('/prescriptions'); handleClose(); }}
                    className="flex flex-col items-center gap-2 p-4 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors"
                  >
                    <Pill className="w-6 h-6 text-amber-600" />
                    <span className="text-sm font-medium text-amber-700">Prescriptions</span>
                    <span className="text-xs text-amber-500">{prescriptions.length}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span><kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded">↑↓</kbd> naviguer</span>
            <span><kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded">↵</kbd> sélectionner</span>
            <span><kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded">⌘K</kbd> ouvrir</span>
          </div>
          {results.length > 0 && (
            <span className="text-xs text-gray-500">{results.length} résultat{results.length > 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      {/* Click outside to close */}
      <div className="absolute inset-0 -z-10" onClick={handleClose} />
    </div>
  );
}
