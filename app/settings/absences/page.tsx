'use client';

import { useState, useEffect, useCallback } from 'react';
import { required, maxLen, dateRange, timeRange, hasErrors, type FormErrors } from '@/lib/validation';
import {
  Calendar, Plus, Trash2, Edit2, X, Clock, Loader2,
  CalendarOff, Sun, Plane, Info,
} from 'lucide-react';

interface Absence {
  id: string; type: 'vacation' | 'holiday' | 'personal' | 'training';
  title: string; startDate: string; endDate: string;
  allDay: boolean; startTime?: string; endTime?: string;
  recurring: boolean; notes?: string;
}

interface BlockedTime {
  id: string; dayOfWeek: number;
  startTime: string; endTime: string; reason: string;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lundi' }, { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' }, { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' }, { value: 6, label: 'Samedi' },
  { value: 0, label: 'Dimanche' },
];

const ABSENCE_TYPES = [
  { value: 'vacation', label: 'Congés', icon: Plane, color: 'bg-blue-100 text-blue-700' },
  { value: 'holiday', label: 'Jour férié', icon: Sun, color: 'bg-amber-100 text-amber-700' },
  { value: 'personal', label: 'Personnel', icon: Calendar, color: 'bg-violet-100 text-violet-700' },
  { value: 'training', label: 'Formation', icon: Clock, color: 'bg-emerald-100 text-emerald-700' },
];

