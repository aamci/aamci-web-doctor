'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  FileText,
  AlertTriangle,
  Home,
  ClipboardList,
  Settings,
  History,
  Heart,
  Folder,
  Eye,
  Pill,
  TestTube,
  Shield,
  Receipt,
  Plus,
  MessageSquare,
  Edit,
  Upload,
  ChevronRight,
  CheckCircle,
  X,
  Tag,
} from 'lucide-react';

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
}

interface Appointment {
  id: string;
  status: string;
  notes: string | null;
  createdAt: string;
  slot: {
    start: string;
    end: string;
  };
  kind: {
    name: string;
  } | null;
}

interface PatientDetails {
  patient: Patient;
  appointments: Appointment[];
  stats: {
    totalAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    upcomingAppointments: number;
  };
}

type MenuSection =
  | 'home'
  | 'consultations'
  | 'infos'
  | 'historique'
  | 'antecedents'
  | 'documents'
  | 'observations'
  | 'traitement'
  | 'biologie'
  | 'vaccination'
  | 'factures';

interface AppointmentKind {
  id: string;
  name: string;
  durationMins: number;
  color: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
}

// Modal Nouveau RDV
function NewRdvModal({
  isOpen,
  onClose,
  patient,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  onSuccess: () => void;
}) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [kindId, setKindId] = useState('');
  const [notes, setNotes] = useState('');
  const [kinds, setKinds] = useState<AppointmentKind[]>([]);
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3002';

  useEffect(() => {
    if (isOpen) {
      fetchKinds();
      // Set default date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDate(tomorrow.toISOString().split('T')[0]);
    }
  }, [isOpen]);

  const fetchKinds = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/appointment-kinds`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setKinds(data);
        if (data.length > 0) setKindId(data[0].id);
      }
    } catch (e) {
      console.error('Error fetching kinds:', e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time || !kindId) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const startDateTime = new Date(`${date}T${time}`);
      const selectedKind = kinds.find((k) => k.id === kindId);
      const duration = selectedKind?.durationMins || 30;
      const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

      // Create slot first
      const slotRes = await fetch(`${API_BASE_URL}/slots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          start: startDateTime.toISOString(),
          end: endDateTime.toISOString(),
          capacity: 1,
        }),
      });

      if (!slotRes.ok) throw new Error('Failed to create slot');
      const slot = await slotRes.json();

      // Create appointment
      const aptRes = await fetch(`${API_BASE_URL}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          slotId: slot.id,
          patientId: patient.id,
          kindId,
          notes,
        }),
      });

      if (!aptRes.ok) throw new Error('Failed to create appointment');

      onSuccess();
      onClose();
      setDate('');
      setTime('09:00');
      setNotes('');
    } catch (error) {
      console.error('Error creating appointment:', error);
      alert('Erreur lors de la création du rendez-vous');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Nouveau rendez-vous</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="p-3 bg-teal-50 rounded-lg">
            <p className="text-sm font-medium text-teal-800">Patient</p>
            <p className="text-teal-600">{patient.fullName}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Heure</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type de consultation
            </label>
            <select
              value={kindId}
              onChange={(e) => setKindId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              required
            >
              {kinds.map((kind) => (
                <option key={kind.id} value={kind.id}>
                  {kind.name} ({kind.durationMins} min)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optionnel)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
              placeholder="Notes pour ce rendez-vous..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
            >
              {loading ? 'Création...' : 'Créer le RDV'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal Nouvelle Note
function NewNoteModal({
  isOpen,
  onClose,
  patient,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3002';

  const suggestedTags = ['Consultation', 'Suivi', 'Urgent', 'Ordonnance', 'Résultats', 'Appel'];

  const handleAddTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/medical-notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patientId: patient.id,
          title,
          content,
          tags,
        }),
      });

      if (!res.ok) throw new Error('Failed to create note');

      onSuccess();
      onClose();
      setTitle('');
      setContent('');
      setTags([]);
    } catch (error) {
      console.error('Error creating note:', error);
      alert('Erreur lors de la création de la note');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Nouvelle note médicale</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="p-3 bg-teal-50 rounded-lg">
            <p className="text-sm font-medium text-teal-800">Patient</p>
            <p className="text-teal-600">{patient.fullName}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Titre de la note..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contenu</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
              placeholder="Contenu de la note..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-teal-100 text-teal-700 rounded-full text-sm"
                >
                  {tag}
                  <button type="button" onClick={() => handleRemoveTag(tag)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag(newTag);
                  }
                }}
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Ajouter un tag..."
              />
              <button
                type="button"
                onClick={() => handleAddTag(newTag)}
                className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {suggestedTags
                .filter((t) => !tags.includes(t))
                .map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleAddTag(tag)}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                  >
                    + {tag}
                  </button>
                ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
            >
              {loading ? 'Création...' : 'Créer la note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PatientDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params?.id as string;

  const [data, setData] = useState<PatientDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<MenuSection>('home');
  const [isRdvModalOpen, setIsRdvModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3002';

  useEffect(() => {
    if (patientId) {
      fetchPatientDetails();
      fetchNotes();
    }
  }, [patientId]);

  const fetchNotes = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/medical-notes/patient/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const fetchPatientDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/patients/${patientId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching patient details:', error);
    } finally {
      setLoading(false);
    }
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Patient non trouvé</p>
          <button
            onClick={() => router.push('/patients')}
            className="mt-4 text-teal-600 hover:text-teal-800"
          >
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  const { patient, appointments, stats } = data;
  const age = calculateAge(patient.birthdate);
  const upcomingAppointments = appointments.filter(
    (a) => a.status !== 'CANCELLED' && new Date(a.slot.start) > new Date()
  );

  const menuItems = [
    { id: 'home' as const, label: 'HOME', icon: Home },
    { id: 'consultations' as const, label: 'CONSULTATION EN COURS', icon: ClipboardList },
    { id: 'infos' as const, label: 'INFOS ADMINISTRATIVES', icon: Settings },
    { id: 'historique' as const, label: 'HISTORIQUE', icon: History },
    { id: 'antecedents' as const, label: 'ANTÉCÉDENTS ET MODE DE VIE', icon: Heart },
    { id: 'documents' as const, label: 'DOCUMENTS', icon: Folder },
    { id: 'observations' as const, label: 'OBSERVATIONS', icon: Eye },
    { id: 'traitement' as const, label: 'TRAITEMENT EN COURS', icon: Pill },
    { id: 'biologie' as const, label: 'BIOLOGIE ET BIOMÉTRIE', icon: TestTube },
    { id: 'vaccination' as const, label: 'CARNET DE VACCINATION', icon: Shield },
    { id: 'factures' as const, label: 'FACTURES', icon: Receipt },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar Menu */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Patient Header */}
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={() => router.push('/patients')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
              <span className="text-teal-700 font-semibold">
                {getInitials(patient.fullName)}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-500">MONSIEUR</p>
              <h2 className="font-bold text-gray-900">
                {patient.fullName?.split(' ').slice(-1)[0]?.toUpperCase() || 'NOM'}
              </h2>
              <p className="font-medium text-gray-700">
                {patient.fullName?.split(' ').slice(0, -1).join(' ') || ''}
              </p>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            <p>{formatDate(patient.birthdate)} ({age} ans)</p>
            <p className="text-teal-600">MT : Harmonie Mutuelle</p>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            <p>N° SS : 1 48 45 ...</p>
          </div>
        </div>

        {/* Warning */}
        <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
            <p className="text-xs text-amber-700">
              Aucun dossier imparti référencé. Si ce repère manque après ajout de l'assurance maladie et du nom ou date de naissance, essayez de créer le dossier.
            </p>
          </div>
          <button className="mt-2 text-xs text-teal-600 font-medium">
            + Ajouter du contenu
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto py-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-xs font-medium transition-colors ${
                activeSection === item.id
                  ? 'bg-teal-50 text-teal-700 border-l-3 border-teal-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Memo */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Mémo</span>
            <button className="text-xs text-gray-400">Ouvrir</button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Header Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{patient.fullName?.toUpperCase()}</h1>
              <p className="text-sm text-gray-500">{formatDate(patient.birthdate)} ({age} ans)</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Alertes */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-amber-700">Alertes actives</span>
              </div>
            </div>
          </div>

          {/* Medical Alert */}
          <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded">
                MEDICAL
              </span>
              <span className="text-sm text-gray-700">
                Diabète type 2 - surveillance glycémie
              </span>
              <button className="ml-auto text-xs text-teal-600">Voir détail</button>
              <button className="text-xs text-gray-400">Traité</button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="px-6 py-4">
          <div className="grid grid-cols-4 gap-4 mb-6">
            <StatCard
              value={stats.totalAppointments}
              label="RDV Total"
              color="teal"
            />
            <StatCard
              value={stats.upcomingAppointments}
              label="À venir"
              color="blue"
            />
            <StatCard
              value={notes.length}
              label="Notes"
              color="gray"
            />
            <StatCard
              value={1}
              label="Alertes"
              color="amber"
            />
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-3 gap-6">
            {/* Prochains RDV */}
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Prochains rendez-vous</h3>
                <button className="text-xs text-teal-600">Voir tout →</button>
              </div>
              {upcomingAppointments.length > 0 ? (
                <div className="space-y-3">
                  {upcomingAppointments.slice(0, 3).map((apt) => (
                    <div key={apt.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {new Date(apt.slot.start).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{apt.kind?.name || 'Consultation'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  Aucun rendez-vous à venir
                </div>
              )}
              <button
                onClick={() => setIsRdvModalOpen(true)}
                className="mt-4 w-full py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Planifier un RDV
              </button>
              <button
                onClick={() => setIsRdvModalOpen(true)}
                className="mt-2 w-full py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                + Nouveau rendez-vous
              </button>
            </div>

            {/* Coordonnées */}
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Coordonnées</h3>
                <button className="text-xs text-teal-600">Modifier →</button>
              </div>
              <div className="space-y-3">
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

            {/* Actions rapides */}
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Actions rapides</h3>
                <button className="text-xs text-gray-400">
                  <Edit className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setIsRdvModalOpen(true)}
                  className="p-3 bg-teal-50 text-teal-700 rounded-lg text-xs font-medium hover:bg-teal-100 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Nouveau RDV
                </button>
                <button
                  onClick={() => setIsNoteModalOpen(true)}
                  className="p-3 bg-gray-50 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Ajouter note
                </button>
                <button className="p-3 bg-gray-50 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Message
                </button>
                <button
                  onClick={() => setIsRdvModalOpen(true)}
                  className="p-3 bg-gray-50 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Multi-RDV
                </button>
              </div>
            </div>
          </div>

          {/* Second Row */}
          <div className="grid grid-cols-3 gap-6 mt-6">
            {/* Notes récentes */}
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Notes récentes</h3>
                <button className="text-xs text-teal-600">Voir tout →</button>
              </div>
              {notes.length > 0 ? (
                <div className="space-y-3">
                  {notes.slice(0, 3).map((note) => (
                    <div key={note.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900">{note.title}</p>
                        <span className="text-xs text-gray-500">
                          {new Date(note.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">{note.content}</p>
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {note.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  Aucune note
                </div>
              )}
              <button
                onClick={() => setIsNoteModalOpen(true)}
                className="mt-3 w-full py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Ajouter une note
              </button>
            </div>

            {/* Résumé clinique */}
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Résumé clinique</h3>
                <button className="text-xs text-teal-600">Ouvrir →</button>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Diagnostics actifs</p>
                  <div className="flex flex-wrap gap-1">
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                      Hypertension
                    </span>
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                      Diabète T2
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Allergies</p>
                  <p className="text-sm text-gray-700">-</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Traitements principaux</p>
                  <p className="text-sm text-gray-700">
                    <CheckCircle className="w-3 h-3 inline mr-1 text-green-500" />
                    Metformine 500mg, Lisinopril 10mg
                  </p>
                </div>
              </div>
            </div>

            {/* Documents récents */}
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Documents récents</h3>
                <button className="text-xs text-teal-600">Ouvrir →</button>
              </div>
              <div className="text-center py-8 text-gray-500 text-sm">
                <Folder className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                Aucun document récent
              </div>
              <button className="mt-2 w-full py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                <Upload className="w-4 h-4" />
                Importer un document
              </button>
            </div>
          </div>

          {/* Prévention */}
          <div className="mt-6 bg-white rounded-xl p-5 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Prévention</h3>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-700">Rappel vaccin grippe</span>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                Échu
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <NewRdvModal
        isOpen={isRdvModalOpen}
        onClose={() => setIsRdvModalOpen(false)}
        patient={patient}
        onSuccess={() => {
          fetchPatientDetails();
        }}
      />
      <NewNoteModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        patient={patient}
        onSuccess={() => {
          fetchNotes();
        }}
      />
    </div>
  );
}

function StatCard({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: 'teal' | 'blue' | 'gray' | 'amber';
}) {
  const colorClasses = {
    teal: 'text-teal-600 bg-teal-50 border-teal-200',
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    gray: 'text-gray-600 bg-gray-50 border-gray-200',
    amber: 'text-amber-600 bg-amber-50 border-amber-200',
  };

  return (
    <div className={`rounded-xl p-4 border ${colorClasses[color]}`}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-xs mt-1 opacity-80">{label}</div>
    </div>
  );
}
