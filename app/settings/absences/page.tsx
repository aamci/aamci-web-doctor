'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
  AlertCircle,
  Loader2,
  CalendarOff,
  Sun,
  Plane,
  Clock,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';

interface Absence {
  id: string;
  type: 'vacation' | 'holiday' | 'personal' | 'training';
  title: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  startTime?: string;
  endTime?: string;
  recurring: boolean;
  notes?: string;
}

interface BlockedTime {
  id: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string;
  endTime: string;
  reason: string;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 0, label: 'Dimanche' },
];

const ABSENCE_TYPES = [
  { value: 'vacation', label: 'Congés', icon: Plane, color: 'bg-blue-100 text-blue-700' },
  { value: 'holiday', label: 'Jour férié', icon: Sun, color: 'bg-amber-100 text-amber-700' },
  { value: 'personal', label: 'Personnel', icon: Calendar, color: 'bg-purple-100 text-purple-700' },
  { value: 'training', label: 'Formation', icon: Clock, color: 'bg-green-100 text-green-700' },
];

const FRENCH_HOLIDAYS_2026 = [
  { date: '2026-01-01', name: 'Jour de l\'An' },
  { date: '2026-04-06', name: 'Lundi de Pâques' },
  { date: '2026-05-01', name: 'Fête du Travail' },
  { date: '2026-05-08', name: 'Victoire 1945' },
  { date: '2026-05-14', name: 'Ascension' },
  { date: '2026-05-25', name: 'Lundi de Pentecôte' },
  { date: '2026-07-14', name: 'Fête Nationale' },
  { date: '2026-08-15', name: 'Assomption' },
  { date: '2026-11-01', name: 'Toussaint' },
  { date: '2026-11-11', name: 'Armistice' },
  { date: '2026-12-25', name: 'Noël' },
];

