'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, Plus, Trash2, Settings } from 'lucide-react';
import { useAuth } from '../_providers/AuthProvider';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
    ...(init?.headers as any),
  };
  if (init?.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // Ajouter le token JWT depuis localStorage pour cross-origin
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

export default function AvailabilityManagementPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Motifs de consultation
  const [appointmentKinds, setAppointmentKinds] = useState<AppointmentKind[]>([]);
  const [selectedKinds, setSelectedKinds] = useState<Set<string>>(new Set());

  // Nouveau motif
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

  const daysOfWeek: { value: DayOfWeek; label: string; num: number }[] = [
    { value: 'MONDAY', label: 'Lundi', num: 1 },
    { value: 'TUESDAY', label: 'Mardi', num: 2 },
    { value: 'WEDNESDAY', label: 'Mercredi', num: 3 },
    { value: 'THURSDAY', label: 'Jeudi', num: 4 },
    { value: 'FRIDAY', label: 'Vendredi', num: 5 },
    { value: 'SATURDAY', label: 'Samedi', num: 6 },
    { value: 'SUNDAY', label: 'Dimanche', num: 7 },
  ];

  // Générer les heures disponibles
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
      setSuccess('Motif créé avec succès !');
    } catch (e: any) {
      setError(e?.message || 'Erreur lors de la création du motif');
    } finally {
      setCreatingKind(false);
    }
  };

  // Charger les motifs de consultation au montage
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

    if (user) {
      loadAppointmentKinds();
    }
  }, [user]);

  const handleGenerateSlots = async () => {
    if (!user) return;

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
      // Helper to add minutes to time string
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

      const response = await authedFetch('/availability-rules', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      await response.json();

      // Calculate approximate number of slots for user feedback
      const daysCount = Array.from(selectedDays).length;
      const hoursPerDay = parseInt(endHour.split(':')[0]) - parseInt(startHour.split(':')[0]);
      const slotsPerDay = (hoursPerDay * 60) / slotDuration;
      const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const workDays = Math.ceil((totalDays / 7) * daysCount);
      const approxSlots = Math.floor(workDays * slotsPerDay);

      setSuccess(`Disponibilité enregistrée avec succès ! Environ ${approxSlots} créneaux seront disponibles à la réservation.`);

      // Reset form
      setStartDate('');
      setEndDate('');
      setExcludedHours(new Set());
    } catch (e: any) {
      setError(e?.message || 'Erreur lors de l\'enregistrement de la disponibilité');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/auth/login');
      return;
    }
  }, [user, authLoading, router]);

  // Calculer la date max (3 mois à partir d'aujourd'hui)
  const getMaxDate = () => {
    const today = new Date();
    const maxDate = new Date(today);
    maxDate.setMonth(maxDate.getMonth() + 3);
    return maxDate.toISOString().split('T')[0];
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-teal-600" />
            Gestion des disponibilités
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Générez automatiquement vos créneaux de disponibilité pour les 3 prochains mois
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <AlertDescription className="text-sm text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Formulaire */}
        <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
          {/* Période */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600" />
              Période de génération
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Date de début
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={getTodayDate()}
                  max={getMaxDate()}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Date de fin (max 3 mois)
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || getTodayDate()}
                  max={getMaxDate()}
                />
              </div>
            </div>
          </div>

          {/* Jours de la semaine */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Jours de disponibilité
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {daysOfWeek.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`px-3 py-2 text-sm rounded-lg font-medium transition-all ${
                    selectedDays.has(day.value)
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          {/* Horaires */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600" />
              Plage horaire
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Heure de début
                </label>
                <select
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  value={startHour}
                  onChange={(e) => setStartHour(e.target.value)}
                >
                  {generateHours().map((hour) => (
                    <option key={hour} value={hour}>
                      {hour}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Heure de fin
                </label>
                <select
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  value={endHour}
                  onChange={(e) => setEndHour(e.target.value)}
                >
                  {generateHours().map((hour) => (
                    <option key={hour} value={hour}>
                      {hour}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Durée créneau (min)
                </label>
                <select
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  value={slotDuration}
                  onChange={(e) => setSlotDuration(parseInt(e.target.value))}
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>
            </div>
          </div>

          {/* Heures à exclure */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-600" />
              Heures à exclure (optionnel)
            </h3>
            <p className="text-xs text-gray-600 mb-2">
              Sélectionnez les heures où vous ne souhaitez pas être disponible (ex: pause déjeuner)
            </p>
            <div className="grid grid-cols-8 gap-1.5 max-h-40 overflow-y-auto p-2 bg-gray-50 rounded-lg">
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
                    className={`px-2 py-1.5 rounded text-xs font-medium transition-all ${
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
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Capacité par créneau
            </label>
            <input
              type="number"
              min="1"
              max="10"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              value={capacity}
              onChange={(e) => setCapacity(parseInt(e.target.value))}
            />
            <p className="text-xs text-gray-500 mt-1">
              Nombre de patients maximum par créneau
            </p>
          </div>

          {/* Motifs de consultation */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Motifs de consultation autorisés (optionnel)
            </h3>
            <p className="text-xs text-gray-600 mb-2">
              Sélectionnez les types de consultations pour lesquels ces créneaux seront disponibles. Si aucun motif n'est sélectionné, tous les motifs seront acceptés.
            </p>

            {/* Formulaire de création de motif */}
            <div className="bg-teal-50 border-2 border-teal-200 rounded-lg p-3 mb-3">
              <h4 className="text-sm font-semibold text-teal-900 mb-2 flex items-center gap-2">
                <Plus className="w-3.5 h-3.5" />
                Créer un nouveau motif
              </h4>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Nom du motif <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Consultation générale, Suivi, Urgence..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    value={newKindName}
                    onChange={(e) => setNewKindName(e.target.value)}
                    disabled={creatingKind}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optionnel)
                  </label>
                  <input
                    type="text"
                    placeholder="Brève description du motif..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    value={newKindDescription}
                    onChange={(e) => setNewKindDescription(e.target.value)}
                    disabled={creatingKind}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Durée (minutes)
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    value={newKindDuration}
                    onChange={(e) => setNewKindDuration(parseInt(e.target.value))}
                    disabled={creatingKind}
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                    <option value={90}>90 minutes</option>
                    <option value={120}>120 minutes</option>
                  </select>
                </div>
                <button
                  onClick={handleCreateKind}
                  disabled={creatingKind || !newKindName.trim()}
                  className={`w-full py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                    creatingKind || !newKindName.trim()
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-teal-600 text-white hover:bg-teal-700'
                  }`}
                >
                  {creatingKind ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Création...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Créer le motif
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Liste des motifs existants */}
            {appointmentKinds.length === 0 ? (
              <div className="text-sm text-gray-500 italic">
                Aucun motif de consultation disponible. Créez-en ci-dessus.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
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
                      <div className="font-medium text-gray-900">{kind.name}</div>
                      {kind.description && (
                        <div className="text-sm text-gray-500">{kind.description}</div>
                      )}
                      {kind.duration && (
                        <div className="text-sm text-gray-500">{kind.duration} minutes</div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Bouton de génération */}
          <div className="pt-6 border-t">
            <button
              onClick={handleGenerateSlots}
              disabled={loading}
              className={`w-full py-4 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-teal-600 hover:bg-teal-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Enregistrement en cours...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Enregistrer la disponibilité
                </>
              )}
            </button>
            <p className="text-sm text-gray-500 text-center mt-3">
              Les créneaux seront générés automatiquement lors des réservations
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