const FRENCH_HOLIDAYS_2026 = [
  { date: '2026-01-01', name: "Jour de l'An" },
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

const INPUT = `w-full px-3 py-2.5 text-sm border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors`;

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none ${checked ? 'bg-teal-600' : 'bg-slate-200'}`}>
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  );
}

export default function AbsencesPage() {
  const [loading, setLoading] = useState(true);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [activeTab, setActiveTab] = useState<'absences' | 'blocked' | 'holidays'>('absences');

  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [editingAbsence, setEditingAbsence] = useState<Absence | null>(null);
  const [editingBlocked, setEditingBlocked] = useState<BlockedTime | null>(null);

  const [absenceForm, setAbsenceForm] = useState({
    type: 'vacation' as Absence['type'], title: '',
    startDate: '', endDate: '', allDay: true,
    startTime: '09:00', endTime: '18:00', recurring: false, notes: '',
  });

  const [blockedForm, setBlockedForm] = useState({
    dayOfWeek: 1, startTime: '12:00', endTime: '14:00', reason: 'Pause déjeuner',
  });

  const [selectedHolidays, setSelectedHolidays] = useState<string[]>([]);
  const [absenceErrors, setAbsenceErrors] = useState<FormErrors<'startDate' | 'endDate' | 'timeRange' | 'title' | 'notes'>>({});
  const [blockedErrors, setBlockedErrors] = useState<FormErrors<'timeRange' | 'reason'>>({});

  const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').trim().replace(/\/+$/, '') || 'http://localhost:3000';

  const typeToApi = (t: string) => ({ vacation: 'VACATION', holiday: 'OTHER', personal: 'PERSONAL', training: 'TRAINING' }[t] || 'OTHER');
  const typeFromApi = (t: string): Absence['type'] => ({ VACATION: 'vacation', PERSONAL: 'personal', TRAINING: 'training', OTHER: 'holiday' }[t] as Absence['type'] || 'personal');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const res = await fetch(`${apiBaseUrl}/doctor-absences/mine`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setAbsences((data || []).map((a: any) => ({
            id: a.id, type: typeFromApi(a.type),
            title: a.reason || a.type || 'Absence',
            startDate: a.startDate?.split('T')[0] || '',
            endDate: a.endDate?.split('T')[0] || '',
            allDay: !a.startTime, startTime: a.startTime, endTime: a.endTime,
            recurring: false, notes: a.reason,
          })));
        }
      }
    } catch { /* ignore */ }

    const savedBlocked = localStorage.getItem('doctorBlockedTimes');
    const savedHolidays = localStorage.getItem('doctorSelectedHolidays');
    if (savedBlocked) { try { setBlockedTimes(JSON.parse(savedBlocked)); } catch { /* ignore */ } }
    if (savedHolidays) { try { setSelectedHolidays(JSON.parse(savedHolidays)); } catch { /* ignore */ } }
    else { setSelectedHolidays(FRENCH_HOLIDAYS_2026.map(h => h.date)); }

    setLoading(false);
  }, [apiBaseUrl]);

  useEffect(() => { loadData(); }, [loadData]);

  const saveBlockedTimes = useCallback((next: BlockedTime[]) => {
    setBlockedTimes(next);
    localStorage.setItem('doctorBlockedTimes', JSON.stringify(next));
  }, []);

  const saveSelectedHolidays = useCallback((holidays: string[]) => {
    setSelectedHolidays(holidays);
    localStorage.setItem('doctorSelectedHolidays', JSON.stringify(holidays));
  }, []);

  const handleAddAbsence = () => {
    setEditingAbsence(null); setAbsenceErrors({});
    setAbsenceForm({ type: 'vacation', title: '', startDate: '', endDate: '', allDay: true, startTime: '09:00', endTime: '18:00', recurring: false, notes: '' });
    setShowAbsenceModal(true);
  };

  const handleEditAbsence = (absence: Absence) => {
    setEditingAbsence(absence); setAbsenceErrors({});
    setAbsenceForm({ type: absence.type, title: absence.title, startDate: absence.startDate, endDate: absence.endDate, allDay: absence.allDay, startTime: absence.startTime || '09:00', endTime: absence.endTime || '18:00', recurring: absence.recurring, notes: absence.notes || '' });
    setShowAbsenceModal(true);
  };

  const handleSaveAbsence = async () => {
    const errors: typeof absenceErrors = {
      startDate: required(absenceForm.startDate, 'Date de début'),
      endDate: required(absenceForm.endDate, 'Date de fin') ?? dateRange(absenceForm.startDate, absenceForm.endDate),
      timeRange: !absenceForm.allDay ? timeRange(absenceForm.startTime, absenceForm.endTime) : null,
      title: absenceForm.title ? maxLen(absenceForm.title, 100, 'Titre') : null,
      notes: absenceForm.notes ? maxLen(absenceForm.notes, 500, 'Notes') : null,
    };
    setAbsenceErrors(errors);
    if (hasErrors(errors)) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const title = absenceForm.title || ABSENCE_TYPES.find(t => t.value === absenceForm.type)?.label || 'Absence';
    const apiBody = {
      startDate: absenceForm.startDate, endDate: absenceForm.endDate,
      type: typeToApi(absenceForm.type),
      reason: title + (absenceForm.notes ? ` - ${absenceForm.notes}` : ''),
      blockSlots: true,
    };

    try {
      if (editingAbsence) {
        const res = await fetch(`${apiBaseUrl}/doctor-absences/${editingAbsence.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(apiBody),
        });
        if (res.ok) await loadData();
      } else {
        const res = await fetch(`${apiBaseUrl}/doctor-absences`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(apiBody),
        });
        if (res.ok) await loadData();
      }
    } catch { /* ignore */ }
    setShowAbsenceModal(false);
  };

  const handleDeleteAbsence = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${apiBaseUrl}/doctor-absences/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setAbsences(prev => prev.filter(a => a.id !== id));
    } catch { /* ignore */ }
  };

  const handleAddBlocked = () => {
    setEditingBlocked(null); setBlockedErrors({});
    setBlockedForm({ dayOfWeek: 1, startTime: '12:00', endTime: '14:00', reason: 'Pause déjeuner' });
    setShowBlockedModal(true);
  };

  const handleEditBlocked = (blocked: BlockedTime) => {
    setEditingBlocked(blocked); setBlockedErrors({});
    setBlockedForm({ dayOfWeek: blocked.dayOfWeek, startTime: blocked.startTime, endTime: blocked.endTime, reason: blocked.reason });
    setShowBlockedModal(true);
  };

  const handleSaveBlocked = () => {
    const errors: typeof blockedErrors = {
      timeRange: timeRange(blockedForm.startTime, blockedForm.endTime),
      reason: required(blockedForm.reason, 'Motif') ?? maxLen(blockedForm.reason, 100, 'Motif'),
    };
    setBlockedErrors(errors);
    if (hasErrors(errors)) return;
    const blocked: BlockedTime = { id: editingBlocked?.id || `block-${Date.now()}`, ...blockedForm };
    if (editingBlocked) { saveBlockedTimes(blockedTimes.map(b => b.id === editingBlocked.id ? blocked : b)); }
    else { saveBlockedTimes([...blockedTimes, blocked]); }
    setShowBlockedModal(false);
  };

  const toggleHoliday = (date: string) => {
    saveSelectedHolidays(selectedHolidays.includes(date)
      ? selectedHolidays.filter(d => d !== date)
      : [...selectedHolidays, date]);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  const getAbsenceTypeInfo = (type: Absence['type']) => ABSENCE_TYPES.find(t => t.value === type) || ABSENCE_TYPES[0];

  const upcomingAbsences = absences.filter(a => new Date(a.endDate) >= new Date()).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  const pastAbsences = absences.filter(a => new Date(a.endDate) < new Date()).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-teal-500 animate-spin" /></div>;
  }

  const TABS = [
    { id: 'absences' as const, label: `Absences (${absences.length})`, icon: Plane },
    { id: 'blocked' as const, label: `Créneaux bloqués (${blockedTimes.length})`, icon: CalendarOff },
    { id: 'holidays' as const, label: 'Jours fériés', icon: Sun },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-slate-900">Absences & indisponibilités</h1>
        <p className="text-sm text-slate-500 mt-0.5">Gérez vos congés, jours fériés et créneaux bloqués</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-5">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
              activeTab === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Absences Tab ── */}
      {activeTab === 'absences' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-600">Vos périodes d'absence</p>
            <button onClick={handleAddAbsence}
              className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 text-white text-xs font-medium rounded-lg hover:bg-teal-700 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Ajouter
            </button>
          </div>

          {upcomingAbsences.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">À venir</p>
              {upcomingAbsences.map(absence => {
                const typeInfo = getAbsenceTypeInfo(absence.type);
                const Icon = typeInfo.icon;
                return (
                  <div key={absence.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:shadow transition-shadow">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg shrink-0 ${typeInfo.color}`}><Icon className="w-4 h-4" /></div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{absence.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {formatDate(absence.startDate)}
                            {absence.startDate !== absence.endDate && ` → ${formatDate(absence.endDate)}`}
                            {!absence.allDay && ` · ${absence.startTime} - ${absence.endTime}`}
                          </p>
                          {absence.notes && <p className="text-xs text-slate-400 mt-1">{absence.notes}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => handleEditAbsence(absence)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteAbsence(absence.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {pastAbsences.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Passées</p>
              {pastAbsences.slice(0, 5).map(absence => {
                const typeInfo = getAbsenceTypeInfo(absence.type);
                const Icon = typeInfo.icon;
                return (
                  <div key={absence.id} className="bg-slate-50 rounded-xl border border-slate-100 p-4 opacity-60">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-slate-200 text-slate-400 shrink-0"><Icon className="w-4 h-4" /></div>
                        <div>
                          <p className="text-sm font-medium text-slate-700">{absence.title}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {formatDate(absence.startDate)}{absence.startDate !== absence.endDate && ` → ${formatDate(absence.endDate)}`}
                          </p>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteAbsence(absence.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {absences.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 py-14 text-center">
              <Plane className="w-9 h-9 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-500">Aucune absence planifiée</p>
              <p className="text-xs text-slate-400 mt-1">Ajoutez vos congés pour bloquer les prises de rendez-vous</p>
            </div>
          )}
        </div>
      )}

      {/* ── Blocked Times Tab ── */}
      {activeTab === 'blocked' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-600">Créneaux bloqués récurrents</p>
            <button onClick={handleAddBlocked}
              className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 text-white text-xs font-medium rounded-lg hover:bg-teal-700 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Ajouter
            </button>
          </div>

          <div className="flex items-start gap-2.5 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-400" />
            Réservez du temps récurrent chaque semaine (pause déjeuner, administratif…)
          </div>

          {blockedTimes.length > 0 ? (
            <div className="space-y-3">
              {DAYS_OF_WEEK.map(day => {
                const dayBlocked = blockedTimes.filter(b => b.dayOfWeek === day.value);
                if (!dayBlocked.length) return null;
                return (
                  <div key={day.value} className="bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="px-5 py-3 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-800">{day.label}</p>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {dayBlocked.map(blocked => (
                        <div key={blocked.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <Clock className="w-4 h-4 text-slate-300 shrink-0" />
                            <span className="text-sm font-medium text-slate-700">{blocked.startTime} – {blocked.endTime}</span>
                            <span className="text-xs text-slate-400">{blocked.reason}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleEditBlocked(blocked)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDeleteBlocked(blocked.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
            <div className="bg-white rounded-xl border border-slate-200 py-14 text-center">
              <CalendarOff className="w-9 h-9 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-500">Aucun créneau bloqué</p>
              <p className="text-xs text-slate-400 mt-1">Ajoutez des plages récurrentes à exclure</p>
            </div>
          )}
        </div>
      )}

      {/* ── Holidays Tab ── */}
      {activeTab === 'holidays' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-800">Jours fériés 2026</p>
              <p className="text-xs text-slate-400 mt-0.5">{selectedHolidays.length} sélectionné{selectedHolidays.length > 1 ? 's' : ''}</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-medium">
              <button onClick={() => saveSelectedHolidays(FRENCH_HOLIDAYS_2026.map(h => h.date))} className="text-teal-600 hover:text-teal-700 transition-colors">Tout sélectionner</button>
              <span className="text-slate-300">|</span>
              <button onClick={() => saveSelectedHolidays([])} className="text-slate-500 hover:text-slate-700 transition-colors">Tout désélectionner</button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
            {FRENCH_HOLIDAYS_2026.map(holiday => {
              const isSelected = selectedHolidays.includes(holiday.date);
              const isPast = new Date(holiday.date) < new Date();
              return (
                <div key={holiday.date} className={`flex items-center justify-between px-5 py-3.5 ${isPast ? 'opacity-40' : 'hover:bg-slate-50 transition-colors'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                      <Sun className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{holiday.name}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(holiday.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </p>
                    </div>
                  </div>
                  <button type="button" disabled={isPast} onClick={() => toggleHoliday(holiday.date)}
                    className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none disabled:cursor-not-allowed ${isSelected ? 'bg-teal-600' : 'bg-slate-200'}`}>
                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${isSelected ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Absence Modal ── */}
      {showAbsenceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-800">{editingAbsence ? "Modifier l'absence" : 'Nouvelle absence'}</h2>
              <button onClick={() => setShowAbsenceModal(false)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {ABSENCE_TYPES.map(type => {
                    const Icon = type.icon;
                    return (
                      <button key={type.value} onClick={() => setAbsenceForm({ ...absenceForm, type: type.value as Absence['type'] })}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-sm font-medium transition-colors ${
                          absenceForm.type === type.value ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}>
                        <Icon className="w-4 h-4 shrink-0" />{type.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Titre (optionnel)</label>
                <input type="text" value={absenceForm.title} maxLength={100} placeholder="Ex: Vacances d'été"
                  onChange={e => { setAbsenceForm({ ...absenceForm, title: e.target.value }); setAbsenceErrors(fe => ({ ...fe, title: null })); }}
                  className={`${INPUT} ${absenceErrors.title ? 'border-red-400' : 'border-slate-200'}`} />
                {absenceErrors.title && <p className="text-xs text-red-500 mt-1">{absenceErrors.title}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Début *</label>
                  <input type="date" value={absenceForm.startDate}
                    onChange={e => { setAbsenceForm({ ...absenceForm, startDate: e.target.value }); setAbsenceErrors(fe => ({ ...fe, startDate: null, endDate: null })); }}
                    className={`${INPUT} ${absenceErrors.startDate ? 'border-red-400' : 'border-slate-200'}`} />
                  {absenceErrors.startDate && <p className="text-xs text-red-500 mt-1">{absenceErrors.startDate}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Fin *</label>
                  <input type="date" value={absenceForm.endDate} min={absenceForm.startDate}
                    onChange={e => { setAbsenceForm({ ...absenceForm, endDate: e.target.value }); setAbsenceErrors(fe => ({ ...fe, endDate: null })); }}
                    className={`${INPUT} ${absenceErrors.endDate ? 'border-red-400' : 'border-slate-200'}`} />
                  {absenceErrors.endDate && <p className="text-xs text-red-500 mt-1">{absenceErrors.endDate}</p>}
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="text-sm text-slate-700">Journée entière</span>
                <Toggle checked={absenceForm.allDay} onChange={v => setAbsenceForm({ ...absenceForm, allDay: v })} />
              </div>
              {!absenceForm.allDay && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Heure début</label>
                    <input type="time" value={absenceForm.startTime}
                      onChange={e => { setAbsenceForm({ ...absenceForm, startTime: e.target.value }); setAbsenceErrors(fe => ({ ...fe, timeRange: null })); }}
                      className={`${INPUT} border-slate-200`} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Heure fin</label>
                    <input type="time" value={absenceForm.endTime}
                      onChange={e => { setAbsenceForm({ ...absenceForm, endTime: e.target.value }); setAbsenceErrors(fe => ({ ...fe, timeRange: null })); }}
                      className={`${INPUT} border-slate-200`} />
                  </div>
                  {absenceErrors.timeRange && <p className="col-span-2 text-xs text-red-500">{absenceErrors.timeRange}</p>}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Notes (optionnel)</label>
                <textarea value={absenceForm.notes} rows={2} maxLength={500} placeholder="Informations complémentaires…"
                  onChange={e => { setAbsenceForm({ ...absenceForm, notes: e.target.value }); setAbsenceErrors(fe => ({ ...fe, notes: null })); }}
                  className={`${INPUT} resize-none ${absenceErrors.notes ? 'border-red-400' : 'border-slate-200'}`} />
                {absenceErrors.notes && <p className="text-xs text-red-500 mt-1">{absenceErrors.notes}</p>}
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowAbsenceModal(false)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium transition-colors">Annuler</button>
              <button onClick={handleSaveAbsence} className="px-5 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors">{editingAbsence ? 'Enregistrer' : 'Ajouter'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Blocked Time Modal ── */}
      {showBlockedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-800">{editingBlocked ? 'Modifier le créneau' : 'Nouveau créneau bloqué'}</h2>
              <button onClick={() => setShowBlockedModal(false)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Jour de la semaine</label>
                <select value={blockedForm.dayOfWeek} onChange={e => setBlockedForm({ ...blockedForm, dayOfWeek: parseInt(e.target.value) })}
                  className={`${INPUT} border-slate-200`}>
                  {DAYS_OF_WEEK.map(day => <option key={day.value} value={day.value}>{day.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Heure début</label>
                  <input type="time" value={blockedForm.startTime}
                    onChange={e => { setBlockedForm({ ...blockedForm, startTime: e.target.value }); setBlockedErrors(fe => ({ ...fe, timeRange: null })); }}
                    className={`${INPUT} border-slate-200`} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Heure fin</label>
                  <input type="time" value={blockedForm.endTime}
                    onChange={e => { setBlockedForm({ ...blockedForm, endTime: e.target.value }); setBlockedErrors(fe => ({ ...fe, timeRange: null })); }}
                    className={`${INPUT} border-slate-200`} />
                </div>
                {blockedErrors.timeRange && <p className="col-span-2 text-xs text-red-500">{blockedErrors.timeRange}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Motif *</label>
                <input type="text" value={blockedForm.reason} maxLength={100} placeholder="Ex: Pause déjeuner"
                  onChange={e => { setBlockedForm({ ...blockedForm, reason: e.target.value }); setBlockedErrors(fe => ({ ...fe, reason: null })); }}
                  className={`${INPUT} ${blockedErrors.reason ? 'border-red-400' : 'border-slate-200'}`} />
                {blockedErrors.reason && <p className="text-xs text-red-500 mt-1">{blockedErrors.reason}</p>}
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowBlockedModal(false)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium transition-colors">Annuler</button>
              <button onClick={handleSaveBlocked} className="px-5 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors">{editingBlocked ? 'Enregistrer' : 'Ajouter'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