export default function AbsencesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [activeTab, setActiveTab] = useState<'absences' | 'blocked' | 'holidays'>('absences');

  // Modal states
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [editingAbsence, setEditingAbsence] = useState<Absence | null>(null);
  const [editingBlocked, setEditingBlocked] = useState<BlockedTime | null>(null);

  // Form states
  const [absenceForm, setAbsenceForm] = useState({
    type: 'vacation' as Absence['type'],
    title: '',
    startDate: '',
    endDate: '',
    allDay: true,
    startTime: '09:00',
    endTime: '18:00',
    recurring: false,
    notes: '',
  });

  const [blockedForm, setBlockedForm] = useState({
    dayOfWeek: 1,
    startTime: '12:00',
    endTime: '14:00',
    reason: 'Pause déjeuner',
  });

  const [selectedHolidays, setSelectedHolidays] = useState<string[]>([]);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

  const typeToApi = (t: string) => {
    const map: Record<string, string> = { vacation: 'VACATION', holiday: 'OTHER', personal: 'PERSONAL', training: 'TRAINING' };
    return map[t] || 'OTHER';
  };

  const typeFromApi = (t: string): Absence['type'] => {
    const map: Record<string, Absence['type']> = { VACATION: 'vacation', PERSONAL: 'personal', TRAINING: 'training', OTHER: 'holiday' };
    return map[t] || 'personal';
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`${apiBaseUrl}/doctor-absences/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setAbsences((data || []).map((a: any) => ({
          id: a.id,
          type: typeFromApi(a.type),
          title: a.reason || a.type || 'Absence',
          startDate: a.startDate?.split('T')[0] || '',
          endDate: a.endDate?.split('T')[0] || '',
          allDay: !a.startTime,
          startTime: a.startTime,
          endTime: a.endTime,
          recurring: false,
          notes: a.reason,
        })));
      }
    } catch (error) {
      console.error('Error loading absences:', error);
    }

    // Blocked times + holidays stay in localStorage (no API endpoint)
    const savedBlocked = localStorage.getItem('doctorBlockedTimes');
    const savedHolidays = localStorage.getItem('doctorSelectedHolidays');

    if (savedBlocked) {
      try { setBlockedTimes(JSON.parse(savedBlocked)); } catch { /* ignore */ }
    }
    if (savedHolidays) {
      try { setSelectedHolidays(JSON.parse(savedHolidays)); } catch { /* ignore */ }
    } else {
      setSelectedHolidays(FRENCH_HOLIDAYS_2026.map(h => h.date));
    }

    setLoading(false);
  }, [apiBaseUrl]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveAbsences = useCallback((newAbsences: Absence[]) => {
    setAbsences(newAbsences);
  }, []);

  const saveBlockedTimes = useCallback((newBlocked: BlockedTime[]) => {
    setBlockedTimes(newBlocked);
    localStorage.setItem('doctorBlockedTimes', JSON.stringify(newBlocked));
  }, []);

  const saveSelectedHolidays = useCallback((holidays: string[]) => {
    setSelectedHolidays(holidays);
    localStorage.setItem('doctorSelectedHolidays', JSON.stringify(holidays));
  }, []);

  const handleAddAbsence = () => {
    setEditingAbsence(null);
    setAbsenceForm({
      type: 'vacation',
      title: '',
      startDate: '',
      endDate: '',
      allDay: true,
      startTime: '09:00',
      endTime: '18:00',
      recurring: false,
      notes: '',
    });
    setShowAbsenceModal(true);
  };

  const handleEditAbsence = (absence: Absence) => {
    setEditingAbsence(absence);
    setAbsenceForm({
      type: absence.type,
      title: absence.title,
      startDate: absence.startDate,
      endDate: absence.endDate,
      allDay: absence.allDay,
      startTime: absence.startTime || '09:00',
      endTime: absence.endTime || '18:00',
      recurring: absence.recurring,
      notes: absence.notes || '',
    });
    setShowAbsenceModal(true);
  };

  const handleSaveAbsence = async () => {
    if (!absenceForm.startDate || !absenceForm.endDate) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const title = absenceForm.title || ABSENCE_TYPES.find(t => t.value === absenceForm.type)?.label || 'Absence';
    const apiBody = {
      startDate: absenceForm.startDate,
      endDate: absenceForm.endDate,
      type: typeToApi(absenceForm.type),
      reason: title + (absenceForm.notes ? ` - ${absenceForm.notes}` : ''),
      blockSlots: true,
    };

    try {
      if (editingAbsence) {
        const res = await fetch(`${apiBaseUrl}/doctor-absences/${editingAbsence.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(apiBody),
        });
        if (res.ok) {
          await loadData();
        }
      } else {
        const res = await fetch(`${apiBaseUrl}/doctor-absences`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(apiBody),
        });
        if (res.ok) {
          await loadData();
        }
      }
    } catch (error) {
      console.error('Error saving absence:', error);
    }

    setShowAbsenceModal(false);
  };

  const handleDeleteAbsence = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${apiBaseUrl}/doctor-absences/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setAbsences(prev => prev.filter(a => a.id !== id));
      }
    } catch (error) {
      console.error('Error deleting absence:', error);
    }
  };

  const handleAddBlocked = () => {
    setEditingBlocked(null);
    setBlockedForm({
      dayOfWeek: 1,
      startTime: '12:00',
      endTime: '14:00',
      reason: 'Pause déjeuner',
    });
    setShowBlockedModal(true);
  };

  const handleEditBlocked = (blocked: BlockedTime) => {
    setEditingBlocked(blocked);
    setBlockedForm({
      dayOfWeek: blocked.dayOfWeek,
      startTime: blocked.startTime,
      endTime: blocked.endTime,
      reason: blocked.reason,
    });
    setShowBlockedModal(true);
  };

  const handleSaveBlocked = () => {
    const blocked: BlockedTime = {
      id: editingBlocked?.id || `block-${Date.now()}`,
      dayOfWeek: blockedForm.dayOfWeek,
      startTime: blockedForm.startTime,
      endTime: blockedForm.endTime,
      reason: blockedForm.reason,
    };

    if (editingBlocked) {
      saveBlockedTimes(blockedTimes.map(b => b.id === editingBlocked.id ? blocked : b));
    } else {
      saveBlockedTimes([...blockedTimes, blocked]);
    }

    setShowBlockedModal(false);
  };

  const handleDeleteBlocked = (id: string) => {
    saveBlockedTimes(blockedTimes.filter(b => b.id !== id));
  };

  const toggleHoliday = (date: string) => {
    if (selectedHolidays.includes(date)) {
      saveSelectedHolidays(selectedHolidays.filter(d => d !== date));
    } else {
      saveSelectedHolidays([...selectedHolidays, date]);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getAbsenceTypeInfo = (type: Absence['type']) => {
    return ABSENCE_TYPES.find(t => t.value === type) || ABSENCE_TYPES[0];
  };

  const upcomingAbsences = absences
    .filter(a => new Date(a.endDate) >= new Date())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const pastAbsences = absences
    .filter(a => new Date(a.endDate) < new Date())
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Absences & Indisponibilités</h1>
                <p className="text-sm text-gray-500">Gérez vos congés, jours fériés et créneaux bloqués</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6">
          <button
            onClick={() => setActiveTab('absences')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'absences' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Plane className="w-4 h-4" />
              Absences ({absences.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('blocked')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'blocked' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <CalendarOff className="w-4 h-4" />
              Créneaux bloqués ({blockedTimes.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('holidays')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'holidays' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Sun className="w-4 h-4" />
              Jours fériés
            </div>
          </button>
        </div>

        {/* Absences Tab */}
        {activeTab === 'absences' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Vos absences</h2>
              <button
                onClick={handleAddAbsence}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Ajouter une absence
              </button>
            </div>

            {upcomingAbsences.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-500">À venir</h3>
                {upcomingAbsences.map((absence) => {
                  const typeInfo = getAbsenceTypeInfo(absence.type);
                  const Icon = typeInfo.icon;
                  return (
                    <div
                      key={absence.id}
                      className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${typeInfo.color}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{absence.title}</h4>
                            <p className="text-sm text-gray-500 mt-0.5">
                              {formatDate(absence.startDate)}
                              {absence.startDate !== absence.endDate && ` → ${formatDate(absence.endDate)}`}
                              {!absence.allDay && ` (${absence.startTime} - ${absence.endTime})`}
                            </p>
                            {absence.notes && (
                              <p className="text-sm text-gray-400 mt-1">{absence.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditAbsence(absence)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAbsence(absence.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {pastAbsences.length > 0 && (
              <div className="space-y-3 mt-6">
                <h3 className="text-sm font-medium text-gray-500">Passées</h3>
                {pastAbsences.slice(0, 5).map((absence) => {
                  const typeInfo = getAbsenceTypeInfo(absence.type);
                  const Icon = typeInfo.icon;
                  return (
                    <div
                      key={absence.id}
                      className="bg-gray-50 rounded-xl border border-gray-100 p-4 opacity-60"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg bg-gray-200 text-gray-500`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-700">{absence.title}</h4>
                            <p className="text-sm text-gray-400 mt-0.5">
                              {formatDate(absence.startDate)}
                              {absence.startDate !== absence.endDate && ` → ${formatDate(absence.endDate)}`}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteAbsence(absence.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {absences.length === 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <Plane className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Aucune absence planifiée</p>
                <p className="text-sm text-gray-400 mt-1">Ajoutez vos congés pour bloquer les prises de rendez-vous</p>
              </div>
            )}
          </div>
        )}

        {/* Blocked Times Tab */}
        {activeTab === 'blocked' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">Créneaux bloqués récurrents</h2>
                <p className="text-sm text-gray-500">Ces créneaux sont indisponibles chaque semaine</p>
              </div>
              <button
                onClick={handleAddBlocked}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                Les créneaux bloqués permettent de réserver du temps récurrent (pause déjeuner, tâches administratives, etc.)
              </p>
            </div>

            {blockedTimes.length > 0 ? (
              <div className="space-y-3">
                {DAYS_OF_WEEK.map((day) => {
                  const dayBlocked = blockedTimes.filter(b => b.dayOfWeek === day.value);
                  if (dayBlocked.length === 0) return null;

                  return (
                    <div key={day.value} className="bg-white rounded-xl border border-gray-200 p-4">
                      <h4 className="font-medium text-gray-900 mb-3">{day.label}</h4>
                      <div className="space-y-2">
                        {dayBlocked.map((blocked) => (
                          <div
                            key={blocked.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-700">
                                {blocked.startTime} - {blocked.endTime}
                              </span>
                              <span className="text-sm text-gray-500">{blocked.reason}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditBlocked(blocked)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteBlocked(blocked.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <CalendarOff className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Aucun créneau bloqué</p>
                <p className="text-sm text-gray-400 mt-1">Ajoutez des créneaux récurrents (pause déjeuner, etc.)</p>
              </div>
            )}
          </div>
        )}

        {/* Holidays Tab */}
        {activeTab === 'holidays' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">Jours fériés 2026</h2>
                <p className="text-sm text-gray-500">Sélectionnez les jours fériés où vous ne travaillez pas</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => saveSelectedHolidays(FRENCH_HOLIDAYS_2026.map(h => h.date))}
                  className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                >
                  Tout sélectionner
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => saveSelectedHolidays([])}
                  className="text-sm text-gray-600 hover:text-gray-700 font-medium"
                >
                  Tout désélectionner
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {FRENCH_HOLIDAYS_2026.map((holiday) => {
                const isSelected = selectedHolidays.includes(holiday.date);
                const isPast = new Date(holiday.date) < new Date();

                return (
                  <div
                    key={holiday.date}
                    className={`flex items-center justify-between p-4 ${isPast ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400'
                      }`}>
                        <Sun className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{holiday.name}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(holiday.date).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                          })}
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleHoliday(holiday.date)}
                        disabled={isPast}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600 peer-disabled:opacity-50"></div>
                    </label>
                  </div>
                );
              })}
            </div>

            <p className="text-sm text-gray-500 text-center">
              {selectedHolidays.length} jour{selectedHolidays.length > 1 ? 's' : ''} férié{selectedHolidays.length > 1 ? 's' : ''} sélectionné{selectedHolidays.length > 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      {/* Absence Modal */}
      {showAbsenceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingAbsence ? 'Modifier l\'absence' : 'Nouvelle absence'}
              </h2>
              <button
                onClick={() => setShowAbsenceModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {ABSENCE_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        onClick={() => setAbsenceForm({ ...absenceForm, type: type.value as Absence['type'] })}
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                          absenceForm.type === type.value
                            ? 'border-teal-500 bg-teal-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Titre (optionnel)</label>
                <input
                  type="text"
                  value={absenceForm.title}
                  onChange={(e) => setAbsenceForm({ ...absenceForm, title: e.target.value })}
                  placeholder="Ex: Vacances d'été"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Date début *</label>
                  <input
                    type="date"
                    value={absenceForm.startDate}
                    onChange={(e) => setAbsenceForm({ ...absenceForm, startDate: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Date fin *</label>
                  <input
                    type="date"
                    value={absenceForm.endDate}
                    onChange={(e) => setAbsenceForm({ ...absenceForm, endDate: e.target.value })}
                    min={absenceForm.startDate}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-sm text-gray-700">Journée entière</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={absenceForm.allDay}
                    onChange={(e) => setAbsenceForm({ ...absenceForm, allDay: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>

              {!absenceForm.allDay && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Heure début</label>
                    <input
                      type="time"
                      value={absenceForm.startTime}
                      onChange={(e) => setAbsenceForm({ ...absenceForm, startTime: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Heure fin</label>
                    <input
                      type="time"
                      value={absenceForm.endTime}
                      onChange={(e) => setAbsenceForm({ ...absenceForm, endTime: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes (optionnel)</label>
                <textarea
                  value={absenceForm.notes}
                  onChange={(e) => setAbsenceForm({ ...absenceForm, notes: e.target.value })}
                  rows={2}
                  placeholder="Informations complémentaires..."
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="px-5 py-4 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowAbsenceModal(false)}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveAbsence}
                disabled={!absenceForm.startDate || !absenceForm.endDate}
                className="px-5 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {editingAbsence ? 'Enregistrer' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Blocked Time Modal */}
      {showBlockedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingBlocked ? 'Modifier le créneau' : 'Nouveau créneau bloqué'}
              </h2>
              <button
                onClick={() => setShowBlockedModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Jour de la semaine</label>
                <select
                  value={blockedForm.dayOfWeek}
                  onChange={(e) => setBlockedForm({ ...blockedForm, dayOfWeek: parseInt(e.target.value) })}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  {DAYS_OF_WEEK.map((day) => (
                    <option key={day.value} value={day.value}>{day.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Heure début</label>
                  <input
                    type="time"
                    value={blockedForm.startTime}
                    onChange={(e) => setBlockedForm({ ...blockedForm, startTime: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Heure fin</label>
                  <input
                    type="time"
                    value={blockedForm.endTime}
                    onChange={(e) => setBlockedForm({ ...blockedForm, endTime: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Motif</label>
                <input
                  type="text"
                  value={blockedForm.reason}
                  onChange={(e) => setBlockedForm({ ...blockedForm, reason: e.target.value })}
                  placeholder="Ex: Pause déjeuner"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="px-5 py-4 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowBlockedModal(false)}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveBlocked}
                className="px-5 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
              >
                {editingBlocked ? 'Enregistrer' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
