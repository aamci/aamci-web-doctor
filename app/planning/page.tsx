'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

import PlanningCalendar from './PlanningCalendar';
import PlanningWeekView from './PlanningWeekView';
import PlanningListView from './PlanningListView';
import PlanningDayView from './PlanningDayView';
import PlanningMonthView from './PlanningMonthView';
import PlanningFilters from './PlanningFilters';
import AppointmentSheet from '../_components/AppointmentSheet';
import SlotSheet from '../_components/SlotSheet';
import { useAuth } from '../_providers/AuthProvider';

import { Alert, AlertDescription } from '@/components/ui/alert';

// Types
export type Slot = {
  id: string;
  ownerId: string;
  ownerType: string;
  start: string;  // ISO
  end: string;    // ISO
  capacity: number;
  status: 'ACTIVE' | 'INACTIVE';
  appointments?: Appointment[];
};

export type Appointment = {
  id: string;
  slotId: string;
  patientId: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'NO_SHOW';
  notes?: string;
  type?: string;
  kindId?: string;
  kind?: AppointmentKind;
  patient?: {
    id: string;
    fullName?: string;
    email?: string;
    phone?: string;
    gender?: 'MALE' | 'FEMALE';
    birthDate?: string;
  };
  createdAt: string;
};

export type AppointmentKind = {
  id: string;
  name: string;
  description?: string;
  doctorId?: string;
};

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

  // Utiliser credentials: 'include' pour envoyer les cookies automatiquement
  const r = await fetch(url, {
    ...init,
    headers,
    credentials: 'include', // Envoie les cookies HTTP-only
    cache: 'no-store'
  });

  if (!r.ok) {
    const t = await r.text().catch(() => '');
    throw new Error(`HTTP ${r.status}${t ? ` — ${t}` : ''}`);
  }
  return r;
}

// début de semaine (lundi) avec offset en semaines
function startOfWeekWithOffset(offset: number) {
  const today = new Date();
  const day = today.getDay(); // 0 = dimanche
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(today.getDate() + diffToMonday + offset * 7);
  return monday;
}

interface WeekDay {
  date: Date;
  day: string;
  dayNum: number;
}

