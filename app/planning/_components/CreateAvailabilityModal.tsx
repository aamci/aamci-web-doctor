'use client';

import { useEffect, useState } from 'react';
import { Calendar, Clock, Plus, Trash2, X, CheckCircle, AlertCircle, Info } from 'lucide-react';

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
  const url = base ? `${base}${path}` : `/api${path}`;

  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string>),
  };
  if (init?.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const r = await fetch(url, {
    ...init,
    headers,
    credentials: 'include',
    cache: 'no-store'
  });

  if (!r.ok) {
    const t = await r.text().catch(() => '');
    throw new Error(`HTTP ${r.status}${t ? ` — ${t}` : ''}`);
  }
  return r;
}

type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

type AppointmentKind = {
  id: string;
  name: string;
  description?: string;
  duration?: number;
};

interface CreateAvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateAvailabilityModal({ isOpen, onClose, onSuccess }: CreateAvailabilityModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Motifs de consultation
  const [appointmentKinds, setAppointmentKinds] = useState<AppointmentKind[]>([]);
  const [selectedKinds, setSelectedKinds] = useState<Set<string>>(new Set());

  // Nouveau motif
  const [showCreateKind, setShowCreateKind] = useState(false);
  const [newKindName, setNewKindName] = useState('');
  const [newKindDescription, setNewKindDescription] = useState('');
  const [newKindDuration, setNewKindDuration] = useState(30);
  const [creatingKind, setCreatingKind] = useState(false);

  // Formulaire
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDays, setSelectedDays] = useState<Set<DayOfWeek>>(
    new Set(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'])
  );
  const [startHour, setStartHour] = useState('08:00');
  const [endHour, setEndHour] = useState('18:00');
  const [slotDuration, setSlotDuration] = useState(30);
  const [excludedHours, setExcludedHours] = useState<Set<string>>(new Set());
  const [capacity, setCapacity] = useState(1);

  const daysOfWeek: { value: DayOfWeek; label: string; shortLabel: string; num: number }[] = [
    { value: 'MONDAY', label: 'Lundi', shortLabel: 'Lun', num: 1 },
    { value: 'TUESDAY', label: 'Mardi', shortLabel: 'Mar', num: 2 },
    { value: 'WEDNESDAY', label: 'Mercredi', shortLabel: 'Mer', num: 3 },
    { value: 'THURSDAY', label: 'Jeudi', shortLabel: 'Jeu', num: 4 },
    { value: 'FRIDAY', label: 'Vendredi', shortLabel: 'Ven', num: 5 },
    { value: 'SATURDAY', label: 'Samedi', shortLabel: 'Sam', num: 6 },
    { value: 'SUNDAY', label: 'Dimanche', shortLabel: 'Dim', num: 7 },
  ];

  const generateHours = () => {
    const hours: string[] = [];
    for (let h = 6; h <= 22; h++) {
      hours.push(`${h.toString().padStart(2, '0')}:00`);
      hours.push(`${h.toString().padStart(2, '0')}:30`);
    }
    return hours;
  };

  const toggleDay = (day: DayOfWeek) => {
    const newDays = new Set(selectedDays);
    if (newDays.has(day)) {
      newDays.delete(day);
    } else {
      newDays.add(day);
    }
    setSelectedDays(newDays);
  };

  const toggleExcludedHour = (hour: string) => {
    const newExcluded = new Set(excludedHours);
    if (newExcluded.has(hour)) {
      newExcluded.delete(hour);
    } else {
      newExcluded.add(hour);
    }
    setExcludedHours(newExcluded);
  };

  const toggleAppointmentKind = (kindId: string) => {
    const newKinds = new Set(selectedKinds);
    if (newKinds.has(kindId)) {
      newKinds.delete(kindId);
    } else {
      newKinds.add(kindId);
    }
    setSelectedKinds(newKinds);
  };

  const handleCreateKind = async () => {
    if (!newKindName.trim()) {
      setError('Le nom du motif est requis');
      return;
    }

    setCreatingKind(true);
    setError(null);

    try {
      const response = await authedFetch('/appointment-kinds', {
        method: 'POST',
        body: JSON.stringify({
          name: newKindName.trim(),
          description: newKindDescription.trim() || undefined,
          duration: newKindDuration,
        }),
      });

      const newKind = await response.json();
      setAppointmentKinds([...appointmentKinds, newKind]);
      setNewKindName('');
      setNewKindDescription('');
      setNewKindDuration(30);
      setShowCreateKind(false);
    } catch (e: unknown) {
      const err = e as Error;
      setError(err?.message || 'Erreur lors de la création du motif');
    } finally {
      setCreatingKind(false);
    }
  };

  // Charger les motifs de consultation
  useEffect(() => {
    const loadAppointmentKinds = async () => {
      try {
        const response = await authedFetch('/appointment-kinds', { method: 'GET' });
        const data = await response.json();
        setAppointmentKinds(Array.isArray(data) ? data : data?.data || []);
      } catch (e) {
        console.error('Erreur lors du chargement des motifs:', e);
      }
    };

    if (isOpen) {
      loadAppointmentKinds();
    }
  }, [isOpen]);

  const handleGenerateSlots = async () => {
    // Validation
    if (!startDate || !endDate) {
      setError('Veuillez sélectionner une période');
      return;
    }

    if (selectedDays.size === 0) {
      setError('Veuillez sélectionner au moins un jour');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());

    if (diffMonths > 3) {
      setError('La période ne peut pas dépasser 3 mois');
      return;
    }

    if (start >= end) {
      setError('La date de fin doit être après la date de début');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const addMinutes = (timeStr: string, minutes: number): string => {
        const [h, m] = timeStr.split(':').map(Number);
        const totalMinutes = h * 60 + m + minutes;
        const newH = Math.floor(totalMinutes / 60);
        const newM = totalMinutes % 60;
        return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
      };

      const payload = {
        startDate,
        endDate,
        daysOfWeek: Array.from(selectedDays).map((day) => {
          const dayObj = daysOfWeek.find((d) => d.value === day);
          return dayObj?.num || 1;
        }),
        startHour: parseInt(startHour.split(':')[0]),
        endHour: parseInt(endHour.split(':')[0]),
        slotDurationMins: slotDuration,
        excludedTimes: Array.from(excludedHours).map((h) => `${h}-${addMinutes(h, slotDuration)}`),
        capacity,
      };

      await authedFetch('/availability-rules', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // Calculate approximate slots
      const daysCount = Array.from(selectedDays).length;
      const hoursPerDay = parseInt(endHour.split(':')[0]) - parseInt(startHour.split(':')[0]);
      const slotsPerDay = (hoursPerDay * 60) / slotDuration;
      const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const workDays = Math.ceil((totalDays / 7) * daysCount);
      const approxSlots = Math.floor(workDays * slotsPerDay);

      setSuccess(`Disponibilité créée ! ~${approxSlots} créneaux seront disponibles.`);

      // Reset form
      setStartDate('');
      setEndDate('');
      setExcludedHours(new Set());

      // Notify parent
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (e: unknown) {
      const err = e as Error;
      setError(err?.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const getMaxDate = () => {
    const today = new Date();
    const maxDate = new Date(today);
    maxDate.setMonth(maxDate.getMonth() + 3);
    return maxDate.toISOString().split('T')[0];
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Dialog centré */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-50 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Créer une disponibilité</h1>
                  <p className="text-sm text-gray-500">Générez vos créneaux pour les 3 prochains mois</p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-160px)] px-6 py-6 space-y-5">
            {/* Alerts */}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-800">{success}</p>
              </div>
            )}

            {/* Période */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-600" />
                Période
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Date de début</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={getTodayDate()}
                    max={getMaxDate()}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Date de fin (max 3 mois)</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || getTodayDate()}
                    max={getMaxDate()}
                  />
                </div>
              </div>
            </div>

            {/* Jours */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Jours de disponibilité</h3>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${
                      selectedDays.has(day.value)
                        ? 'bg-teal-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {day.shortLabel}
                  </button>
                ))}
              </div>
            </div>

            {/* Horaires */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600" />
                Plage horaire
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Heure de début</label>
                  <select
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                    value={startHour}
                    onChange={(e) => setStartHour(e.target.value)}
                  >
                    {generateHours().map((hour) => (
                      <option key={hour} value={hour}>{hour}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Heure de fin</label>
                  <select
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                    value={endHour}
                    onChange={(e) => setEndHour(e.target.value)}
                  >
                    {generateHours().map((hour) => (
                      <option key={hour} value={hour}>{hour}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Durée créneau</label>
                  <select
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                    value={slotDuration}
                    onChange={(e) => setSlotDuration(parseInt(e.target.value))}
                  >
                    <option value={15}>15 min</option>
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Exclusions */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-500" />
                Heures à exclure
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Sélectionnez les heures où vous ne serez pas disponible (ex: pause déjeuner)
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-gray-50 rounded-lg">
                {generateHours()
                  .filter((hour) => {
                    const h = parseInt(hour.split(':')[0]);
                    const startH = parseInt(startHour.split(':')[0]);
                    const endH = parseInt(endHour.split(':')[0]);
                    return h >= startH && h < endH;
                  })
                  .map((hour) => (
                    <button
                      key={hour}
                      type="button"
                      onClick={() => toggleExcludedHour(hour)}
                      className={`px-2.5 py-1.5 rounded text-xs font-medium transition-all ${
                        excludedHours.has(hour)
                          ? 'bg-red-100 text-red-700 border-2 border-red-400'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {hour}
                    </button>
                  ))}
              </div>
            </div>

            {/* Capacité */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-2">Capacité par créneau</h3>
              <p className="text-sm text-gray-500 mb-4">
                Nombre de patients maximum par créneau
              </p>
              <input
                type="number"
                min="1"
                max="10"
                className="w-32 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value))}
              />
            </div>

            {/* Motifs de consultation */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">Motifs de consultation</h3>
                <button
                  onClick={() => setShowCreateKind(!showCreateKind)}
                  className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Nouveau motif
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Sélectionnez les types de consultations autorisés (tous si aucun sélectionné)
              </p>

              {/* Formulaire nouveau motif */}
              {showCreateKind && (
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-medium text-teal-900 mb-3">Créer un motif</h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Nom du motif *"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                      value={newKindName}
                      onChange={(e) => setNewKindName(e.target.value)}
                      disabled={creatingKind}
                    />
                    <input
                      type="text"
                      placeholder="Description (optionnel)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                      value={newKindDescription}
                      onChange={(e) => setNewKindDescription(e.target.value)}
                      disabled={creatingKind}
                    />
                    <div className="flex gap-3">
                      <select
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 bg-white"
                        value={newKindDuration}
                        onChange={(e) => setNewKindDuration(parseInt(e.target.value))}
                        disabled={creatingKind}
                      >
                        <option value={15}>15 min</option>
                        <option value={30}>30 min</option>
                        <option value={45}>45 min</option>
                        <option value={60}>60 min</option>
                        <option value={90}>90 min</option>
                      </select>
                      <button
                        onClick={handleCreateKind}
                        disabled={creatingKind || !newKindName.trim()}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        {creatingKind ? 'Création...' : 'Créer'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Liste des motifs */}
              {appointmentKinds.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 italic p-3 bg-gray-50 rounded-lg">
                  <Info className="w-4 h-4" />
                  Aucun motif disponible. Créez-en un ci-dessus.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {appointmentKinds.map((kind) => (
                    <label
                      key={kind.id}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedKinds.has(kind.id)}
                        onChange={() => toggleAppointmentKind(kind.id)}
                        className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 text-sm">{kind.name}</div>
                        <div className="text-xs text-gray-500">
                          {kind.duration ? `${kind.duration} min` : ''}
                          {kind.description ? ` • ${kind.description}` : ''}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white border-t border-gray-200 px-6 py-4">
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 text-gray-700 bg-gray-100 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleGenerateSlots}
                disabled={loading}
                className="px-6 py-2.5 bg-teal-600 text-white rounded-full text-sm font-medium hover:bg-teal-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Création...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Créer la disponibilité
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
