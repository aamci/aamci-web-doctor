'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Plus, Menu, Settings } from 'lucide-react';

import PlanningCalendar from './PlanningCalendar';
import PlanningWeekView from './PlanningWeekView';
import PlanningListView from './PlanningListView';
import PlanningDayView from './PlanningDayView';
import PlanningMonthView from './PlanningMonthView';
import PlanningFilters from './PlanningFilters';
import PlanningWeekViewSkeleton from './PlanningWeekViewSkeleton';
import PlanningListViewSkeleton from './PlanningListViewSkeleton';
import PlanningDayViewSkeleton from './PlanningDayViewSkeleton';
import PlanningMonthViewSkeleton from './PlanningMonthViewSkeleton';
import MobileSidebar from './MobileSidebar';
import AppointmentSheet from '../_components/AppointmentSheet';
import SlotSheet from '../_components/SlotSheet';
import CreateAppointmentModal from './CreateAppointmentModal';
import EditAppointmentModal from './EditAppointmentModal';
import CreateAvailabilityWizard from './_components/CreateAvailabilityWizard';
import ManageRulesPage from './_components/ManageRulesPage';
import ManageAbsencesPage from './_components/ManageAbsencesPage';
import AgendaSettingsModal from './_components/AgendaSettingsModal';
import UpcomingAppointmentsPanel from './UpcomingAppointmentsPanel';
import { useAuth } from '../_providers/AuthProvider';
import { generateSlotsFromRules, mergeSlotsWithBooked, AvailabilityRule, DoctorAbsence } from './utils/generateSlots';
import { toast } from '../_components/Toaster';
import { useAgendaSettings } from '../_hooks/useAgendaSettings';

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
  isTelemedicine: boolean;
  durationMins: number;
  color?: string | null;
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

  // Ajouter le token JWT depuis localStorage pour cross-origin
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
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
  const { getDisplayHours } = useAgendaSettings();
  const [bookedSlots, setBookedSlots] = useState<Slot[]>([]); // Only slots with appointments
  const [rules, setRules] = useState<AvailabilityRule[]>([]); // Availability rules
  const [absences, setAbsences] = useState<DoctorAbsence[]>([]); // Doctor absences
  const [appointmentKinds, setAppointmentKinds] = useState<AppointmentKind[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'list' | 'day' | 'week' | 'month'>('week');

  // Filtres (multi-select)
  const [selectedMotifs, setSelectedMotifs]     = useState<string[]>([]);
  const [selectedAgendas, setSelectedAgendas]   = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  // Sheet state for appointments
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isAppointmentSheetOpen, setIsAppointmentSheetOpen] = useState(false);

  // Sheet state for available slots
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [isSlotSheetOpen, setIsSlotSheetOpen] = useState(false);

  // Modal state for creating appointment
  const [isCreateAppointmentModalOpen, setIsCreateAppointmentModalOpen] = useState(false);
  const [createAppointmentSlot, setCreateAppointmentSlot] = useState<{ start: string; end: string } | null>(null);

  // Modal state for editing appointment
  const [isEditAppointmentModalOpen, setIsEditAppointmentModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);

  // Copy/Move mode state
  const [isCopyMode, setIsCopyMode] = useState(false);
  const [isMoveMode, setIsMoveMode] = useState(false);
  const [copiedAppointment, setCopiedAppointment] = useState<any>(null);

  // Mobile sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCreateAvailabilityWizardOpen, setIsCreateAvailabilityWizardOpen] = useState(false);
  const [isManageRulesPageOpen, setIsManageRulesPageOpen] = useState(false);
  const [isManageAbsencesPageOpen, setIsManageAbsencesPageOpen] = useState(false);
  const [isAgendaSettingsModalOpen, setIsAgendaSettingsModalOpen] = useState(false);

  const handleAppointmentClick = (appointment: any) => {
    setSelectedAppointment(appointment);
    setIsAppointmentSheetOpen(true);
  };

  const handleSlotClick = (slot: Slot) => {
    // Si en mode Move ou Copy, coller le rendez-vous
    if ((isMoveMode || isCopyMode) && copiedAppointment) {
      handlePasteAppointment(slot);
    } else if (slot.appointments && slot.appointments.length > 0) {
      // Open appointment sheet
      setSelectedSlot(slot);
      setIsSlotSheetOpen(true);
    } else {
      // Open create appointment modal for empty slot
      setCreateAppointmentSlot({ start: slot.start, end: slot.end });
      setIsCreateAppointmentModalOpen(true);
    }
  };

  const handleCopyAppointment = (appointment: any) => {
    setCopiedAppointment(appointment);
    setIsCopyMode(true);
    setIsMoveMode(false);
    setIsAppointmentSheetOpen(false);
    toast.info('Mode copier activé', {
      description: 'Cliquez sur une plage horaire disponible pour coller le rendez-vous'
    });
  };

  const handlePasteAppointment = async (targetSlot: Slot) => {
    if (!copiedAppointment) return;

    // Vérifier que la date n'est pas dans le passé
    const targetDate = new Date(targetSlot.start);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (targetDate < today) {
      toast.error('Date invalide', {
        description: 'Vous ne pouvez pas copier/déplacer un rendez-vous à une date passée'
      });
      return;
    }

    if (isMoveMode) {
      // Mode déplacement: mettre à jour le rendez-vous existant
      try {
        await toast.promise(
          authedFetch(`/appointments/${copiedAppointment.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
              slotStart: targetSlot.start,
              slotEnd: targetSlot.end,
            }),
          }),
          {
            loading: 'Déplacement du rendez-vous...',
            success: 'Rendez-vous déplacé avec succès !',
            error: 'Erreur lors du déplacement du rendez-vous',
          }
        );
        setIsMoveMode(false);
        setCopiedAppointment(null);
        await load(); // Reload appointments
      } catch (error) {
        console.error('Error moving appointment:', error);
      }
    } else {
      // Mode copie: ouvrir le modal pour créer un nouveau rendez-vous
      setCreateAppointmentSlot({
        start: targetSlot.start,
        end: targetSlot.end,
      });
      setIsCreateAppointmentModalOpen(true);
      setIsCopyMode(false);
    }
  };

  const handleCancelCopyMode = () => {
    setIsCopyMode(false);
    setIsMoveMode(false);
    setCopiedAppointment(null);
    toast.info('Mode copier/déplacer désactivé');
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
    try {
      await toast.promise(
        authedFetch(`/slots/${slotId}`, { method: 'DELETE' }),
        {
          loading: 'Suppression du créneau...',
          success: 'Créneau supprimé avec succès !',
          error: 'Erreur lors de la suppression du créneau',
        }
      );
      await load(); // Reload slots
    } catch (error) {
      console.error('Error deleting slot:', error);
    }
  };

  const handleUpdateSlot = async (slotId: string, data: any) => {
    try {
      await toast.promise(
        authedFetch(`/slots/${slotId}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        }),
        {
          loading: 'Mise à jour du créneau...',
          success: 'Créneau mis à jour avec succès !',
          error: 'Erreur lors de la mise à jour du créneau',
        }
      );
      await load(); // Reload slots
    } catch (error) {
      console.error('Error updating slot:', error);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      await toast.promise(
        authedFetch(`/appointments/${appointmentId}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'CANCELLED' }),
        }),
        {
          loading: 'Annulation du rendez-vous...',
          success: 'Rendez-vous annulé avec succès !',
          error: 'Erreur lors de l\'annulation du rendez-vous',
        }
      );
      setIsAppointmentSheetOpen(false);
      setSelectedAppointment(null);
      await load(); // Reload appointments
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    }
  };

  const handleConfirmAppointment = async (appointmentId: string) => {
    try {
      await toast.promise(
        authedFetch(`/appointments/${appointmentId}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'CONFIRMED' }),
        }),
        {
          loading: 'Confirmation du rendez-vous...',
          success: 'Rendez-vous confirmé avec succès !',
          error: 'Erreur lors de la confirmation du rendez-vous',
        }
      );
      setIsAppointmentSheetOpen(false);
      setSelectedAppointment(null);
      await load(); // Reload appointments
    } catch (error) {
      console.error('Error confirming appointment:', error);
    }
  };

  const handleUpdateAppointment = async (appointmentId: string, data: any) => {
    try {
      await toast.promise(
        authedFetch(`/appointments/${appointmentId}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        }),
        {
          loading: 'Mise à jour du rendez-vous...',
          success: 'Rendez-vous mis à jour avec succès !',
          error: 'Erreur lors de la mise à jour du rendez-vous',
        }
      );
      setIsAppointmentSheetOpen(false);
      setSelectedAppointment(null);
      await load(); // Reload appointments
    } catch (error) {
      console.error('Error updating appointment:', error);
    }
  };

  const handleMoveAppointment = (appointment: any) => {
    // Activer le mode "déplacement"
    setCopiedAppointment(appointment);
    setIsMoveMode(true);
    setIsCopyMode(false);
    setIsAppointmentSheetOpen(false);
    toast.info('Mode déplacer activé', {
      description: 'Cliquez sur une plage horaire disponible pour déplacer le rendez-vous'
    });
  };

  const handleEditAppointment = (appointment: any) => {
    setEditingAppointment(appointment);
    setIsEditAppointmentModalOpen(true);
    setIsAppointmentSheetOpen(false);
  };

  const handleSaveEditedAppointment = async (appointmentId: string, data: any) => {
    try {
      await toast.promise(
        authedFetch(`/appointments/${appointmentId}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        }),
        {
          loading: 'Mise à jour du rendez-vous...',
          success: 'Rendez-vous mis à jour avec succès !',
          error: 'Erreur lors de la mise à jour du rendez-vous',
        }
      );
      setIsEditAppointmentModalOpen(false);
      setEditingAppointment(null);
      await load();
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
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

  // Générer les heures basées sur les paramètres de l'agenda
  const hours = getDisplayHours();

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      // Charger les règles de disponibilité
      const rulesResponse = await authedFetch('/availability-rules/mine', { method: 'GET' });
      const rulesData = await rulesResponse.json().catch(() => []);
      setRules(Array.isArray(rulesData) ? rulesData : rulesData?.data || []);

      // Charger UNIQUEMENT les slots avec appointments (booked slots)
      const slotsResponse = await authedFetch('/slots/mine', { method: 'GET' });
      const slotsData = await slotsResponse.json().catch(() => []);
      setBookedSlots(Array.isArray(slotsData) ? slotsData : slotsData?.data || []);

      // Charger les types de consultations (AppointmentKinds)
      const kindsResponse = await authedFetch('/appointment-kinds', { method: 'GET' });
      const kindsData = await kindsResponse.json().catch(() => []);
      setAppointmentKinds(Array.isArray(kindsData) ? kindsData : kindsData?.data || []);

      // Charger les absences du médecin
      const absencesResponse = await authedFetch('/doctor-absences/mine', { method: 'GET' });
      const absencesData = await absencesResponse.json().catch(() => []);
      setAbsences(Array.isArray(absencesData) ? absencesData : absencesData?.data || []);
    } catch (e: any) {
      if (e?.message?.includes('Non authentifié')) {
        router.replace('/auth/login');
      } else {
        const errorMessage = e?.message || 'Erreur de chargement';
        setErr(errorMessage);
        toast.error('Erreur de chargement', {
          description: errorMessage
        });
      }
    } finally {
      setLoading(false);
    }
  }

  // Générer dynamiquement tous les slots à partir des règles
  // et fusionner avec les slots réservés (booked)
  const allSlots = useMemo(() => {
    // Calculer la plage de dates à afficher selon la vue
    let viewStartDate = new Date(currentDate);
    let viewEndDate = new Date(currentDate);

    if (view === 'week') {
      // Début de semaine (lundi)
      const day = viewStartDate.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      viewStartDate.setDate(viewStartDate.getDate() + diffToMonday);
      viewStartDate.setHours(0, 0, 0, 0);

      // Fin de semaine (dimanche)
      viewEndDate = new Date(viewStartDate);
      viewEndDate.setDate(viewEndDate.getDate() + 6);
      viewEndDate.setHours(23, 59, 59, 999);
    } else if (view === 'day') {
      viewStartDate.setHours(0, 0, 0, 0);
      viewEndDate.setHours(23, 59, 59, 999);
    } else if (view === 'month') {
      viewStartDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      viewEndDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);
    } else {
      // list - afficher une semaine
      const day = viewStartDate.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      viewStartDate.setDate(viewStartDate.getDate() + diffToMonday);
      viewStartDate.setHours(0, 0, 0, 0);
      viewEndDate = new Date(viewStartDate);
      viewEndDate.setDate(viewEndDate.getDate() + 6);
      viewEndDate.setHours(23, 59, 59, 999);
    }

    // Générer les slots à partir des règles en excluant les absences
    const generatedSlots = generateSlotsFromRules(rules, viewStartDate, viewEndDate, absences);

    // Fusionner avec les slots réservés
    return mergeSlotsWithBooked(generatedSlots, bookedSlots);
  }, [rules, bookedSlots, absences, currentDate, view]);

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

  // Filtrer les slots selon les critères sélectionnés (multi-select)
  const filteredSlots = allSlots.filter((slot) => {
    if (selectedStatuses.length > 0 && !selectedStatuses.includes(slot.status)) {
      return false;
    }
    if (selectedAgendas.length > 0 && !selectedAgendas.includes(slot.ownerId)) {
      return false;
    }
    if (selectedMotifs.length > 0) {
      const hasMatchingAppointment = slot.appointments?.some(
        (apt: any) => selectedMotifs.includes(apt.kindId)
      );
      if (!hasMatchingAppointment) return false;
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
    <div className="flex h-screen bg-white">
      {/* Sidebar Gauche - Calendrier Mensuel */}
      <div className="hidden lg:flex w-56 bg-white border-r border-gray-200 p-3 flex-col overflow-y-auto">
        {/* Boutons d'actions */}
        <div className="space-y-2 mb-3">
          <button
            onClick={() => setIsCreateAvailabilityWizardOpen(true)}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white px-2 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Nouvelle Disponibilité
          </button>
          <button
            onClick={() => setIsManageRulesPageOpen(true)}
            className="w-full border-2 border-teal-600 text-teal-600 hover:bg-teal-50 px-2 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            Gérer les règles
          </button>
          <button
            onClick={() => setIsManageAbsencesPageOpen(true)}
            className="w-full border-2 border-amber-600 text-amber-600 hover:bg-amber-50 px-2 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            Gérer les absences
          </button>
          <button
            onClick={() => setIsAgendaSettingsModalOpen(true)}
            className="w-full border-2 border-gray-400 text-gray-600 hover:bg-gray-50 px-2 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            Configurer l'affichage
          </button>
        </div>

        {/* Mini Calendrier */}
        <PlanningCalendar selectedDate={selectedDate} onDateChange={setSelectedDate} absences={absences} />

        {/* Filtres */}
        <div className="mt-3 border-t border-gray-200 pt-3">
          <h4 className="text-[0.625rem] font-semibold text-gray-700 mb-2 uppercase tracking-wide">Filtres</h4>
          <PlanningFilters
            motifs={motifOptions}
            agendas={agendaOptions}
            statuses={statusOptions}
            selectedMotifs={selectedMotifs}
            selectedAgendas={selectedAgendas}
            selectedStatuses={selectedStatuses}
            onMotifChange={setSelectedMotifs}
            onAgendaChange={setSelectedAgendas}
            onStatusChange={setSelectedStatuses}
          />
        </div>

        {/* Prochains rendez-vous */}
        <UpcomingAppointmentsPanel allSlots={allSlots} />
      </div>

      {/* Contenu Principal - Planning */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Alerts */}
        {err && (
          <Alert variant="destructive" className="m-3">
            <AlertDescription className="text-sm">{err}</AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-2 sm:px-3 py-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
            {/* Navigation Date */}
            <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto">
              {/* Bouton Menu Hamburger - Mobile uniquement */}
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden p-1.5 hover:bg-gray-100 rounded touch-manipulation"
                aria-label="Ouvrir le menu"
              >
                <Menu className="w-5 h-5 text-gray-700" />
              </button>

              <h2 className="text-sm font-semibold text-gray-800 hidden sm:block">Planning</h2>
              <div className="flex items-center gap-0.5 flex-1 sm:flex-initial">
                <button onClick={goToPrevious} className="p-1 hover:bg-gray-100 rounded touch-manipulation">
                  <ChevronLeft className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                </button>
                <span className="text-[0.65rem] sm:text-[0.625rem] font-medium text-gray-600 min-w-[140px] sm:min-w-[160px] text-center capitalize px-1">
                  {getDateRangeLabel()}
                </span>
                <button onClick={goToNext} className="p-1 hover:bg-gray-100 rounded touch-manipulation">
                  <ChevronRight className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                </button>
              </div>
            </div>

            {/* Group Buttons Vue */}
            <div className="inline-flex rounded-lg border border-gray-300 bg-white overflow-hidden w-full sm:w-auto">
              {[
                { label: 'Liste', value: 'list' },
                { label: 'Jour', value: 'day', fullLabel: 'Journée' },
                { label: 'Semaine', value: 'week' },
                { label: 'Mois', value: 'month' },
              ].map((tab, index, arr) => (
                <button
                  key={tab.value}
                  onClick={() => setView(tab.value as any)}
                  className={`flex-1 sm:flex-initial px-2 sm:px-2.5 py-1.5 sm:py-1 text-[0.65rem] sm:text-[0.625rem] font-medium transition-colors touch-manipulation ${
                    view === tab.value
                      ? 'bg-teal-600 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  } ${index !== arr.length - 1 ? 'border-r border-gray-300' : ''}`}
                >
                  <span className="hidden sm:inline">{tab.fullLabel || tab.label}</span>
                  <span className="sm:hidden">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Vue Planning */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <>
              {view === 'week' && <PlanningWeekViewSkeleton />}
              {view === 'list' && <PlanningListViewSkeleton />}
              {view === 'day' && <PlanningDayViewSkeleton />}
              {view === 'month' && <PlanningMonthViewSkeleton />}
            </>
          ) : (
            <>
              {view === 'week' && (
                <PlanningWeekView
                  slots={filteredSlots}
                  weekDays={weekDays}
                  hours={hours}
                  onAppointmentClick={handleAppointmentClick}
                  onSlotClick={handleSlotClick}
                  isCopyMode={isCopyMode}
                />
              )}
              {view === 'list' && (
                <PlanningListView
                  slots={filteredSlots}
                  currentDate={currentDate}
                  onAppointmentClick={handleAppointmentClick}
                  onSlotClick={handleSlotClick}
                  isCopyMode={isCopyMode}
                />
              )}
              {view === 'day' && (
                <PlanningDayView
                  slots={filteredSlots}
                  currentDate={currentDate}
                  hours={hours}
                  onAppointmentClick={handleAppointmentClick}
                  onSlotClick={handleSlotClick}
                  isCopyMode={isCopyMode}
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
        onCopy={handleCopyAppointment}
        onCancel={handleCancelAppointment}
        onConfirm={handleConfirmAppointment}
        onUpdate={handleUpdateAppointment}
        onMove={handleMoveAppointment}
        onEdit={handleEditAppointment}
        authedFetch={authedFetch}
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

      {/* Create Appointment Modal */}
      {createAppointmentSlot && (
        <CreateAppointmentModal
          isOpen={isCreateAppointmentModalOpen}
          onClose={() => {
            setIsCreateAppointmentModalOpen(false);
            setCreateAppointmentSlot(null);
            setCopiedAppointment(null);
          }}
          slotStart={createAppointmentSlot.start}
          slotEnd={createAppointmentSlot.end}
          onAppointmentCreated={load}
          apiBase={getApiBase() || ''}
          copiedAppointment={copiedAppointment}
        />
      )}

      {/* Edit Appointment Modal */}
      <EditAppointmentModal
        appointment={editingAppointment}
        isOpen={isEditAppointmentModalOpen}
        onClose={() => {
          setIsEditAppointmentModalOpen(false);
          setEditingAppointment(null);
        }}
        onSave={handleSaveEditedAppointment}
        appointmentKinds={appointmentKinds}
        authedFetch={authedFetch}
      />

      {/* Copy/Move Mode Banner */}
      {(isCopyMode || isMoveMode) && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 bg-yellow-100 border-2 border-yellow-400 rounded-lg shadow-lg px-6 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="font-medium text-yellow-900">
              {isMoveMode
                ? 'Mode déplacer activé - Cliquez sur une plage horaire pour déplacer le rendez-vous'
                : 'Mode copier activé - Cliquez sur une plage horaire pour coller le rendez-vous'
              }
            </span>
          </div>
          <button
            onClick={handleCancelCopyMode}
            className="px-4 py-1.5 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors text-sm font-medium"
          >
            Annuler
          </button>
        </div>
      )}

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      >
        {/* Boutons d'actions */}
        <div className="p-3 space-y-2">
          <button
            onClick={() => {
              setIsMobileSidebarOpen(false);
              setIsCreateAvailabilityWizardOpen(true);
            }}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Nouvelle Disponibilité
          </button>
          <button
            onClick={() => {
              setIsMobileSidebarOpen(false);
              setIsManageRulesPageOpen(true);
            }}
            className="w-full border-2 border-teal-600 text-teal-600 hover:bg-teal-50 px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm font-medium"
          >
            <Settings className="w-4 h-4" />
            Gérer les règles
          </button>
          <button
            onClick={() => {
              setIsMobileSidebarOpen(false);
              setIsManageAbsencesPageOpen(true);
            }}
            className="w-full border-2 border-amber-600 text-amber-600 hover:bg-amber-50 px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm font-medium"
          >
            <Settings className="w-4 h-4" />
            Gérer les absences
          </button>
          <button
            onClick={() => {
              setIsMobileSidebarOpen(false);
              setIsAgendaSettingsModalOpen(true);
            }}
            className="w-full border-2 border-gray-400 text-gray-600 hover:bg-gray-50 px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm font-medium"
          >
            <Settings className="w-4 h-4" />
            Configurer l'affichage
          </button>
        </div>

        {/* Mini Calendrier */}
        <div className="px-3">
          <PlanningCalendar
            selectedDate={selectedDate}
            onDateChange={(date) => {
              setSelectedDate(date);
              setIsMobileSidebarOpen(false); // Fermer après sélection
            }}
            absences={absences}
          />
        </div>

        {/* Filtres */}
        <div className="mt-3 border-t border-gray-200 pt-3 px-3">
          <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Filtres</h4>
          <PlanningFilters
            motifs={motifOptions}
            agendas={agendaOptions}
            statuses={statusOptions}
            selectedMotifs={selectedMotifs}
            selectedAgendas={selectedAgendas}
            selectedStatuses={selectedStatuses}
            onMotifChange={setSelectedMotifs}
            onAgendaChange={setSelectedAgendas}
            onStatusChange={setSelectedStatuses}
          />
        </div>

        {/* Prochains rendez-vous */}
        <div className="px-3">
          <UpcomingAppointmentsPanel allSlots={allSlots} />
        </div>
      </MobileSidebar>

      {/* Wizard de création de disponibilités */}
      <CreateAvailabilityWizard
        isOpen={isCreateAvailabilityWizardOpen}
        onClose={() => setIsCreateAvailabilityWizardOpen(false)}
        onSuccess={() => {
          setIsCreateAvailabilityWizardOpen(false);
          load(); // Refresh planning
        }}
      />

      {/* Page de gestion des règles */}
      <ManageRulesPage
        isOpen={isManageRulesPageOpen}
        onClose={() => setIsManageRulesPageOpen(false)}
        onRuleUpdated={() => load()} // Refresh planning when rules are updated
      />

      {/* Page de gestion des absences */}
      <ManageAbsencesPage
        isOpen={isManageAbsencesPageOpen}
        onClose={() => setIsManageAbsencesPageOpen(false)}
        onAbsenceUpdated={() => load()} // Refresh planning when absences are updated
      />

      {/* Modal de configuration de l'agenda */}
      <AgendaSettingsModal
        isOpen={isAgendaSettingsModalOpen}
        onClose={() => setIsAgendaSettingsModalOpen(false)}
      />
    </div>
  );
}