export default function AvailabilityPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [appointmentKinds, setAppointmentKinds] = useState<AppointmentKind[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'list' | 'day' | 'week' | 'month'>('week');

  // Filtres
  const [selectedMotif, setSelectedMotif] = useState('');
  const [selectedAgenda, setSelectedAgenda] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Sheet state for appointments
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isAppointmentSheetOpen, setIsAppointmentSheetOpen] = useState(false);

  // Sheet state for available slots
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [isSlotSheetOpen, setIsSlotSheetOpen] = useState(false);

  const handleAppointmentClick = (appointment: any) => {
    setSelectedAppointment(appointment);
    setIsAppointmentSheetOpen(true);
  };

  const handleSlotClick = (slot: Slot) => {
    setSelectedSlot(slot);
    setIsSlotSheetOpen(true);
  };

  const handleCloseAppointmentSheet = () => {
    setIsAppointmentSheetOpen(false);
    setSelectedAppointment(null);
  };

  const handleCloseSlotSheet = () => {
    setIsSlotSheetOpen(false);
    setSelectedSlot(null);
  };

  const handleDeleteSlot = async (slotId: string) => {
    await authedFetch(`/slots/${slotId}`, { method: 'DELETE' });
    await load(); // Reload slots
  };

  const handleUpdateSlot = async (slotId: string, data: any) => {
    await authedFetch(`/slots/${slotId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    await load(); // Reload slots
  };

  // Générer la semaine actuelle
  const getWeekDays = (date: Date): WeekDay[] => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Lundi
    startOfWeek.setDate(diff);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return {
        date: d,
        day: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][i],
        dayNum: d.getDate(),
      };
    });
  };

  const weekDays = getWeekDays(currentDate);

  // Générer les heures (8h - 18h)
  const hours = Array.from({ length: 11 }, (_, i) => i + 8);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      // Charger les slots avec les appointments
      const slotsResponse = await authedFetch('/slots/mine', { method: 'GET' });
      const slotsData = await slotsResponse.json().catch(() => []);
      setSlots(Array.isArray(slotsData) ? slotsData : slotsData?.data || []);

      // Charger les types de consultations (AppointmentKinds)
      const kindsResponse = await authedFetch('/appointment-kinds', { method: 'GET' });
      const kindsData = await kindsResponse.json().catch(() => []);
      setAppointmentKinds(Array.isArray(kindsData) ? kindsData : kindsData?.data || []);
    } catch (e: any) {
      if (e?.message?.includes('Non authentifié')) {
        router.replace('/auth/login');
      } else {
        setErr(e?.message || 'Erreur de chargement');
      }
    } finally {
      setLoading(false);
    }
  }

  // Navigation selon la vue
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (view === 'week') {
      newDate.setDate(currentDate.getDate() - 7);
    } else if (view === 'day') {
      newDate.setDate(currentDate.getDate() - 1);
    } else if (view === 'month') {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      // list view - semaine par défaut
      newDate.setDate(currentDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'week') {
      newDate.setDate(currentDate.getDate() + 7);
    } else if (view === 'day') {
      newDate.setDate(currentDate.getDate() + 1);
    } else if (view === 'month') {
      newDate.setMonth(currentDate.getMonth() + 1);
    } else {
      // list view - semaine par défaut
      newDate.setDate(currentDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  // Format de la période affichée
  const getDateRangeLabel = () => {
    if (view === 'week') {
      return `${weekDays[0].dayNum} - ${weekDays[6].dayNum} ${currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
    } else if (view === 'day') {
      return currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } else if (view === 'month') {
      return currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    } else {
      return currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    }
  };

  // Préparer les options de filtres
  const motifOptions = appointmentKinds.map((kind) => ({
    value: kind.id,
    label: kind.name,
    color: getColorForKind(kind.name),
  }));

  const agendaOptions = [
    { value: user?.id || '', label: user?.fullName || 'Mon agenda' },
  ];

  const statusOptions = [
    { value: 'ACTIVE', label: 'Actif', color: '#10b981' },
    { value: 'INACTIVE', label: 'Inactif', color: '#6b7280' },
  ];

  const appointmentStatusOptions = [
    { value: 'PENDING', label: 'En attente', color: '#f59e0b' },
    { value: 'CONFIRMED', label: 'Confirmé', color: '#10b981' },
    { value: 'CANCELLED', label: 'Annulé', color: '#ef4444' },
    { value: 'NO_SHOW', label: 'Absent', color: '#6b7280' },
  ];

  // Fonction helper pour attribuer des couleurs aux motifs
  function getColorForKind(name: string): string {
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#06b6d4'];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  }

  // Filtrer les slots selon les critères sélectionnés
  const filteredSlots = slots.filter((slot) => {
    // Filtre par status du slot
    if (selectedStatus && slot.status !== selectedStatus) {
      return false;
    }

    // Filtre par agenda (docteur) - pour l'instant un seul agenda
    if (selectedAgenda && slot.ownerId !== selectedAgenda) {
      return false;
    }

    // Filtre par motif de consultation (via les appointments)
    if (selectedMotif) {
      const hasMatchingAppointment = slot.appointments?.some(
        (apt) => apt.kindId === selectedMotif
      );
      if (!hasMatchingAppointment) {
        return false;
      }
    }

    return true;
  });

  useEffect(() => {
    // Attendre que le contexte auth soit chargé
    if (authLoading) return;

    // Si pas d'utilisateur connecté, rediriger vers login
    if (!user) {
      router.replace('/auth/login');
      return;
    }

    // Charger les créneaux uniquement si l'utilisateur est connecté
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  return (
    <div className="flex h-screen bg-gray-50 -ml-20">
      {/* Sidebar Gauche - Calendrier Mensuel */}
      <div className="w-80 bg-white border-r border-gray-200 p-6 flex flex-col">
        {/* Bouton Nouveau RDV */}
        <button className="w-full bg-teal-600 hover:bg-teal-700 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 mb-6 font-medium transition-colors">
          <Plus className="w-5 h-5" />
          Nouveau rendez-vous
        </button>

        {/* Mini Calendrier */}
        <PlanningCalendar selectedDate={selectedDate} onDateChange={setSelectedDate} />

        {/* Filtres */}
        <div className="mt-6 border-t border-gray-200 pt-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-4">FILTRES</h4>
          <PlanningFilters
            motifs={motifOptions}
            agendas={agendaOptions}
            statuses={statusOptions}
            selectedMotif={selectedMotif}
            selectedAgenda={selectedAgenda}
            selectedStatus={selectedStatus}
            onMotifChange={setSelectedMotif}
            onAgendaChange={setSelectedAgenda}
            onStatusChange={setSelectedStatus}
          />
        </div>
      </div>

      {/* Contenu Principal - Planning */}
      <div className="flex-1 flex flex-col">
        {/* Alerts */}
        {err && (
          <Alert variant="destructive" className="m-4">
            <AlertDescription>{err}</AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Navigation Date */}
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-800">Planning</h2>
              <div className="flex items-center gap-2">
                <button onClick={goToPrevious} className="p-2 hover:bg-gray-100 rounded">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-medium text-gray-600 min-w-[250px] text-center capitalize">
                  {getDateRangeLabel()}
                </span>
                <button onClick={goToNext} className="p-2 hover:bg-gray-100 rounded">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Onglets Vue */}
            <div className="flex items-center gap-2">
              {['Liste', 'Journée', 'Semaine', 'Mois', 'Affichage'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    if (tab === 'Liste') setView('list');
                    if (tab === 'Journée') setView('day');
                    if (tab === 'Semaine') setView('week');
                    if (tab === 'Mois') setView('month');
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    (tab === 'Semaine' && view === 'week') ||
                    (tab === 'Liste' && view === 'list') ||
                    (tab === 'Journée' && view === 'day') ||
                    (tab === 'Mois' && view === 'month')
                      ? 'bg-teal-50 text-teal-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Vue Planning */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Chargement...</p>
            </div>
          ) : (
            <>
              {view === 'week' && (
                <PlanningWeekView
                  slots={filteredSlots}
                  weekDays={weekDays}
                  hours={hours}
                  onAppointmentClick={handleAppointmentClick}
                  onSlotClick={handleSlotClick}
                />
              )}
              {view === 'list' && (
                <PlanningListView
                  slots={filteredSlots}
                  currentDate={currentDate}
                  onAppointmentClick={handleAppointmentClick}
                  onSlotClick={handleSlotClick}
                />
              )}
              {view === 'day' && (
                <PlanningDayView
                  slots={filteredSlots}
                  currentDate={currentDate}
                  hours={hours}
                  onAppointmentClick={handleAppointmentClick}
                  onSlotClick={handleSlotClick}
                />
              )}
              {view === 'month' && (
                <PlanningMonthView
                  slots={filteredSlots}
                  currentDate={currentDate}
                  onDateClick={(date) => {
                    setCurrentDate(date);
                    setView('day');
                  }}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Appointment Details Sheet */}
      <AppointmentSheet
        appointment={selectedAppointment}
        isOpen={isAppointmentSheetOpen}
        onClose={handleCloseAppointmentSheet}
      />

      {/* Slot Management Sheet */}
      <SlotSheet
        slot={selectedSlot}
        isOpen={isSlotSheetOpen}
        onClose={handleCloseSlotSheet}
        appointmentKinds={appointmentKinds}
        onDelete={handleDeleteSlot}
        onUpdate={handleUpdateSlot}
      />
    </div>
  );
}