'use client';

import React, { useState, useEffect } from 'react';
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
  Syringe,
  Activity,
  Thermometer,
  Scale,
  Ruler,
  Stethoscope,
  AlertCircle,
  Users,
  Search,
  Filter,
  Download,
  Printer,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Send,
  Award,
  FileSignature,
  Inbox,
  Reply,
  Target,
  Briefcase,
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3002';

// Types
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
  patientProfile?: PatientProfile;
}

interface PatientProfile {
  id: string;
  civility: string | null;
  birthLastName: string | null;
  usageLastName: string | null;
  firstName: string | null;
  birthDate: string | null;
  birthPlace: string | null;
  birthCountry: string | null;
  phonePrimary: string | null;
  phoneSecondary: string | null;
  addressLine1: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
  socialSecurityNumber: string | null;
  insuranceProvider: string | null;
  mutualInsurance: string | null;
  primaryDoctorName: string | null;
  bloodGroup: string | null;
  heightCm: number | null;
  weightKg: number | null;
  patientCode: string | null;
}

interface MedicalHistory {
  id: string;
  category: string;
  title: string;
  description: string | null;
  severity: string | null;
  diagnosedAt: string | null;
  resolvedAt: string | null;
  isActive: boolean;
  doctor?: { id: string; fullName: string };
}

interface Vaccination {
  id: string;
  vaccineName: string;
  vaccineType: string | null;
  lotNumber: string | null;
  manufacturer: string | null;
  doseNumber: number;
  injectionSite: string | null;
  administeredAt: string;
  nextDoseAt: string | null;
  administeredBy: string | null;
  facilityName: string | null;
}

interface Treatment {
  id: string;
  medicationName: string;
  genericName: string | null;
  dosage: string;
  frequency: string;
  route: string | null;
  instructions: string | null;
  startDate: string;
  endDate: string | null;
  status: string;
  indication: string | null;
  doctor?: { id: string; fullName: string };
}

interface BiometricMeasurement {
  id: string;
  type: string;
  value: number;
  valueSecondary: number | null;
  unit: string;
  measuredAt: string;
  isAbnormal: boolean;
}

interface ClinicalObservation {
  id: string;
  title: string | null;
  content: string;
  category: string;
  isUrgent: boolean;
  observedAt: string;
  doctor?: { id: string; fullName: string };
}

interface LabResult {
  id: string;
  testName: string;
  testCode: string | null;
  category: string;
  value: string;
  unit: string | null;
  normalRange: string | null;
  interpretation: string | null;
  isAbnormal: boolean;
  resultDate: string;
  labName: string | null;
}

interface EmergencyContact {
  id: string;
  fullName: string;
  relationship: string;
  phone: string;
  phoneSecondary: string | null;
  email: string | null;
  isPrimary: boolean;
}

interface PatientConsent {
  id: string;
  type: string;
  granted: boolean;
  grantedAt: string | null;
  signedAt: string | null;
}

interface MedicalDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  category: string;
  title: string | null;
  documentDate: string | null;
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
    ownerId: string;
  };
  kind: {
    name: string;
    isTelemedicine: boolean;
  } | null;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  total: number;
  status: string;
  issueDate: string;
  dueDate: string | null;
  paidAt: string | null;
}

// Certificats médicaux
interface MedicalCertificate {
  id: string;
  type: 'APTITUDE' | 'ARRET_TRAVAIL' | 'SPORT' | 'MEDICAL' | 'VACCINATION' | 'AUTRE';
  title: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  issuedAt: string;
  recipient: string | null;
  doctor?: { id: string; fullName: string };
}

// Correspondances médicales
interface MedicalCorrespondence {
  id: string;
  type: 'INCOMING' | 'OUTGOING';
  category: 'COMPTE_RENDU' | 'DEMANDE_AVIS' | 'REPONSE_AVIS' | 'TRANSFERT' | 'AUTRE';
  subject: string;
  content: string;
  senderName: string;
  senderSpecialty: string | null;
  recipientName: string;
  recipientSpecialty: string | null;
  date: string;
  isRead: boolean;
  attachments: string[];
}

// Messages patient
interface PatientMessage {
  id: string;
  type: 'SMS' | 'EMAIL' | 'APP';
  direction: 'INCOMING' | 'OUTGOING';
  subject: string | null;
  content: string;
  sentAt: string;
  readAt: string | null;
  status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
}

// Protocoles de soins
interface CareProtocol {
  id: string;
  type: 'ALD' | 'PARCOURS_SOINS' | 'PLAN_TRAITEMENT' | 'SUIVI_CHRONIQUE';
  title: string;
  description: string | null;
  pathology: string;
  startDate: string;
  endDate: string | null;
  renewalDate: string | null;
  status: 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'TERMINATED';
  objectives: string[];
  interventions: { name: string; frequency: string; responsible: string }[];
  doctor?: { id: string; fullName: string };
}

interface FullPatientRecord {
  patient: Patient;
  medicalHistory: MedicalHistory[];
  medicalHistoryStats: {
    allergies: number;
    medical: number;
    surgical: number;
    family: number;
    cardiovascular: number;
    lifestyle: number;
  };
  vaccinations: Vaccination[];
  treatments: Treatment[];
  treatmentsStats: {
    active: number;
    paused: number;
    stopped: number;
    completed: number;
    total: number;
  };
  latestBiometrics: {
    weight?: BiometricMeasurement;
    height?: BiometricMeasurement;
    blood_pressure?: BiometricMeasurement;
    heart_rate?: BiometricMeasurement;
    temperature?: BiometricMeasurement;
    oxygen_saturation?: BiometricMeasurement;
  };
  observations: ClinicalObservation[];
  labResults: LabResult[];
  emergencyContacts: EmergencyContact[];
  consents: PatientConsent[];
  documents: MedicalDocument[];
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
  | 'certificats'
  | 'correspondances'
  | 'messagerie'
  | 'protocoles'
  | 'factures';

// Helper functions
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('fr-FR');
};

const formatDateTime = (dateString: string | null | undefined) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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

const getInitials = (name: string | null) => {
  if (!name) return 'U';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const maskSSN = (ssn: string | null) => {
  if (!ssn) return '-';
  if (ssn.length < 5) return ssn;
  return ssn.substring(0, 5) + ' ... ... ...';
};

const CATEGORY_LABELS: Record<string, string> = {
  ALLERGY: 'Allergies',
  MEDICAL: 'Médicaux',
  SURGICAL: 'Chirurgicaux',
  FAMILY: 'Familiaux',
  CARDIOVASCULAR: 'Cardiovasculaires',
  LIFESTYLE: 'Mode de vie',
};

const CONSENT_LABELS: Record<string, { label: string; description: string }> = {
  CARE: { label: 'Consentement aux soins', description: 'Autorisation de recevoir des soins médicaux dans notre établissement' },
  DATA_SHARING: { label: 'Partage de données médicales', description: 'Partage du dossier médical avec les professionnels de santé concernés' },
  TELECONSULTATION: { label: 'Téléconsultation', description: 'Consultations à distance par vidéo sécurisée' },
  EMAIL_COMMUNICATION: { label: 'Communications électroniques', description: 'Recevoir des rappels RDV, résultats et informations par email/SMS' },
  RESEARCH: { label: 'Recherche clinique', description: 'Utilisation anonymisée des données à des fins de recherche médicale' },
};

const OBSERVATION_CATEGORY_LABELS: Record<string, string> = {
  GENERAL: 'Général',
  VITAL_SIGNS: 'Signes vitaux',
  SYMPTOMS: 'Symptômes',
  EXAMINATION: 'Examen',
  EVOLUTION: 'Évolution',
  ALERT: 'Alerte',
};

// Main Component
export default function PatientRecordPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<MenuSection>('home');
  const [record, setRecord] = useState<FullPatientRecord | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [biometricsHistory, setBiometricsHistory] = useState<BiometricMeasurement[]>([]);
  const [expandedSidebarSections, setExpandedSidebarSections] = useState<string[]>(['antecedents', 'biologie', 'traitement']);

  // Mock data pour les nouvelles sections
  const [certificates] = useState<MedicalCertificate[]>([
    {
      id: '1',
      type: 'ARRET_TRAVAIL',
      title: 'Arrêt de travail',
      description: 'Arrêt maladie pour syndrome grippal',
      startDate: '2026-01-15',
      endDate: '2026-01-20',
      issuedAt: '2026-01-15',
      recipient: 'Employeur',
      doctor: { id: 'd1', fullName: 'Dr. Martin Dupont' }
    },
    {
      id: '2',
      type: 'SPORT',
      title: 'Certificat de non contre-indication sportive',
      description: 'Apte à la pratique du football en compétition',
      startDate: '2026-01-10',
      endDate: '2027-01-10',
      issuedAt: '2026-01-10',
      recipient: 'Club sportif',
      doctor: { id: 'd1', fullName: 'Dr. Martin Dupont' }
    },
    {
      id: '3',
      type: 'APTITUDE',
      title: 'Certificat d\'aptitude au travail',
      description: 'Apte au poste de travail sans restriction',
      startDate: '2025-12-01',
      endDate: null,
      issuedAt: '2025-12-01',
      recipient: 'Médecine du travail',
      doctor: { id: 'd1', fullName: 'Dr. Martin Dupont' }
    }
  ]);

  const [correspondences] = useState<MedicalCorrespondence[]>([
    {
      id: '1',
      type: 'INCOMING',
      category: 'COMPTE_RENDU',
      subject: 'Compte-rendu de consultation cardiologique',
      content: 'Suite à votre demande, j\'ai examiné M. Dupont le 10 janvier 2026. L\'examen cardiovasculaire est rassurant. ECG normal, échographie cardiaque sans anomalie.',
      senderName: 'Dr. Sophie Cardio',
      senderSpecialty: 'Cardiologie',
      recipientName: 'Dr. Martin Dupont',
      recipientSpecialty: 'Médecine générale',
      date: '2026-01-12',
      isRead: true,
      attachments: ['ecg_2026-01-10.pdf']
    },
    {
      id: '2',
      type: 'OUTGOING',
      category: 'DEMANDE_AVIS',
      subject: 'Demande d\'avis dermatologique',
      content: 'Cher confrère, je vous adresse M. Dupont pour un avis concernant une lésion cutanée suspecte au niveau du dos.',
      senderName: 'Dr. Martin Dupont',
      senderSpecialty: 'Médecine générale',
      recipientName: 'Dr. Pierre Dermato',
      recipientSpecialty: 'Dermatologie',
      date: '2026-01-08',
      isRead: true,
      attachments: []
    },
    {
      id: '3',
      type: 'INCOMING',
      category: 'REPONSE_AVIS',
      subject: 'Réponse - Avis dermatologique',
      content: 'J\'ai examiné votre patient. La lésion est bénigne (naevus dysplasique). Surveillance annuelle recommandée.',
      senderName: 'Dr. Pierre Dermato',
      senderSpecialty: 'Dermatologie',
      recipientName: 'Dr. Martin Dupont',
      recipientSpecialty: 'Médecine générale',
      date: '2026-01-18',
      isRead: false,
      attachments: ['photos_dermato.pdf']
    }
  ]);

  const [messages] = useState<PatientMessage[]>([
    {
      id: '1',
      type: 'SMS',
      direction: 'OUTGOING',
      subject: null,
      content: 'Rappel: Votre RDV avec Dr. Dupont est prévu demain à 10h00. Pensez à apporter vos résultats d\'analyses.',
      sentAt: '2026-01-14T09:00:00',
      readAt: '2026-01-14T09:15:00',
      status: 'READ'
    },
    {
      id: '2',
      type: 'EMAIL',
      direction: 'OUTGOING',
      subject: 'Résultats d\'analyses disponibles',
      content: 'Bonjour, vos résultats d\'analyses sont disponibles. Je vous invite à prendre RDV pour en discuter.',
      sentAt: '2026-01-10T14:30:00',
      readAt: '2026-01-10T18:45:00',
      status: 'READ'
    },
    {
      id: '3',
      type: 'APP',
      direction: 'INCOMING',
      subject: 'Question sur ordonnance',
      content: 'Bonjour Docteur, j\'ai une question concernant mon traitement. Dois-je prendre le médicament avant ou après le repas ?',
      sentAt: '2026-01-16T11:20:00',
      readAt: null,
      status: 'DELIVERED'
    },
    {
      id: '4',
      type: 'APP',
      direction: 'OUTGOING',
      subject: 'RE: Question sur ordonnance',
      content: 'Bonjour, vous pouvez prendre le médicament pendant le repas pour une meilleure tolérance digestive.',
      sentAt: '2026-01-16T14:00:00',
      readAt: '2026-01-16T14:30:00',
      status: 'READ'
    }
  ]);

  const [protocols] = useState<CareProtocol[]>([
    {
      id: '1',
      type: 'ALD',
      title: 'ALD 30 - Diabète de type 2',
      description: 'Protocole de soins pour affection longue durée',
      pathology: 'Diabète de type 2',
      startDate: '2024-03-15',
      endDate: '2027-03-15',
      renewalDate: '2027-02-15',
      status: 'ACTIVE',
      objectives: [
        'HbA1c < 7%',
        'Pression artérielle < 140/90 mmHg',
        'LDL cholestérol < 1 g/L'
      ],
      interventions: [
        { name: 'Consultation médecin traitant', frequency: 'Trimestrielle', responsible: 'Dr. Martin Dupont' },
        { name: 'Bilan biologique (HbA1c)', frequency: 'Trimestrielle', responsible: 'Laboratoire' },
        { name: 'Consultation ophtalmologique', frequency: 'Annuelle', responsible: 'Ophtalmologue' },
        { name: 'ECG', frequency: 'Annuelle', responsible: 'Cardiologue' }
      ],
      doctor: { id: 'd1', fullName: 'Dr. Martin Dupont' }
    },
    {
      id: '2',
      type: 'PARCOURS_SOINS',
      title: 'Parcours post-opératoire genou',
      description: 'Rééducation suite à arthroscopie du genou droit',
      pathology: 'Lésion méniscale',
      startDate: '2025-11-01',
      endDate: '2026-02-01',
      renewalDate: null,
      status: 'ACTIVE',
      objectives: [
        'Récupération mobilité complète',
        'Reprise activité professionnelle',
        'Reprise sport progressive'
      ],
      interventions: [
        { name: 'Séances de kinésithérapie', frequency: '3x/semaine', responsible: 'Kinésithérapeute' },
        { name: 'Consultation de suivi', frequency: 'Mensuelle', responsible: 'Chirurgien orthopédiste' }
      ],
      doctor: { id: 'd2', fullName: 'Dr. Jean Ortho' }
    }
  ]);

  // Fetch data
  useEffect(() => {
    if (patientId) {
      fetchPatientRecord();
      fetchAppointments();
      fetchInvoices();
    }
  }, [patientId]);

  const fetchPatientRecord = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/patient-record/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setRecord(data);
      }
    } catch (error) {
      console.error('Error fetching patient record:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/patient-record/${patientId}/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/invoices?patientId=${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices || []);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const fetchBiometricsHistory = async (type: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/patient-record/${patientId}/biometrics/history/${type}?limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setBiometricsHistory(data);
      }
    } catch (error) {
      console.error('Error fetching biometrics history:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Chargement du dossier patient...</p>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
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

  const { patient, medicalHistory, medicalHistoryStats, vaccinations, treatments, treatmentsStats, latestBiometrics, observations, labResults, emergencyContacts, consents, documents } = record;
  const profile = patient.patientProfile;
  const age = calculateAge(patient.birthdate || profile?.birthDate || null);

  const toggleSidebarSection = (sectionId: string) => {
    setExpandedSidebarSections(prev =>
      prev.includes(sectionId) ? prev.filter(s => s !== sectionId) : [...prev, sectionId]
    );
  };

  // Get category counts for sidebar
  const allergiesCount = medicalHistory.filter(h => h.category === 'ALLERGY').length;
  const medicalCount = medicalHistory.filter(h => h.category === 'MEDICAL').length;
  const cardiovascularCount = medicalHistory.filter(h => h.category === 'CARDIOVASCULAR').length;
  const surgicalCount = medicalHistory.filter(h => h.category === 'SURGICAL').length;
  const familyCount = medicalHistory.filter(h => h.category === 'FAMILY').length;
  const lifestyleCount = medicalHistory.filter(h => h.category === 'LIFESTYLE').length;

  const menuItems = [
    { id: 'home' as const, label: 'HOME', icon: Home },
    { id: 'consultations' as const, label: 'CONSULTATION EN COURS', icon: ClipboardList },
    {
      id: 'infos' as const,
      label: 'INFOS ADMINISTRATIVES',
      icon: Settings,
      collapsible: true,
      subItems: [
        { label: 'Lieu de naissance', value: profile?.birthPlace || 'Ajouter' },
        { label: 'Tél (portable)', value: profile?.phonePrimary || '-' },
        { label: 'Tél (fixe)', value: profile?.phoneSecondary || 'Ajouter' },
        { label: 'E-mail', value: patient.email || '-' },
        { label: 'Médecin traitant', value: profile?.primaryDoctorName || '-' },
      ]
    },
    { id: 'historique' as const, label: 'HISTORIQUE', icon: History },
    {
      id: 'antecedents' as const,
      label: 'ANTÉCÉDENTS ET MODE DE VIE',
      icon: Heart,
      collapsible: true,
      subItems: [
        { label: 'Allergies', value: allergiesCount > 0 ? `${allergiesCount} élément${allergiesCount > 1 ? 's' : ''}` : 'Aucun', icon: AlertTriangle, color: 'text-orange-500' },
        { label: 'Médicaux', value: medicalCount > 0 ? `${medicalCount} élément${medicalCount > 1 ? 's' : ''}` : 'Aucun', icon: Stethoscope, color: 'text-blue-500' },
        { label: 'Cardiovasculaires', value: cardiovascularCount > 0 ? `${cardiovascularCount} élément${cardiovascularCount > 1 ? 's' : ''}` : 'Aucun', icon: Heart, color: 'text-red-500' },
        { label: 'Chirurgicaux', value: surgicalCount > 0 ? `${surgicalCount} élément${surgicalCount > 1 ? 's' : ''}` : 'Aucun', icon: Activity, color: 'text-purple-500' },
        { label: 'Familiaux', value: familyCount > 0 ? `${familyCount} élément${familyCount > 1 ? 's' : ''}` : 'Aucun', icon: Users, color: 'text-green-500' },
        { label: 'Mode de vie', value: lifestyleCount > 0 ? `${lifestyleCount} élément${lifestyleCount > 1 ? 's' : ''}` : 'Aucun', icon: User, color: 'text-gray-500' },
      ]
    },
    { id: 'documents' as const, label: 'DOCUMENTS', icon: Folder, badge: documents.length },
    { id: 'observations' as const, label: 'OBSERVATIONS', icon: Eye, badge: observations.length },
    {
      id: 'traitement' as const,
      label: 'TRAITEMENT EN COURS',
      icon: Pill,
      collapsible: true,
      subItems: [
        { label: 'En cours', value: treatmentsStats.active > 0 ? `${treatmentsStats.active}` : 'Aucun', icon: Pill, color: 'text-green-500' },
        { label: 'Arrêtés', value: treatmentsStats.stopped > 0 ? `${treatmentsStats.stopped}` : 'Aucun', icon: X, color: 'text-red-500' },
        { label: 'Expirés', value: treatmentsStats.completed > 0 ? `${treatmentsStats.completed}` : 'Aucun', icon: Clock, color: 'text-gray-500' },
      ]
    },
    {
      id: 'biologie' as const,
      label: 'BIOLOGIE ET BIOMÉTRIE',
      icon: TestTube,
      collapsible: true,
      subItems: [
        { label: 'Poids', value: latestBiometrics.weight ? `${latestBiometrics.weight.value} kg` : '-', icon: Scale, color: 'text-blue-500' },
        { label: 'Taille', value: latestBiometrics.height ? `${latestBiometrics.height.value} cm` : '-', icon: Ruler, color: 'text-green-500' },
        { label: 'Tension', value: latestBiometrics.blood_pressure ? `${latestBiometrics.blood_pressure.value}/${latestBiometrics.blood_pressure.valueSecondary} mmHg` : '-', icon: Activity, color: 'text-red-500' },
        { label: 'Température', value: latestBiometrics.temperature ? `${latestBiometrics.temperature.value}°C` : '-', icon: Thermometer, color: 'text-orange-500' },
        { label: 'Résultats labo', value: labResults.length > 0 ? `${labResults.length}` : 'Aucun', icon: TestTube, color: 'text-purple-500' },
        { label: 'Historique mesures', value: '6 éléments', icon: History, color: 'text-teal-500', link: true },
      ]
    },
    { id: 'vaccination' as const, label: 'CARNET DE VACCINATION', icon: Shield, badge: vaccinations.length },
    { id: 'certificats' as const, label: 'CERTIFICATS', icon: Award, badge: certificates.length },
    { id: 'correspondances' as const, label: 'CORRESPONDANCES', icon: FileSignature, badge: correspondences.filter(c => !c.isRead).length || undefined },
    { id: 'messagerie' as const, label: 'MESSAGERIE PATIENT', icon: Inbox, badge: messages.filter(m => m.direction === 'INCOMING' && !m.readAt).length || undefined },
    { id: 'protocoles' as const, label: 'PROTOCOLES DE SOINS', icon: Target, badge: protocols.filter(p => p.status === 'ACTIVE').length },
    { id: 'factures' as const, label: 'FACTURES', icon: Receipt, badge: invoices.length },
  ];

  // Get active allergies for sidebar
  const allergies = medicalHistory.filter(h => h.category === 'ALLERGY' && h.isActive);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
        {/* Patient Header */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
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
              <p className="text-xs text-gray-500">
                {profile?.civility === 'MR' ? 'Monsieur' : profile?.civility === 'MME' ? 'Madame' : ''}
              </p>
              <h2 className="font-bold text-gray-900">
                {profile?.birthLastName?.toUpperCase() || patient.fullName?.split(' ').slice(-1)[0]?.toUpperCase() || 'NOM'}
              </h2>
              <p className="font-medium text-gray-700">
                {profile?.firstName || patient.fullName?.split(' ').slice(0, -1).join(' ') || ''}
              </p>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500 space-y-1">
            <p>{formatDate(patient.birthdate || profile?.birthDate)} ({age} ans)</p>
            {profile?.mutualInsurance && (
              <p className="text-teal-600">MT : {profile.mutualInsurance}</p>
            )}
            <p>N° SS : {maskSSN(profile?.socialSecurityNumber || null)}</p>
          </div>
        </div>

        {/* Warning if no profile */}
        {!profile && (
          <div className="px-4 py-3 bg-amber-50 border-b border-amber-100 flex-shrink-0">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700">
                Profil patient incomplet. Veuillez compléter les informations administratives.
              </p>
            </div>
          </div>
        )}

        {/* Sidebar quick info */}
        <div className="px-4 py-3 border-b border-gray-200 flex-shrink-0">
          <div className="space-y-2 text-xs">
            {profile?.phonePrimary && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-3 h-3" />
                <span>{profile.phonePrimary}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-600">
              <Mail className="w-3 h-3" />
              <span className="truncate">{patient.email}</span>
            </div>
            {profile?.primaryDoctorName && (
              <div className="flex items-center gap-2 text-gray-600">
                <User className="w-3 h-3" />
                <span>Médecin traitant: {profile.primaryDoctorName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto py-2">
          {menuItems.map((item: any) => (
            <div key={item.id}>
              <button
                onClick={() => {
                  if (item.collapsible) {
                    toggleSidebarSection(item.id);
                  }
                  setActiveSection(item.id);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-xs font-medium transition-colors ${
                  activeSection === item.id
                    ? 'bg-teal-50 text-teal-700 border-l-3 border-teal-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded text-xs">
                      {item.badge}
                    </span>
                  )}
                  {item.collapsible && (
                    expandedSidebarSections.includes(item.id) ? (
                      <ChevronUp className="w-3 h-3 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-400" />
                    )
                  )}
                </div>
              </button>
              {/* Sub items for collapsible sections */}
              {item.collapsible && item.subItems && expandedSidebarSections.includes(item.id) && (
                <div className="bg-gray-50 border-l-2 border-gray-200 ml-4">
                  {item.subItems.map((sub: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-4 py-1.5 text-xs hover:bg-gray-100 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        {sub.icon && <sub.icon className={`w-3 h-3 ${sub.color || 'text-gray-400'}`} />}
                        <span className="text-gray-600">{sub.label}</span>
                      </div>
                      <span className={`${sub.link ? 'text-teal-600 underline' : sub.value === 'Ajouter' ? 'text-teal-600' : 'text-gray-500'}`}>
                        {sub.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Biometrics Summary */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Biométrie</h4>
          <div className="space-y-1.5 text-xs">
            {latestBiometrics.weight && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Poids:</span>
                <span className="font-medium">{latestBiometrics.weight.value} kg</span>
              </div>
            )}
            {latestBiometrics.height && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Taille:</span>
                <span className="font-medium">{latestBiometrics.height.value} cm</span>
              </div>
            )}
            {latestBiometrics.blood_pressure && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Tension:</span>
                <span className={`font-medium ${latestBiometrics.blood_pressure.isAbnormal ? 'text-red-600' : ''}`}>
                  {latestBiometrics.blood_pressure.value}/{latestBiometrics.blood_pressure.valueSecondary} mmHg
                </span>
              </div>
            )}
            {latestBiometrics.temperature && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Température:</span>
                <span className="font-medium">{latestBiometrics.temperature.value}°C</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Breadcrumb & Actions Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Dossier patient</span>
              <ChevronRight className="w-4 h-4" />
              <span className="text-gray-900 font-medium">
                {activeSection === 'home' ? 'Accueil' :
                 activeSection === 'consultations' ? 'Consultation' :
                 activeSection === 'infos' ? 'Informations administratives' :
                 activeSection === 'historique' ? 'Historique' :
                 activeSection === 'antecedents' ? 'Antécédents et mode de vie' :
                 activeSection === 'documents' ? 'Documents' :
                 activeSection === 'observations' ? 'Observations' :
                 activeSection === 'traitement' ? 'Traitement en cours' :
                 activeSection === 'biologie' ? 'Biologie et Biométrie' :
                 activeSection === 'vaccination' ? 'Carnet de vaccination' :
                 activeSection === 'certificats' ? 'Certificats médicaux' :
                 activeSection === 'correspondances' ? 'Correspondances médicales' :
                 activeSection === 'messagerie' ? 'Messagerie patient' :
                 activeSection === 'protocoles' ? 'Protocoles de soins' :
                 'Factures'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
                Fermer le dossier
              </button>
              <X className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600" onClick={() => router.push('/patients')} />
            </div>
          </div>
        </div>

        {/* Content based on active section */}
        <div className="p-6">
          {activeSection === 'home' && (
            <HomeSection
              patient={patient}
              profile={profile}
              age={age}
              appointments={appointments}
              treatments={treatments}
              treatmentsStats={treatmentsStats}
              allergies={allergies}
              latestBiometrics={latestBiometrics}
              observations={observations}
              documents={documents}
            />
          )}

          {activeSection === 'infos' && (
            <InfosAdminSection
              patient={patient}
              profile={profile}
              consents={consents}
              emergencyContacts={emergencyContacts}
              patientId={patientId}
              onRefresh={fetchPatientRecord}
            />
          )}

          {activeSection === 'historique' && (
            <HistoriqueSection appointments={appointments} />
          )}

          {activeSection === 'antecedents' && (
            <AntecedentsSection medicalHistory={medicalHistory} medicalHistoryStats={medicalHistoryStats} />
          )}

          {activeSection === 'documents' && (
            <DocumentsSection documents={documents} />
          )}

          {activeSection === 'observations' && (
            <ObservationsSection observations={observations} />
          )}

          {activeSection === 'traitement' && (
            <TraitementSection treatments={treatments} treatmentsStats={treatmentsStats} />
          )}

          {activeSection === 'biologie' && (
            <BiologieSection
              latestBiometrics={latestBiometrics}
              labResults={labResults}
              patientId={patientId}
              onFetchHistory={fetchBiometricsHistory}
              biometricsHistory={biometricsHistory}
            />
          )}

          {activeSection === 'vaccination' && (
            <VaccinationSection vaccinations={vaccinations} />
          )}

          {activeSection === 'certificats' && (
            <CertificatsSection certificates={certificates} />
          )}

          {activeSection === 'correspondances' && (
            <CorrespondancesSection correspondences={correspondences} />
          )}

          {activeSection === 'messagerie' && (
            <MessagerieSection messages={messages} patient={patient} />
          )}

          {activeSection === 'protocoles' && (
            <ProtocolesSection protocols={protocols} />
          )}

          {activeSection === 'factures' && (
            <FacturesSection invoices={invoices} />
          )}

          {activeSection === 'consultations' && (
            <ConsultationSection patient={patient} />
          )}
        </div>
      </div>

      {/* Actions Sidebar - masqué en mode consultation car la consultation a ses propres panneaux */}
      {activeSection !== 'consultations' && (
        <div className="w-64 bg-white border-l border-gray-200 p-4 hidden xl:block">
          <h3 className="font-semibold text-gray-900 mb-4">ACTIONS</h3>
          <div className="space-y-2">
            <ActionButton icon={Calendar} label="Prendre un rendez-vous" />
            <ActionButton icon={Calendar} label="Planifier plusieurs rendez-vous" />
            <ActionButton icon={Plus} label="Ajouter une tâche" />
            <ActionButton icon={ClipboardList} label="Voir les tâches" />
            <ActionButton icon={MessageSquare} label="Discuter d'un patient" />
            <ActionButton icon={X} label="Bloquer la prise de rendez-vous" variant="secondary" />
            <ActionButton icon={Calendar} label="Prendre un rendez-vous pour maintenant" />
            <ActionButton icon={Users} label="Adresser chez un confrère" />
            <ActionButton icon={Printer} label="Imprimer les rendez-vous" />
            <ActionButton icon={Folder} label="Archiver le dossier" />
            <ActionButton icon={AlertTriangle} label="Supprimer le patient" variant="danger" />
          </div>
        </div>
      )}
    </div>
  );
}

// Action Button Component
function ActionButton({ icon: Icon, label, variant = 'default' }: { icon: any; label: string; variant?: 'default' | 'secondary' | 'danger' }) {
  const variantClasses = {
    default: 'text-gray-700 hover:bg-gray-50',
    secondary: 'text-gray-500 hover:bg-gray-50',
    danger: 'text-red-600 hover:bg-red-50',
  };

  return (
    <button className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${variantClasses[variant]}`}>
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}

// Section Components
function HomeSection({ patient, profile, age, appointments, treatments, treatmentsStats, allergies, latestBiometrics, observations, documents }: any) {
  const upcomingAppointments = appointments.filter((a: Appointment) =>
    a.status !== 'CANCELLED' && new Date(a.slot.start) > new Date()
  ).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{patient.fullName?.toUpperCase()}</h1>
          <p className="text-sm text-gray-500">{formatDate(patient.birthdate || profile?.birthDate)} ({age} ans)</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nouvelle consultation
          </button>
        </div>
      </div>

      {/* Alerts */}
      {allergies.length > 0 && (
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="font-semibold text-red-700">Allergies</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {allergies.map((allergy: MedicalHistory) => (
              <span key={allergy.id} className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm">
                {allergy.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard value={appointments.length} label="Total RDV" color="teal" />
        <StatCard value={upcomingAppointments.length} label="À venir" color="blue" />
        <StatCard value={treatmentsStats.active} label="Traitements actifs" color="green" />
        <StatCard value={allergies.length} label="Allergies" color="red" />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Upcoming Appointments */}
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Prochains rendez-vous</h3>
          </div>
          {upcomingAppointments.length > 0 ? (
            <div className="space-y-3">
              {upcomingAppointments.map((apt: Appointment) => (
                <div key={apt.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">
                      {formatDateTime(apt.slot.start)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{apt.kind?.name || 'Consultation'}</p>
                  {apt.kind?.isTelemedicine && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                      Téléconsultation
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              Aucun rendez-vous à venir
            </div>
          )}
        </div>

        {/* Active Treatments */}
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Traitements en cours</h3>
          </div>
          {treatments.filter((t: Treatment) => t.status === 'ACTIVE').length > 0 ? (
            <div className="space-y-3">
              {treatments.filter((t: Treatment) => t.status === 'ACTIVE').slice(0, 3).map((t: Treatment) => (
                <div key={t.id} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">{t.medicationName}</p>
                  <p className="text-xs text-gray-500">{t.dosage} - {t.frequency}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm">
              <Pill className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              Aucun traitement en cours
            </div>
          )}
        </div>

        {/* Latest Observations */}
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Dernières observations</h3>
          </div>
          {observations.length > 0 ? (
            <div className="space-y-3">
              {observations.slice(0, 3).map((obs: ClinicalObservation) => (
                <div key={obs.id} className={`p-3 rounded-lg ${obs.isUrgent ? 'bg-red-50' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {obs.isUrgent && <AlertCircle className="w-4 h-4 text-red-500" />}
                    <span className="text-xs text-gray-500">{formatDate(obs.observedAt)}</span>
                  </div>
                  <p className="text-sm text-gray-900 line-clamp-2">{obs.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm">
              <Eye className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              Aucune observation
            </div>
          )}
        </div>
      </div>

      {/* Biometrics Summary */}
      {Object.keys(latestBiometrics).length > 0 && (
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Dernières mesures biométriques</h3>
          <div className="grid grid-cols-5 gap-4">
            {latestBiometrics.weight && (
              <BiometricCard icon={Scale} label="Poids" value={`${latestBiometrics.weight.value} kg`} date={latestBiometrics.weight.measuredAt} />
            )}
            {latestBiometrics.height && (
              <BiometricCard icon={Ruler} label="Taille" value={`${latestBiometrics.height.value} cm`} date={latestBiometrics.height.measuredAt} />
            )}
            {latestBiometrics.blood_pressure && (
              <BiometricCard
                icon={Activity}
                label="Tension"
                value={`${latestBiometrics.blood_pressure.value}/${latestBiometrics.blood_pressure.valueSecondary}`}
                date={latestBiometrics.blood_pressure.measuredAt}
                isAbnormal={latestBiometrics.blood_pressure.isAbnormal}
              />
            )}
            {latestBiometrics.temperature && (
              <BiometricCard icon={Thermometer} label="Température" value={`${latestBiometrics.temperature.value}°C`} date={latestBiometrics.temperature.measuredAt} />
            )}
            {latestBiometrics.heart_rate && (
              <BiometricCard icon={Heart} label="Fréq. cardiaque" value={`${latestBiometrics.heart_rate.value} bpm`} date={latestBiometrics.heart_rate.measuredAt} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function BiometricCard({ icon: Icon, label, value, date, isAbnormal }: { icon: any; label: string; value: string; date: string; isAbnormal?: boolean }) {
  return (
    <div className={`p-4 rounded-lg ${isAbnormal ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${isAbnormal ? 'text-red-500' : 'text-gray-400'}`} />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className={`text-lg font-semibold ${isAbnormal ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1">{formatDate(date)}</p>
    </div>
  );
}

function StatCard({ value, label, color }: { value: number; label: string; color: 'teal' | 'blue' | 'green' | 'red' | 'gray' | 'amber' }) {
  const colorClasses = {
    teal: 'text-teal-600 bg-teal-50 border-teal-200',
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    green: 'text-green-600 bg-green-50 border-green-200',
    red: 'text-red-600 bg-red-50 border-red-200',
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

function InfosAdminSection({ patient, profile, consents, emergencyContacts, patientId, onRefresh }: {
  patient: Patient;
  profile: PatientProfile | undefined;
  consents: PatientConsent[];
  emergencyContacts: EmergencyContact[];
  patientId?: string;
  onRefresh?: () => void;
}) {
  const [editSection, setEditSection] = useState<'identity' | 'contact' | 'emergency' | null>(null);
  const [showAddContact, setShowAddContact] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state for identity
  const [identityForm, setIdentityForm] = useState({
    civility: '',
    birthLastName: '',
    usageLastName: '',
    firstName: '',
    birthDate: '',
    birthPlace: '',
    birthCountry: '',
    sex: '',
  });

  // Form state for contact
  const [contactForm, setContactForm] = useState({
    phonePrimary: '',
    phoneSecondary: '',
    email: '',
    addressLine1: '',
    postalCode: '',
    city: '',
    country: '',
  });

  // Form state for new emergency contact
  const [newContact, setNewContact] = useState({
    fullName: '',
    relationship: '',
    phone: '',
    isPrimary: false,
  });

  // Sync form state when profile/patient data changes
  useEffect(() => {
    setIdentityForm({
      civility: profile?.civility || '',
      birthLastName: profile?.birthLastName || '',
      usageLastName: profile?.usageLastName || '',
      firstName: profile?.firstName || '',
      birthDate: profile?.birthDate?.split('T')[0] || '',
      birthPlace: profile?.birthPlace || '',
      birthCountry: profile?.birthCountry || '',
      sex: patient?.sex || '',
    });
  }, [profile, patient?.sex]);

  useEffect(() => {
    setContactForm({
      phonePrimary: profile?.phonePrimary || patient?.phone || '',
      phoneSecondary: profile?.phoneSecondary || '',
      email: patient?.email || '',
      addressLine1: profile?.addressLine1 || '',
      postalCode: profile?.postalCode || '',
      city: profile?.city || '',
      country: profile?.country || '',
    });
  }, [profile, patient?.phone, patient?.email]);

  const handleSaveIdentity = async () => {
    if (!patientId) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/patient-record/${patientId}/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(identityForm),
      });
      if (!response.ok) throw new Error('Erreur lors de la sauvegarde');
      setEditSection(null);
      onRefresh?.();
    } catch (error) {
      console.error('Error saving identity:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveContact = async () => {
    if (!patientId) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/patient-record/${patientId}/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(contactForm),
      });
      if (!response.ok) throw new Error('Erreur lors de la sauvegarde');
      setEditSection(null);
      onRefresh?.();
    } catch (error) {
      console.error('Error saving contact:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddEmergencyContact = async () => {
    if (!patientId || !newContact.fullName || !newContact.phone) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/patient-record/${patientId}/emergency-contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newContact),
      });
      if (!response.ok) throw new Error('Erreur lors de l\'ajout');
      setShowAddContact(false);
      setNewContact({ fullName: '', relationship: '', phone: '', isPrimary: false });
      onRefresh?.();
    } catch (error) {
      console.error('Error adding contact:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEmergencyContact = async (contactId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce contact ?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/patient-record/emergency-contacts/${contactId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Erreur lors de la suppression');
      onRefresh?.();
    } catch (error) {
      console.error('Error deleting contact:', error);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Informations administratives</h2>

      {/* Identity */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Identité</h3>
          {editSection !== 'identity' ? (
            <button
              onClick={() => setEditSection('identity')}
              className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              <Edit className="w-3.5 h-3.5" />
              Modifier
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditSection(null)}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveIdentity}
                disabled={saving}
                className="px-3 py-1.5 text-sm bg-teal-600 text-white hover:bg-teal-700 rounded-lg disabled:opacity-50"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          )}
        </div>

        {editSection === 'identity' ? (
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <EditableField
                label="Civilité"
                value={identityForm.civility}
                onChange={(v) => setIdentityForm({ ...identityForm, civility: v })}
                type="select"
                options={[
                  { value: '', label: '-' },
                  { value: 'MR', label: 'M.' },
                  { value: 'MME', label: 'Mme' },
                ]}
              />
              <EditableField
                label="Sexe"
                value={identityForm.sex}
                onChange={(v) => setIdentityForm({ ...identityForm, sex: v })}
                type="select"
                options={[
                  { value: '', label: '-' },
                  { value: 'M', label: 'Homme' },
                  { value: 'F', label: 'Femme' },
                ]}
              />
              <EditableField
                label="Nom de naissance"
                value={identityForm.birthLastName}
                onChange={(v) => setIdentityForm({ ...identityForm, birthLastName: v })}
              />
              <EditableField
                label="Prénom"
                value={identityForm.firstName}
                onChange={(v) => setIdentityForm({ ...identityForm, firstName: v })}
              />
            </div>
            <div className="space-y-4">
              <EditableField
                label="Nom utilisé"
                value={identityForm.usageLastName}
                onChange={(v) => setIdentityForm({ ...identityForm, usageLastName: v })}
              />
              <EditableField
                label="Date de naissance"
                value={identityForm.birthDate}
                onChange={(v) => setIdentityForm({ ...identityForm, birthDate: v })}
                type="date"
              />
              <EditableField
                label="Lieu de naissance"
                value={identityForm.birthPlace}
                onChange={(v) => setIdentityForm({ ...identityForm, birthPlace: v })}
              />
              <EditableField
                label="Pays de naissance"
                value={identityForm.birthCountry}
                onChange={(v) => setIdentityForm({ ...identityForm, birthCountry: v })}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <InfoField label="Matricule INS" value="-" />
              <InfoField label="Civilité" value={profile?.civility === 'MR' ? 'M.' : profile?.civility === 'MME' ? 'Mme' : '-'} />
              <InfoField label="Sexe" value={patient.sex === 'M' ? 'Homme' : patient.sex === 'F' ? 'Femme' : '-'} />
              <InfoField label="Nom de naissance" value={profile?.birthLastName || '-'} />
              <InfoField label="Prénom de naissance" value={profile?.firstName || '-'} />
            </div>
            <div className="space-y-4">
              <InfoField label="CIP" value="-" />
              <InfoField label="Nom utilisé" value={profile?.usageLastName || '-'} />
              <InfoField label="Prénom utilisé" value={profile?.firstName || '-'} />
              <InfoField label="Date de naissance" value={formatDate(profile?.birthDate || patient.birthdate)} />
              <InfoField label="Lieu de naissance" value={profile?.birthPlace ? `${profile.birthPlace}, ${profile.birthCountry || 'France'}` : '-'} />
            </div>
          </div>
        )}
      </div>

      {/* Contact */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Coordonnées</h3>
          {editSection !== 'contact' ? (
            <button
              onClick={() => setEditSection('contact')}
              className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              <Edit className="w-3.5 h-3.5" />
              Modifier
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditSection(null)}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveContact}
                disabled={saving}
                className="px-3 py-1.5 text-sm bg-teal-600 text-white hover:bg-teal-700 rounded-lg disabled:opacity-50"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          )}
        </div>

        {editSection === 'contact' ? (
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <EditableField
                label="Téléphone"
                value={contactForm.phonePrimary}
                onChange={(v) => setContactForm({ ...contactForm, phonePrimary: v })}
                type="tel"
              />
              <EditableField
                label="Téléphone secondaire"
                value={contactForm.phoneSecondary}
                onChange={(v) => setContactForm({ ...contactForm, phoneSecondary: v })}
                type="tel"
              />
              <EditableField
                label="E-mail"
                value={contactForm.email}
                onChange={(v) => setContactForm({ ...contactForm, email: v })}
                type="email"
              />
            </div>
            <div className="space-y-4">
              <EditableField
                label="Adresse"
                value={contactForm.addressLine1}
                onChange={(v) => setContactForm({ ...contactForm, addressLine1: v })}
              />
              <div className="grid grid-cols-2 gap-3">
                <EditableField
                  label="Code postal"
                  value={contactForm.postalCode}
                  onChange={(v) => setContactForm({ ...contactForm, postalCode: v })}
                />
                <EditableField
                  label="Ville"
                  value={contactForm.city}
                  onChange={(v) => setContactForm({ ...contactForm, city: v })}
                />
              </div>
              <EditableField
                label="Pays"
                value={contactForm.country}
                onChange={(v) => setContactForm({ ...contactForm, country: v })}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <InfoField label="Téléphone" value={profile?.phonePrimary || patient.phone || '-'} />
              <InfoField label="Téléphone secondaire" value={profile?.phoneSecondary || '-'} />
              <InfoField label="E-mail" value={patient.email} />
            </div>
            <div className="space-y-4">
              <InfoField label="Adresse" value={profile?.addressLine1 || '-'} />
              <InfoField label="Code postal / Ville" value={profile?.postalCode && profile?.city ? `${profile.postalCode} ${profile.city}` : '-'} />
              <InfoField label="Pays" value={profile?.country || '-'} />
            </div>
          </div>
        )}
      </div>

      {/* Consents */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-4">Consentements patient</h3>
        <div className="space-y-4">
          {Object.keys(CONSENT_LABELS).map((type) => {
            const consent = consents.find((c) => c.type === type);
            const info = CONSENT_LABELS[type];
            return (
              <div key={type} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center ${consent?.granted ? 'bg-green-100' : 'bg-gray-200'}`}>
                    {consent?.granted ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-3 h-3 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{info.label}</p>
                    <p className="text-xs text-gray-500">{info.description}</p>
                  </div>
                </div>
                {type === 'CARE' && !consent?.granted && (
                  <span className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs font-medium">Obligatoire manquant</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Emergency Contacts */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Contacts d'urgence</h3>
          <button
            onClick={() => setShowAddContact(true)}
            className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Ajouter contact
          </button>
        </div>
        {emergencyContacts.length > 0 ? (
          <div className="space-y-3">
            {emergencyContacts.map((contact) => (
              <div key={contact.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group">
                <div>
                  <p className="font-medium text-gray-900">{contact.fullName}</p>
                  <p className="text-sm text-gray-500">{contact.relationship} - {contact.phone}</p>
                </div>
                <div className="flex items-center gap-2">
                  {contact.isPrimary && (
                    <span className="px-2 py-1 bg-teal-100 text-teal-700 rounded text-xs">Principal</span>
                  )}
                  <button
                    onClick={() => handleDeleteEmergencyContact(contact.id)}
                    className="p-1 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Supprimer"
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Aucun contact d'urgence enregistré</p>
            <button
              onClick={() => setShowAddContact(true)}
              className="mt-2 text-teal-600 text-sm"
            >
              + Ajouter un contact d'urgence
            </button>
          </div>
        )}
      </div>

      {/* Add Emergency Contact Modal */}
      {showAddContact && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddContact(false)}>
          <div
            className="bg-white rounded-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Ajouter un contact d'urgence</h3>
              <button onClick={() => setShowAddContact(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <EditableField
                label="Nom complet"
                value={newContact.fullName}
                onChange={(v) => setNewContact({ ...newContact, fullName: v })}
                required
              />
              <EditableField
                label="Relation"
                value={newContact.relationship}
                onChange={(v) => setNewContact({ ...newContact, relationship: v })}
                type="select"
                options={[
                  { value: '', label: 'Sélectionner...' },
                  { value: 'Conjoint(e)', label: 'Conjoint(e)' },
                  { value: 'Parent', label: 'Parent' },
                  { value: 'Enfant', label: 'Enfant' },
                  { value: 'Frère/Sœur', label: 'Frère/Sœur' },
                  { value: 'Ami(e)', label: 'Ami(e)' },
                  { value: 'Autre', label: 'Autre' },
                ]}
              />
              <EditableField
                label="Téléphone"
                value={newContact.phone}
                onChange={(v) => setNewContact({ ...newContact, phone: v })}
                type="tel"
                required
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPrimary"
                  checked={newContact.isPrimary}
                  onChange={(e) => setNewContact({ ...newContact, isPrimary: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="isPrimary" className="text-sm text-gray-700">Définir comme contact principal</label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowAddContact(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleAddEmergencyContact}
                disabled={saving || !newContact.fullName || !newContact.phone}
                className="px-4 py-2 text-sm bg-teal-600 text-white hover:bg-teal-700 rounded-lg disabled:opacity-50"
              >
                {saving ? 'Ajout...' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditableField({
  label,
  value,
  onChange,
  type = 'text',
  options,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'tel' | 'date' | 'select';
  options?: { value: string; label: string }[];
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-xs text-gray-500 mb-1 block">
        {label}{required && <span className="text-red-500">*</span>}
      </label>
      {type === 'select' && options ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          required={required}
        />
      )}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm text-gray-900">{value}</p>
    </div>
  );
}

function HistoriqueSection({ appointments }: { appointments: Appointment[] }) {
  const upcoming = appointments.filter((a) => new Date(a.slot.start) >= new Date() && a.status !== 'CANCELLED');
  const past = appointments.filter((a) => new Date(a.slot.start) < new Date() || a.status === 'CANCELLED');

  const groupByYear = (apts: Appointment[]) => {
    const groups: Record<string, Appointment[]> = {};
    apts.forEach((apt) => {
      const year = new Date(apt.slot.start).getFullYear().toString();
      if (!groups[year]) groups[year] = [];
      groups[year].push(apt);
    });
    return groups;
  };

  const pastGrouped = groupByYear(past);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Historique</h2>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <input type="checkbox" id="presence" className="rounded border-gray-300" defaultChecked />
          <label htmlFor="presence" className="text-sm text-gray-600">Présence au rendez-vous</label>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded">Rendez-vous honorés</span>
          <span>{appointments.filter((a) => a.status === 'CONFIRMED').length}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded">Absences excusées</span>
          <span>0</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="px-2 py-1 bg-red-100 text-red-700 rounded">Absences non excusées</span>
          <span>{appointments.filter((a) => a.status === 'NO_SHOW').length}</span>
        </div>
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">À venir ({upcoming.length})</h3>
          <div className="space-y-3">
            {upcoming.map((apt) => (
              <AppointmentRow key={apt.id} appointment={apt} />
            ))}
          </div>
        </div>
      )}

      {/* Past by year */}
      {Object.keys(pastGrouped).sort((a, b) => parseInt(b) - parseInt(a)).map((year) => (
        <div key={year} className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">{year}</h3>
          <div className="space-y-3">
            {pastGrouped[year].map((apt) => (
              <AppointmentRow key={apt.id} appointment={apt} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function AppointmentRow({ appointment }: { appointment: Appointment }) {
  const statusColors: Record<string, string> = {
    CONFIRMED: 'bg-green-100 text-green-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    CANCELLED: 'bg-red-100 text-red-700',
    NO_SHOW: 'bg-red-100 text-red-700',
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
      <div className="flex items-center gap-4">
        <div className="text-sm">
          <span className="text-gray-500">{formatDateTime(appointment.slot.start)}</span>
        </div>
        <span className={`px-2 py-0.5 rounded text-xs ${appointment.kind?.isTelemedicine ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
          {appointment.kind?.name || 'Consultation'}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className={`px-2 py-1 rounded text-xs ${statusColors[appointment.status] || 'bg-gray-100'}`}>
          {appointment.status === 'CONFIRMED' ? 'Confirmé' :
           appointment.status === 'PENDING' ? 'En attente' :
           appointment.status === 'CANCELLED' ? 'Annulé' :
           appointment.status === 'NO_SHOW' ? 'Absent' : appointment.status}
        </span>
        <button className="text-teal-600 text-sm hover:text-teal-700">Ouvrir</button>
      </div>
    </div>
  );
}

function AntecedentsSection({ medicalHistory, medicalHistoryStats, patientId, onRefresh }: { medicalHistory: MedicalHistory[]; medicalHistoryStats: any; patientId?: string; onRefresh?: () => void }) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['ALLERGY', 'MEDICAL', 'SURGICAL', 'CARDIOVASCULAR', 'FAMILY', 'LIFESTYLE']);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalCategory, setAddModalCategory] = useState<string>('');
  const [newItem, setNewItem] = useState({ title: '', description: '', severity: 'Faible', date: '', notes: '' });

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const openAddModal = (category: string) => {
    setAddModalCategory(category);
    setNewItem({ title: '', description: '', severity: 'Faible', date: '', notes: '' });
    setShowAddModal(true);
  };

  const handleAddItem = async () => {
    // TODO: Implement API call to add new medical history
    console.log('Adding:', { category: addModalCategory, ...newItem });
    setShowAddModal(false);
    if (onRefresh) onRefresh();
  };

  const severityOptions = ['Faible', 'Modéré', 'Élevé', 'Sévère'];
  const severityColors: Record<string, string> = {
    'Faible': 'bg-green-100 text-green-700',
    'Modéré': 'bg-yellow-100 text-yellow-700',
    'Élevé': 'bg-orange-100 text-orange-700',
    'Sévère': 'bg-red-100 text-red-700',
  };

  const categories = [
    { key: 'ALLERGY', icon: AlertTriangle, color: 'text-orange-500', bgColor: 'bg-orange-50' },
    { key: 'MEDICAL', icon: Stethoscope, color: 'text-blue-500', bgColor: 'bg-blue-50' },
    { key: 'CARDIOVASCULAR', icon: Heart, color: 'text-red-500', bgColor: 'bg-red-50' },
    { key: 'SURGICAL', icon: Activity, color: 'text-purple-500', bgColor: 'bg-purple-50' },
    { key: 'FAMILY', icon: Users, color: 'text-green-500', bgColor: 'bg-green-50' },
    { key: 'LIFESTYLE', icon: User, color: 'text-gray-500', bgColor: 'bg-gray-50' },
  ];

  // Get allergies for tags display
  const allergies = medicalHistory.filter((h) => h.category === 'ALLERGY');

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Antécédents et mode de vie</h2>

      {/* Allergies Section - Special display with tags */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <span className="font-semibold text-gray-900">Allergies</span>
            <span className="text-sm text-gray-500">{allergies.length} allergie{allergies.length > 1 ? 's' : ''} enregistrée{allergies.length > 1 ? 's' : ''}</span>
          </div>
          <button
            onClick={() => openAddModal('ALLERGY')}
            className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>
        {allergies.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {allergies.map((allergy) => (
              <span
                key={allergy.id}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm ${
                  allergy.severity === 'SEVERE' || allergy.severity === 'Élevé' || allergy.severity === 'Sévère'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-orange-100 text-orange-700'
                }`}
              >
                <AlertTriangle className="w-3 h-3" />
                {allergy.title}
                {allergy.severity && (
                  <span className="text-xs opacity-75">({allergy.severity})</span>
                )}
                <button className="ml-1 hover:text-red-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Aucune allergie enregistrée</p>
        )}
      </div>

      {/* Other Categories */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {categories.filter(c => c.key !== 'ALLERGY').map(({ key, icon: Icon, color, bgColor }) => {
          const items = medicalHistory.filter((h) => h.category === key);
          const count = items.length;

          return (
            <div key={key} className="border-b border-gray-200 last:border-b-0">
              <button
                onClick={() => toggleCategory(key)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${color}`} />
                  <span className="font-medium text-gray-900">{CATEGORY_LABELS[key]}</span>
                  {count > 0 ? (
                    <span className="px-2 py-0.5 bg-teal-100 text-teal-700 rounded text-xs">
                      {count} élément{count > 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">Aucune donnée</span>
                  )}
                </div>
                {expandedCategories.includes(key) ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {expandedCategories.includes(key) && (
                <div className="px-4 pb-4">
                  {items.length > 0 ? (
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div key={item.id} className={`p-4 rounded-lg border ${item.isActive ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-gray-900">{item.title}</span>
                                {item.severity && (
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${severityColors[item.severity] || 'bg-gray-100 text-gray-600'}`}>
                                    {item.severity}
                                  </span>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                {item.diagnosedAt && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(item.diagnosedAt)}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Ajouté le {formatDate(item.diagnosedAt || '')}
                                </span>
                              </div>
                            </div>
                            <button className="text-gray-400 hover:text-gray-600 p-1">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                        <Icon className={`w-6 h-6 ${color} opacity-50`} />
                      </div>
                      <p className="text-sm text-gray-500 mb-3">Aucun élément enregistré</p>
                      <button
                        onClick={() => openAddModal(key)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
                      >
                        <Plus className="w-4 h-4" />
                        Ajouter un élément
                      </button>
                    </div>
                  )}
                  {items.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 text-center">
                      <button
                        onClick={() => openAddModal(key)}
                        className="inline-flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700"
                      >
                        <Plus className="w-4 h-4" />
                        Ajouter un élément
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mode de vie section */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-gray-500" />
            <span className="font-semibold text-gray-900">Mode de vie</span>
          </div>
          <button
            onClick={() => openAddModal('LIFESTYLE')}
            className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>
        <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-sm text-gray-500 mb-2">Aucun élément enregistré</p>
          <button
            onClick={() => openAddModal('LIFESTYLE')}
            className="text-sm text-teal-600 hover:text-teal-700"
          >
            + Ajouter un élément
          </button>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Ajouter - {CATEGORY_LABELS[addModalCategory] || addModalCategory}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  placeholder={addModalCategory === 'FAMILY' ? 'Ex: Cancer du sein (mère), Diabète (père)...' : 'Ex: Hypertension, Appendicectomie...'}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder={addModalCategory === 'FAMILY' ? 'Précisez le lien de parenté et les détails...' : 'Détails supplémentaires...'}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={newItem.date}
                    onChange={(e) => setNewItem({ ...newItem, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sévérité</label>
                  <select
                    value={newItem.severity}
                    onChange={(e) => setNewItem({ ...newItem, severity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {severityOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes complémentaires</label>
                <textarea
                  value={newItem.notes}
                  onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                  placeholder="Notes internes ou observations..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleAddItem}
                disabled={!newItem.title}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DocumentsSection({ documents }: { documents: MedicalDocument[] }) {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewDoc, setPreviewDoc] = useState<MedicalDocument | null>(null);
  const [showActionsFor, setShowActionsFor] = useState<string | null>(null);

  const categoryLabels: Record<string, string> = {
    PRESCRIPTION: 'Ordonnance',
    LAB_RESULT: 'Résultat d\'analyse',
    IMAGING: 'Imagerie',
    MEDICAL_REPORT: 'Compte-rendu',
    VACCINATION: 'Vaccination',
    CERTIFICATE: 'Certificat',
    INSURANCE: 'Assurance',
    OTHER: 'Autre',
  };

  const categoryIcons: Record<string, React.ReactNode> = {
    PRESCRIPTION: <Pill className="w-5 h-5 text-blue-500" />,
    LAB_RESULT: <TestTube className="w-5 h-5 text-purple-500" />,
    IMAGING: <Eye className="w-5 h-5 text-teal-500" />,
    MEDICAL_REPORT: <FileText className="w-5 h-5 text-gray-500" />,
    VACCINATION: <Syringe className="w-5 h-5 text-green-500" />,
    CERTIFICATE: <Shield className="w-5 h-5 text-yellow-500" />,
    INSURANCE: <Receipt className="w-5 h-5 text-orange-500" />,
    OTHER: <Folder className="w-5 h-5 text-gray-400" />,
  };

  const filteredDocs = documents.filter((d) => {
    const matchesFilter = filter === 'all' || d.category === filter;
    const matchesSearch = searchQuery === '' ||
      (d.title || d.fileName).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const groupByMonth = (docs: MedicalDocument[]) => {
    const groups: Record<string, MedicalDocument[]> = {};
    docs.forEach((doc) => {
      const date = new Date(doc.documentDate || doc.createdAt);
      const key = `${date.toLocaleString('fr-FR', { month: 'long' })} ${date.getFullYear()}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(doc);
    });
    return groups;
  };

  const grouped = groupByMonth(filteredDocs);

  const handleDownload = (doc: MedicalDocument) => {
    // Create a download link
    const link = document.createElement('a');
    link.href = doc.fileUrl;
    link.download = doc.fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowActionsFor(null);
  };

  const handlePreview = (doc: MedicalDocument) => {
    setPreviewDoc(doc);
    setShowActionsFor(null);
  };

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const isPreviewable = (doc: MedicalDocument) => {
    const ext = getFileExtension(doc.fileName);
    return ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Documents</h2>
        <button className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Ajouter un document
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un document..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
        >
          <option value="all">Toutes les catégories</option>
          {Object.entries(categoryLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
          <option>Tous les statuts</option>
        </select>
      </div>

      {/* Documents list */}
      {Object.keys(grouped).length > 0 ? (
        Object.entries(grouped).map(([month, docs]) => (
          <div key={month}>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">{month}</h3>
            <div className="space-y-2">
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer group"
                  onClick={() => handlePreview(doc)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      {categoryIcons[doc.category] || <FileText className="w-5 h-5 text-gray-400" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{doc.title || doc.fileName}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(doc.documentDate || doc.createdAt)} - {(doc.fileSize / 1024).toFixed(0)} Ko - {getFileExtension(doc.fileName).toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                      {categoryLabels[doc.category] || doc.category}
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs">Brouillon</span>

                    {/* Action buttons - visible on hover */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); handlePreview(doc); }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Aperçu"
                      >
                        <Eye className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDownload(doc); }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Télécharger"
                      >
                        <Download className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>

                    {/* More actions dropdown */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowActionsFor(showActionsFor === doc.id ? null : doc.id);
                        }}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </button>

                      {showActionsFor === doc.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                          <button
                            onClick={(e) => { e.stopPropagation(); handlePreview(doc); }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            Aperçu
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDownload(doc); }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Télécharger
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); window.print(); }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Printer className="w-4 h-4" />
                            Imprimer
                          </button>
                          <hr className="my-1" />
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            Supprimer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Folder className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Aucun document</p>
          <button className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 flex items-center gap-2 mx-auto">
            <Plus className="w-4 h-4" />
            Ajouter un document
          </button>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setPreviewDoc(null)}>
          <div
            className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  {categoryIcons[previewDoc.category] || <FileText className="w-5 h-5 text-gray-400" />}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{previewDoc.title || previewDoc.fileName}</h3>
                  <p className="text-xs text-gray-500">
                    {formatDate(previewDoc.documentDate || previewDoc.createdAt)} - {(previewDoc.fileSize / 1024).toFixed(0)} Ko
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(previewDoc)}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Télécharger
                </button>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Modal Body - Preview Content */}
            <div className="flex-1 overflow-auto p-6 bg-gray-50">
              {isPreviewable(previewDoc) ? (
                <div className="flex items-center justify-center min-h-[400px]">
                  {getFileExtension(previewDoc.fileName) === 'pdf' ? (
                    <iframe
                      src={previewDoc.fileUrl}
                      className="w-full h-[600px] rounded-lg border border-gray-200"
                      title={previewDoc.title || previewDoc.fileName}
                    />
                  ) : (
                    <img
                      src={previewDoc.fileUrl}
                      alt={previewDoc.title || previewDoc.fileName}
                      className="max-w-full max-h-[600px] object-contain rounded-lg shadow-lg"
                    />
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                  <FileText className="w-16 h-16 text-gray-300 mb-4" />
                  <p className="text-gray-600 font-medium mb-2">Aperçu non disponible</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Ce type de fichier ({getFileExtension(previewDoc.fileName).toUpperCase()}) ne peut pas être prévisualisé.
                  </p>
                  <button
                    onClick={() => handleDownload(previewDoc)}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger le fichier
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer - Document Info */}
            <div className="px-6 py-4 border-t border-gray-200 bg-white">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                    {categoryLabels[previewDoc.category] || previewDoc.category}
                  </span>
                  <span className="text-gray-500">
                    Ajouté le {formatDate(previewDoc.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg" title="Imprimer">
                    <Printer className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ObservationsSection({ observations }: { observations: ClinicalObservation[] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Observations</h2>
        <button className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nouvelle observation
        </button>
      </div>

      {observations.length > 0 ? (
        <div className="space-y-4">
          {observations.map((obs) => (
            <div key={obs.id} className={`p-4 bg-white rounded-xl border ${obs.isUrgent ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {obs.isUrgent && <AlertCircle className="w-5 h-5 text-red-500" />}
                  <span className="font-medium text-gray-900">{obs.title || `Observation du ${formatDate(obs.observedAt)}`}</span>
                  {obs.isUrgent && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-xs">Urgent</span>
                  )}
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  obs.category === 'ALERT' ? 'bg-red-100 text-red-700' :
                  obs.category === 'VITAL_SIGNS' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {OBSERVATION_CATEGORY_LABELS[obs.category] || obs.category}
                </span>
              </div>
              <p className="text-gray-700">{obs.content}</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                <span>{obs.doctor?.fullName}</span>
                <span>{formatDateTime(obs.observedAt)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Eye className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Aucune observation enregistrée</p>
        </div>
      )}
    </div>
  );
}

function TraitementSection({ treatments, treatmentsStats }: { treatments: Treatment[]; treatmentsStats: any }) {
  const [tab, setTab] = useState<'active' | 'history'>('active');

  const activeTreatments = treatments.filter((t) => t.status === 'ACTIVE' || t.status === 'PAUSED');
  const historyTreatments = treatments.filter((t) => t.status === 'STOPPED' || t.status === 'COMPLETED');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Traitement en cours</h2>
        <button className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nouvelle ordonnance
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setTab('active')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 ${
            tab === 'active' ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500'
          }`}
        >
          <Pill className="w-4 h-4 inline mr-2" />
          Traitement actif ({treatmentsStats.active})
        </button>
        <button
          onClick={() => setTab('history')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 ${
            tab === 'history' ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500'
          }`}
        >
          <History className="w-4 h-4 inline mr-2" />
          Historique ({historyTreatments.length})
        </button>
      </div>

      {/* Content */}
      {tab === 'active' ? (
        activeTreatments.length > 0 ? (
          <div className="space-y-4">
            {activeTreatments.map((t) => (
              <TreatmentCard key={t.id} treatment={t} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <Pill className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600 mb-2">Aucun traitement en cours</p>
            <p className="text-sm text-gray-500 mb-4">Ce patient n'a pas de traitement actif. Créez une ordonnance pour démarrer un traitement.</p>
            <button className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 flex items-center gap-2 mx-auto">
              <Plus className="w-4 h-4" />
              Nouvelle ordonnance
            </button>
          </div>
        )
      ) : (
        historyTreatments.length > 0 ? (
          <div className="space-y-4">
            {historyTreatments.map((t) => (
              <TreatmentCard key={t.id} treatment={t} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <History className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Aucun traitement dans l'historique</p>
          </div>
        )
      )}
    </div>
  );
}

function TreatmentCard({ treatment }: { treatment: Treatment }) {
  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-700',
    PAUSED: 'bg-yellow-100 text-yellow-700',
    STOPPED: 'bg-red-100 text-red-700',
    COMPLETED: 'bg-gray-100 text-gray-700',
  };

  const statusLabels: Record<string, string> = {
    ACTIVE: 'En cours',
    PAUSED: 'Suspendu',
    STOPPED: 'Arrêté',
    COMPLETED: 'Terminé',
  };

  return (
    <div className="p-4 bg-white rounded-xl border border-gray-200">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-900">{treatment.medicationName}</h4>
          {treatment.genericName && (
            <p className="text-sm text-gray-500">{treatment.genericName}</p>
          )}
        </div>
        <span className={`px-2 py-1 rounded text-xs ${statusColors[treatment.status]}`}>
          {statusLabels[treatment.status]}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Posologie</p>
          <p className="font-medium">{treatment.dosage} - {treatment.frequency}</p>
        </div>
        <div>
          <p className="text-gray-500">Début</p>
          <p className="font-medium">{formatDate(treatment.startDate)}</p>
        </div>
        {treatment.endDate && (
          <div>
            <p className="text-gray-500">Fin prévue</p>
            <p className="font-medium">{formatDate(treatment.endDate)}</p>
          </div>
        )}
      </div>
      {treatment.indication && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-sm text-gray-500">Indication: {treatment.indication}</p>
        </div>
      )}
    </div>
  );
}

function BiologieSection({ latestBiometrics, labResults, patientId, onFetchHistory, biometricsHistory }: any) {
  const [tab, setTab] = useState<'biologie' | 'biometrie'>('biologie');

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Biologie et Biométrie</h2>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setTab('biologie')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 ${
            tab === 'biologie' ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500'
          }`}
        >
          <TestTube className="w-4 h-4 inline mr-2" />
          Biologie
        </button>
        <button
          onClick={() => setTab('biometrie')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 ${
            tab === 'biometrie' ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500'
          }`}
        >
          <Activity className="w-4 h-4 inline mr-2" />
          Biométrie
        </button>
      </div>

      {tab === 'biologie' ? (
        labResults.length > 0 ? (
          <div className="space-y-4">
            {labResults.map((result: LabResult) => (
              <div key={result.id} className={`p-4 bg-white rounded-xl border ${result.isAbnormal ? 'border-red-300' : 'border-gray-200'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{result.testName}</h4>
                    {result.testCode && <p className="text-xs text-gray-500">{result.testCode}</p>}
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-semibold ${result.isAbnormal ? 'text-red-600' : 'text-gray-900'}`}>
                      {result.value} {result.unit}
                    </p>
                    {result.normalRange && (
                      <p className="text-xs text-gray-500">Normal: {result.normalRange}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  <span>{formatDate(result.resultDate)}</span>
                  {result.labName && <span>{result.labName}</span>}
                  {result.interpretation && (
                    <span className={result.isAbnormal ? 'text-red-600' : 'text-green-600'}>
                      {result.interpretation}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <TestTube className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600 mb-2">Aucun résultat biologique</p>
            <p className="text-sm text-gray-500">Aucun résultat d'analyse n'a été enregistré pour ce patient.</p>
            <button className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 flex items-center gap-2 mx-auto">
              <Plus className="w-4 h-4" />
              Ajouter un résultat
            </button>
          </div>
        )
      ) : (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-5 gap-4">
            {latestBiometrics.weight && (
              <BiometricCard icon={Scale} label="Poids" value={`${latestBiometrics.weight.value} kg`} date={latestBiometrics.weight.measuredAt} />
            )}
            {latestBiometrics.height && (
              <BiometricCard icon={Ruler} label="Taille" value={`${latestBiometrics.height.value} cm`} date={latestBiometrics.height.measuredAt} />
            )}
            {latestBiometrics.blood_pressure && (
              <BiometricCard
                icon={Activity}
                label="Tension"
                value={`${latestBiometrics.blood_pressure.value}/${latestBiometrics.blood_pressure.valueSecondary}`}
                date={latestBiometrics.blood_pressure.measuredAt}
                isAbnormal={latestBiometrics.blood_pressure.isAbnormal}
              />
            )}
            {latestBiometrics.temperature && (
              <BiometricCard icon={Thermometer} label="Température" value={`${latestBiometrics.temperature.value}°C`} date={latestBiometrics.temperature.measuredAt} />
            )}
            {latestBiometrics.heart_rate && (
              <BiometricCard icon={Heart} label="Fréq. cardiaque" value={`${latestBiometrics.heart_rate.value} bpm`} date={latestBiometrics.heart_rate.measuredAt} />
            )}
          </div>

          {Object.keys(latestBiometrics).length === 0 && (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <Activity className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Aucune mesure biométrique enregistrée</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function VaccinationSection({ vaccinations }: { vaccinations: Vaccination[] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Carnet de vaccination</h2>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            Exporter
          </button>
          <button className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Ajouter une vaccination
          </button>
        </div>
      </div>

      <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 flex items-center justify-between">
        <span className="text-teal-700 font-medium">Vaccinations effectuées</span>
        <span className="px-3 py-1 bg-teal-600 text-white rounded-full text-sm font-medium">{vaccinations.length} vaccinations</span>
      </div>

      {vaccinations.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Vaccin</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Dose</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Lot</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fabricant</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Prochain</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {vaccinations.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="font-medium text-gray-900">{v.vaccineName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDate(v.administeredAt)}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Dose {v.doseNumber}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{v.lotNumber || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{v.manufacturer || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{v.nextDoseAt ? formatDate(v.nextDoseAt) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Syringe className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Aucune vaccination enregistrée</p>
        </div>
      )}
    </div>
  );
}

function FacturesSection({ invoices }: { invoices: Invoice[] }) {
  const totalPaid = invoices.filter((i) => i.status === 'PAID').reduce((sum, i) => sum + Number(i.total), 0);
  const totalPending = invoices.filter((i) => i.status !== 'PAID' && i.status !== 'CANCELLED').reduce((sum, i) => sum + Number(i.total), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Factures</h2>
        <button className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nouvelle facture
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-green-700">Payé</span>
          </div>
          <p className="text-2xl font-bold text-green-700">{totalPaid.toFixed(2)} €</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-5 h-5 text-yellow-500" />
            <span className="text-yellow-700">En attente</span>
          </div>
          <p className="text-2xl font-bold text-yellow-700">{totalPending.toFixed(2)} €</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
          <option>Tous les statuts</option>
          <option value="PAID">Payées</option>
          <option value="SENT">En attente</option>
          <option value="OVERDUE">En retard</option>
        </select>
      </div>

      {/* List */}
      {invoices.length > 0 ? (
        <div className="space-y-3">
          {invoices.map((inv) => {
            const statusColors: Record<string, string> = {
              PAID: 'bg-green-100 text-green-700',
              SENT: 'bg-yellow-100 text-yellow-700',
              DRAFT: 'bg-gray-100 text-gray-700',
              OVERDUE: 'bg-red-100 text-red-700',
              CANCELLED: 'bg-gray-100 text-gray-500',
            };
            const statusLabels: Record<string, string> = {
              PAID: 'Payée',
              SENT: 'En attente',
              DRAFT: 'Brouillon',
              OVERDUE: 'En retard',
              CANCELLED: 'Annulée',
            };

            return (
              <div key={inv.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{inv.invoiceNumber}</p>
                    <p className="text-xs text-gray-500">
                      Émise le {formatDate(inv.issueDate)}
                      {inv.dueDate && ` - Échéance: ${formatDate(inv.dueDate)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-1 rounded text-xs ${statusColors[inv.status]}`}>
                    {statusLabels[inv.status]}
                  </span>
                  <span className="font-semibold text-gray-900">{Number(inv.total).toFixed(2)} €</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Receipt className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Aucune facture</p>
        </div>
      )}
    </div>
  );
}

// Certificats médicaux Section
function CertificatsSection({ certificates }: { certificates: MedicalCertificate[] }) {
  const CERT_TYPE_LABELS: Record<string, { label: string; color: string; icon: any }> = {
    APTITUDE: { label: 'Aptitude', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    ARRET_TRAVAIL: { label: 'Arrêt de travail', color: 'bg-red-100 text-red-700', icon: Briefcase },
    SPORT: { label: 'Sport', color: 'bg-blue-100 text-blue-700', icon: Activity },
    MEDICAL: { label: 'Médical', color: 'bg-purple-100 text-purple-700', icon: FileText },
    VACCINATION: { label: 'Vaccination', color: 'bg-teal-100 text-teal-700', icon: Syringe },
    AUTRE: { label: 'Autre', color: 'bg-gray-100 text-gray-700', icon: FileText },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Certificats médicaux</h2>
        <button className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nouveau certificat
        </button>
      </div>

      {/* Filtres par type */}
      <div className="flex flex-wrap gap-2">
        <button className="px-3 py-1.5 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">
          Tous ({certificates.length})
        </button>
        {Object.entries(CERT_TYPE_LABELS).map(([type, config]) => {
          const count = certificates.filter(c => c.type === type).length;
          if (count === 0) return null;
          return (
            <button key={type} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium hover:bg-gray-200">
              {config.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Liste des certificats */}
      {certificates.length > 0 ? (
        <div className="space-y-3">
          {certificates.map((cert) => {
            const typeConfig = CERT_TYPE_LABELS[cert.type] || CERT_TYPE_LABELS.AUTRE;
            const TypeIcon = typeConfig.icon;

            return (
              <div key={cert.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:border-teal-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeConfig.color.split(' ')[0]}`}>
                      <TypeIcon className={`w-5 h-5 ${typeConfig.color.split(' ')[1]}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{cert.title}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs ${typeConfig.color}`}>
                          {typeConfig.label}
                        </span>
                      </div>
                      {cert.description && (
                        <p className="text-sm text-gray-600 mb-2">{cert.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Émis le {formatDate(cert.issuedAt)}
                        </span>
                        {cert.startDate && cert.endDate && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Du {formatDate(cert.startDate)} au {formatDate(cert.endDate)}
                          </span>
                        )}
                        {cert.recipient && (
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            {cert.recipient}
                          </span>
                        )}
                      </div>
                      {cert.doctor && (
                        <p className="text-xs text-gray-400 mt-2">Par {cert.doctor.fullName}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg" title="Imprimer">
                      <Printer className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg" title="Télécharger">
                      <Download className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg" title="Plus">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Award className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">Aucun certificat médical</p>
          <button className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700">
            Créer un certificat
          </button>
        </div>
      )}
    </div>
  );
}

// Correspondances médicales Section
function CorrespondancesSection({ correspondences }: { correspondences: MedicalCorrespondence[] }) {
  const [filter, setFilter] = useState<'ALL' | 'INCOMING' | 'OUTGOING'>('ALL');

  const CATEGORY_LABELS: Record<string, string> = {
    COMPTE_RENDU: 'Compte-rendu',
    DEMANDE_AVIS: 'Demande d\'avis',
    REPONSE_AVIS: 'Réponse',
    TRANSFERT: 'Transfert',
    AUTRE: 'Autre',
  };

  const filteredCorrespondences = correspondences.filter(c =>
    filter === 'ALL' || c.type === filter
  );

  const unreadCount = correspondences.filter(c => !c.isRead && c.type === 'INCOMING').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-900">Correspondances</h2>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
              {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <button className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nouveau courrier
        </button>
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'ALL' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Tous ({correspondences.length})
        </button>
        <button
          onClick={() => setFilter('INCOMING')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            filter === 'INCOMING' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Inbox className="w-4 h-4" />
          Reçus ({correspondences.filter(c => c.type === 'INCOMING').length})
        </button>
        <button
          onClick={() => setFilter('OUTGOING')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            filter === 'OUTGOING' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Send className="w-4 h-4" />
          Envoyés ({correspondences.filter(c => c.type === 'OUTGOING').length})
        </button>
      </div>

      {/* Liste */}
      {filteredCorrespondences.length > 0 ? (
        <div className="space-y-3">
          {filteredCorrespondences.map((corr) => (
            <div
              key={corr.id}
              className={`bg-white rounded-xl border p-4 hover:border-teal-300 transition-colors cursor-pointer ${
                !corr.isRead && corr.type === 'INCOMING' ? 'border-teal-300 bg-teal-50/30' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    corr.type === 'INCOMING' ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    {corr.type === 'INCOMING' ? (
                      <Inbox className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Send className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-semibold truncate ${!corr.isRead && corr.type === 'INCOMING' ? 'text-gray-900' : 'text-gray-700'}`}>
                        {corr.subject}
                      </h3>
                      {!corr.isRead && corr.type === 'INCOMING' && (
                        <span className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">{corr.content}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-600">
                        {CATEGORY_LABELS[corr.category]}
                      </span>
                      <span>
                        {corr.type === 'INCOMING' ? 'De' : 'À'}: {corr.type === 'INCOMING' ? corr.senderName : corr.recipientName}
                        {(corr.type === 'INCOMING' ? corr.senderSpecialty : corr.recipientSpecialty) && (
                          <span className="text-gray-400"> ({corr.type === 'INCOMING' ? corr.senderSpecialty : corr.recipientSpecialty})</span>
                        )}
                      </span>
                      <span>{formatDate(corr.date)}</span>
                      {corr.attachments.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Folder className="w-3.5 h-3.5" />
                          {corr.attachments.length} pièce{corr.attachments.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg" title="Répondre">
                    <Reply className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg" title="Plus">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <FileSignature className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">Aucune correspondance</p>
          <button className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700">
            Rédiger un courrier
          </button>
        </div>
      )}
    </div>
  );
}

// Messagerie patient Section
function MessagerieSection({ messages, patient }: { messages: PatientMessage[]; patient: Patient }) {
  const [newMessage, setNewMessage] = useState('');

  const TYPE_ICONS: Record<string, any> = {
    SMS: Phone,
    EMAIL: Mail,
    APP: MessageSquare,
  };

  const groupedMessages = messages.reduce((groups, msg) => {
    const date = new Date(msg.sentAt).toLocaleDateString('fr-FR');
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {} as Record<string, PatientMessage[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Messagerie</h2>
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 flex items-center gap-2">
            <Phone className="w-4 h-4" />
            SMS
          </button>
          <button className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email
          </button>
        </div>
      </div>

      {/* Conversation */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
              <span className="text-teal-700 font-semibold text-sm">
                {patient.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'P'}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900">{patient.fullName}</p>
              <p className="text-xs text-gray-500">{patient.email}</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="h-96 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              <div className="flex items-center justify-center mb-4">
                <span className="px-3 py-1 bg-white text-gray-500 text-xs rounded-full border border-gray-200">
                  {date}
                </span>
              </div>
              <div className="space-y-3">
                {msgs.map((msg) => {
                  const TypeIcon = TYPE_ICONS[msg.type];
                  const isOutgoing = msg.direction === 'OUTGOING';

                  return (
                    <div key={msg.id} className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] ${isOutgoing ? 'order-1' : 'order-2'}`}>
                        <div className={`rounded-2xl px-4 py-2.5 ${
                          isOutgoing
                            ? 'bg-teal-600 text-white rounded-br-md'
                            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                        }`}>
                          {msg.subject && (
                            <p className={`text-xs font-medium mb-1 ${isOutgoing ? 'text-teal-200' : 'text-gray-500'}`}>
                              {msg.subject}
                            </p>
                          )}
                          <p className="text-sm">{msg.content}</p>
                        </div>
                        <div className={`flex items-center gap-2 mt-1 text-xs text-gray-400 ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
                          <TypeIcon className="w-3 h-3" />
                          <span>
                            {new Date(msg.sentAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isOutgoing && (
                            <span className={msg.status === 'READ' ? 'text-teal-500' : ''}>
                              {msg.status === 'READ' ? '✓✓' : msg.status === 'DELIVERED' ? '✓' : '○'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-gray-200 bg-white">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Écrire un message..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                rows={2}
              />
            </div>
            <button
              className="px-4 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 flex items-center gap-2 disabled:opacity-50"
              disabled={!newMessage.trim()}
            >
              <Send className="w-4 h-4" />
              Envoyer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Protocoles de soins Section
function ProtocolesSection({ protocols }: { protocols: CareProtocol[] }) {
  const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    ACTIVE: { label: 'Actif', color: 'bg-green-100 text-green-700' },
    PENDING: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700' },
    EXPIRED: { label: 'Expiré', color: 'bg-red-100 text-red-700' },
    TERMINATED: { label: 'Terminé', color: 'bg-gray-100 text-gray-600' },
  };

  const TYPE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
    ALD: { label: 'ALD', icon: Shield, color: 'bg-purple-100 text-purple-600' },
    PARCOURS_SOINS: { label: 'Parcours de soins', icon: Target, color: 'bg-blue-100 text-blue-600' },
    PLAN_TRAITEMENT: { label: 'Plan de traitement', icon: ClipboardList, color: 'bg-teal-100 text-teal-600' },
    SUIVI_CHRONIQUE: { label: 'Suivi chronique', icon: Activity, color: 'bg-orange-100 text-orange-600' },
  };

  const activeProtocols = protocols.filter(p => p.status === 'ACTIVE').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-900">Protocoles de soins</h2>
          {activeProtocols > 0 && (
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
              {activeProtocols} actif{activeProtocols > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <button className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nouveau protocole
        </button>
      </div>

      {/* Liste des protocoles */}
      {protocols.length > 0 ? (
        <div className="space-y-4">
          {protocols.map((protocol) => {
            const typeConfig = TYPE_CONFIG[protocol.type] || TYPE_CONFIG.PLAN_TRAITEMENT;
            const statusConfig = STATUS_CONFIG[protocol.status] || STATUS_CONFIG.ACTIVE;
            const TypeIcon = typeConfig.icon;

            const daysUntilRenewal = protocol.renewalDate
              ? Math.ceil((new Date(protocol.renewalDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              : null;

            return (
              <div key={protocol.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${typeConfig.color.split(' ')[0]}`}>
                        <TypeIcon className={`w-6 h-6 ${typeConfig.color.split(' ')[1]}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{protocol.title}</h3>
                          <span className={`px-2 py-0.5 rounded text-xs ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{protocol.pathology}</p>
                        {protocol.description && (
                          <p className="text-sm text-gray-500">{protocol.description}</p>
                        )}
                      </div>
                    </div>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Dates et alertes */}
                  <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Du {formatDate(protocol.startDate)} {protocol.endDate && `au ${formatDate(protocol.endDate)}`}
                    </span>
                    {daysUntilRenewal !== null && daysUntilRenewal > 0 && daysUntilRenewal <= 60 && (
                      <span className="flex items-center gap-1 text-orange-600">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Renouvellement dans {daysUntilRenewal} jours
                      </span>
                    )}
                    {protocol.doctor && (
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {protocol.doctor.fullName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Objectifs */}
                {protocol.objectives.length > 0 && (
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <p className="text-xs font-medium text-gray-500 mb-2">OBJECTIFS</p>
                    <div className="flex flex-wrap gap-2">
                      {protocol.objectives.map((obj, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-700">
                          {obj}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interventions */}
                {protocol.interventions.length > 0 && (
                  <div className="p-4">
                    <p className="text-xs font-medium text-gray-500 mb-3">INTERVENTIONS PRÉVUES</p>
                    <div className="space-y-2">
                      {protocol.interventions.map((intervention, idx) => (
                        <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-teal-500 rounded-full" />
                            <span className="text-sm text-gray-700">{intervention.name}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="px-2 py-0.5 bg-gray-100 rounded">{intervention.frequency}</span>
                            <span>{intervention.responsible}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Target className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">Aucun protocole de soins</p>
          <button className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700">
            Créer un protocole
          </button>
        </div>
      )}
    </div>
  );
}

// Types pour les onglets de consultation
interface Prescription {
  id: string;
  medicament: string;
  dosage: string;
  frequence: string;
  duree: string;
  instructions?: string;
}

interface AnalyseBiologie {
  id: string;
  nom: string;
  type: string;
  urgent: boolean;
  instructions?: string;
}

interface Courrier {
  id: string;
  destinataire: string;
  objet: string;
  contenu: string;
  dateCreation: string;
}

interface PrescriptionImagerie {
  id: string;
  examen: string;
  zone: string;
  indication: string;
  urgent: boolean;
}

interface Consultation {
  id: string;
  patientId: string;
  doctorId: string;
  startedAt: string;
  endedAt: string | null;
  motif: string;
  interrogatoire: string;
  examen: string;
  notes: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  doctor?: { fullName: string };
  prescriptions: Prescription[];
  analyses: AnalyseBiologie[];
  courriers: Courrier[];
  imageries: PrescriptionImagerie[];
}

// Interface pour les modèles de consultation
interface ConsultationTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  motif: string;
  interrogatoire: string;
  examen: string;
  notes: string;
  prescriptions: Omit<Prescription, 'id'>[];
  analyses: Omit<AnalyseBiologie, 'id'>[];
  imageries: Omit<PrescriptionImagerie, 'id'>[];
  isCustom?: boolean;
}

// Modèles prédéfinis
const PREDEFINED_TEMPLATES: ConsultationTemplate[] = [
  {
    id: 'grippe',
    name: 'Syndrome grippal',
    category: 'Infectiologie',
    description: 'Consultation pour syndrome grippal avec traitement symptomatique',
    motif: 'Syndrome grippal',
    interrogatoire: 'Fièvre, courbatures, céphalées, rhinorrhée. Début des symptômes il y a ___ jours. Pas de facteurs de risque de complication.',
    examen: 'T°: ___°C. Rhinopharyngite. Auscultation pulmonaire normale. Pas de signe de gravité.',
    notes: 'Syndrome grippal non compliqué. Traitement symptomatique. Repos. Hydratation. Consulter si aggravation ou persistance > 5 jours.',
    prescriptions: [
      { medicament: 'Paracétamol', dosage: '1000mg', frequence: '3x/jour', duree: '5 jours', instructions: 'Espacer les prises de 6h minimum' },
      { medicament: 'Spray nasal eau de mer', dosage: '', frequence: '4x/jour', duree: '7 jours', instructions: 'Lavage nasal' },
    ],
    analyses: [],
    imageries: [],
  },
  {
    id: 'angine',
    name: 'Angine bactérienne',
    category: 'Infectiologie',
    description: 'Consultation pour angine avec TDR positif',
    motif: 'Angine - TDR positif',
    interrogatoire: 'Odynophagie depuis ___ jours. Fièvre. Pas d\'allergie connue aux pénicillines.',
    examen: 'T°: ___°C. Pharynx inflammatoire avec amygdales hypertrophiées et exsudat. Adénopathies cervicales. TDR streptocoque: POSITIF.',
    notes: 'Angine streptococcique. Antibiothérapie 6 jours. Éviction scolaire/travail 2 jours après début antibiotiques.',
    prescriptions: [
      { medicament: 'Amoxicilline', dosage: '1g', frequence: '2x/jour', duree: '6 jours', instructions: 'Pendant les repas' },
      { medicament: 'Paracétamol', dosage: '1000mg', frequence: '3x/jour', duree: '3 jours', instructions: 'Si douleur ou fièvre' },
    ],
    analyses: [],
    imageries: [],
  },
  {
    id: 'hta-suivi',
    name: 'Suivi HTA',
    category: 'Cardiologie',
    description: 'Consultation de suivi pour hypertension artérielle',
    motif: 'Suivi hypertension artérielle',
    interrogatoire: 'Patient sous traitement antihypertenseur. Bonne observance. Pas de céphalées, pas de vertiges, pas de douleur thoracique.',
    examen: 'TA: ___/___ mmHg (moyenne sur 3 mesures). FC: ___ bpm. Auscultation cardio-pulmonaire normale. Pas d\'œdèmes des membres inférieurs.',
    notes: 'HTA bien équilibrée sous traitement actuel. Poursuite du traitement. RDV de contrôle dans 3 mois avec bilan.',
    prescriptions: [
      { medicament: 'Ramipril', dosage: '5mg', frequence: '1x/jour', duree: '3 mois', instructions: 'Le matin' },
      { medicament: 'Amlodipine', dosage: '5mg', frequence: '1x/jour', duree: '3 mois', instructions: 'Le matin' },
    ],
    analyses: [
      { nom: 'Ionogramme sanguin', type: 'biochimie', urgent: false, instructions: '' },
      { nom: 'Créatinine', type: 'biochimie', urgent: false, instructions: '' },
      { nom: 'Bilan lipidique', type: 'biochimie', urgent: false, instructions: 'À jeun' },
    ],
    imageries: [],
  },
  {
    id: 'diabete-suivi',
    name: 'Suivi Diabète type 2',
    category: 'Endocrinologie',
    description: 'Consultation trimestrielle de suivi diabète',
    motif: 'Suivi diabète type 2',
    interrogatoire: 'Patient diabétique type 2. Traitement actuel: ___. Bonne observance. Pas d\'hypoglycémies. Alimentation équilibrée. Activité physique: ___.',
    examen: 'Poids: ___ kg. IMC: ___. TA: ___/___ mmHg. Examen des pieds: normal, sensibilité conservée. Pouls pédieux perçus.',
    notes: 'Diabète type 2 équilibré. Poursuite du traitement. Rappel des règles hygiéno-diététiques. Prochain contrôle dans 3 mois.',
    prescriptions: [
      { medicament: 'Metformine', dosage: '1000mg', frequence: '2x/jour', duree: '3 mois', instructions: 'Pendant les repas' },
    ],
    analyses: [
      { nom: 'HbA1c', type: 'biochimie', urgent: false, instructions: '' },
      { nom: 'Glycémie à jeun', type: 'biochimie', urgent: false, instructions: 'À jeun' },
      { nom: 'Créatinine + DFG', type: 'biochimie', urgent: false, instructions: '' },
      { nom: 'Microalbuminurie', type: 'biochimie', urgent: false, instructions: 'Urines du matin' },
    ],
    imageries: [],
  },
  {
    id: 'lombalgie',
    name: 'Lombalgie aiguë',
    category: 'Rhumatologie',
    description: 'Consultation pour lombalgie aiguë commune',
    motif: 'Lombalgie aiguë',
    interrogatoire: 'Douleur lombaire d\'apparition brutale depuis ___ jours. Facteur déclenchant: ___. Pas de sciatique. Pas de trouble sphinctérien. Pas de fièvre.',
    examen: 'Contracture paravertébrale lombaire. Lasègue négatif bilatéral. Réflexes ostéo-tendineux normaux. Force musculaire conservée. Pas de déficit sensitif.',
    notes: 'Lombalgie aiguë commune. Pas de signe de gravité. Maintien des activités dans la limite de la douleur. Éviter le repos au lit prolongé.',
    prescriptions: [
      { medicament: 'Paracétamol', dosage: '1000mg', frequence: '3x/jour', duree: '7 jours', instructions: '' },
      { medicament: 'Ibuprofène', dosage: '400mg', frequence: '3x/jour', duree: '5 jours', instructions: 'Pendant les repas. Arrêter si douleurs gastriques.' },
      { medicament: 'Thiocolchicoside', dosage: '4mg', frequence: '2x/jour', duree: '5 jours', instructions: 'Myorelaxant' },
    ],
    analyses: [],
    imageries: [],
  },
  {
    id: 'infection-urinaire',
    name: 'Infection urinaire simple',
    category: 'Infectiologie',
    description: 'Cystite aiguë simple chez la femme',
    motif: 'Cystite aiguë',
    interrogatoire: 'Brûlures mictionnelles, pollakiurie depuis ___ jours. Pas de fièvre. Pas de douleur lombaire. Pas de grossesse. Pas d\'antécédent d\'IU récidivante.',
    examen: 'Apyrexie. Fosse lombaires libres et indolores. BU: leucocytes +, nitrites +.',
    notes: 'Cystite aiguë simple. Traitement minute ou court. Hydratation abondante. Consulter si persistance des symptômes à 72h.',
    prescriptions: [
      { medicament: 'Fosfomycine-Trométamol', dosage: '3g', frequence: '1 prise unique', duree: '1 jour', instructions: 'Le soir au coucher, vessie vide. À distance des repas.' },
    ],
    analyses: [],
    imageries: [],
  },
  {
    id: 'bilan-annuel',
    name: 'Bilan annuel',
    category: 'Médecine générale',
    description: 'Consultation de bilan de santé annuel',
    motif: 'Bilan de santé annuel',
    interrogatoire: 'Consultation de contrôle annuel. Pas de plainte particulière. Antécédents: ___. Traitements en cours: ___. Mode de vie: tabac ___, alcool ___, activité physique ___.',
    examen: 'Poids: ___ kg. Taille: ___ cm. IMC: ___. TA: ___/___ mmHg. Auscultation cardio-pulmonaire normale. Abdomen souple. Examen cutané sans particularité.',
    notes: 'Bilan de santé satisfaisant. Rappel des mesures de prévention. Mise à jour du calendrier vaccinal si besoin.',
    prescriptions: [],
    analyses: [
      { nom: 'NFS', type: 'hematologie', urgent: false, instructions: '' },
      { nom: 'Glycémie à jeun', type: 'biochimie', urgent: false, instructions: 'À jeun' },
      { nom: 'Bilan lipidique complet', type: 'biochimie', urgent: false, instructions: 'À jeun' },
      { nom: 'Créatinine', type: 'biochimie', urgent: false, instructions: '' },
      { nom: 'ASAT/ALAT', type: 'biochimie', urgent: false, instructions: '' },
    ],
    imageries: [],
  },
  {
    id: 'gastro',
    name: 'Gastro-entérite',
    category: 'Gastro-entérologie',
    description: 'Gastro-entérite aiguë virale',
    motif: 'Gastro-entérite aiguë',
    interrogatoire: 'Diarrhée aqueuse depuis ___ jours, ___ selles/jour. Nausées/vomissements. Pas de sang dans les selles. Pas de fièvre élevée. Contexte épidémique.',
    examen: 'Apyrexie ou fébricule. Abdomen souple, sensible diffusément. Pas de défense. Bruits hydro-aériques présents. Signes de déshydratation: ___.',
    notes: 'Gastro-entérite aiguë d\'allure virale. Réhydratation orale. Régime sans résidu. Consulter si persistance > 3 jours ou signes de gravité.',
    prescriptions: [
      { medicament: 'Smecta', dosage: '1 sachet', frequence: '3x/jour', duree: '3 jours', instructions: 'À distance des autres médicaments' },
      { medicament: 'Tiorfan', dosage: '100mg', frequence: '3x/jour', duree: '3 jours', instructions: '' },
      { medicament: 'Spasfon', dosage: '2 comprimés', frequence: '3x/jour', duree: '3 jours', instructions: 'Si douleurs abdominales' },
    ],
    analyses: [],
    imageries: [],
  },
];

function ConsultationSection({ patient }: { patient: Patient }) {
  const [activeConsultation, setActiveConsultation] = useState<Consultation | null>(null);
  const [consultationHistory, setConsultationHistory] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [motif, setMotif] = useState('');
  const [notes, setNotes] = useState('');
  const [interrogatoire, setInterrogatoire] = useState('');
  const [examen, setExamen] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [activeRightTab, setActiveRightTab] = useState<'ordonnance' | 'biologie' | 'courrier' | 'imagerie'>('ordonnance');
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<Consultation | null>(null);
  const [viewingHistoryItem, setViewingHistoryItem] = useState<Consultation | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // États pour les onglets
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [analyses, setAnalyses] = useState<AnalyseBiologie[]>([]);
  const [courriers, setCourriers] = useState<Courrier[]>([]);
  const [imageries, setImageries] = useState<PrescriptionImagerie[]>([]);

  // États pour les modals
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showAnalyseModal, setShowAnalyseModal] = useState(false);
  const [showCourrierModal, setShowCourrierModal] = useState(false);
  const [showImagerieModal, setShowImagerieModal] = useState(false);

  // États pour les formulaires
  const [newPrescription, setNewPrescription] = useState<Omit<Prescription, 'id'>>({
    medicament: '', dosage: '', frequence: '', duree: '', instructions: ''
  });
  const [newAnalyse, setNewAnalyse] = useState<Omit<AnalyseBiologie, 'id'>>({
    nom: '', type: 'standard', urgent: false, instructions: ''
  });
  const [newCourrier, setNewCourrier] = useState<Omit<Courrier, 'id' | 'dateCreation'>>({
    destinataire: '', objet: '', contenu: ''
  });
  const [newImagerie, setNewImagerie] = useState<Omit<PrescriptionImagerie, 'id'>>({
    examen: '', zone: '', indication: '', urgent: false
  });

  // États pour l'édition des éléments (null = création, string = ID de l'élément en édition)
  const [editingPrescriptionId, setEditingPrescriptionId] = useState<string | null>(null);
  const [editingAnalyseId, setEditingAnalyseId] = useState<string | null>(null);
  const [editingCourrierId, setEditingCourrierId] = useState<string | null>(null);
  const [editingImagerieId, setEditingImagerieId] = useState<string | null>(null);

  // États pour l'envoi par email
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailDocumentType, setEmailDocumentType] = useState<'ordonnance' | 'biologie' | 'courrier' | 'imagerie' | 'all'>('ordonnance');
  const [sendingEmail, setSendingEmail] = useState(false);

  // États pour les modèles de consultation
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [customTemplates, setCustomTemplates] = useState<ConsultationTemplate[]>([]);
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');
  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState<string>('all');
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');

  // Persistance des modèles personnalisés (localStorage)
  const [templatesLoaded, setTemplatesLoaded] = useState(false);

  // Charger les modèles personnalisés depuis localStorage au montage
  useEffect(() => {
    try {
      const savedTemplates = localStorage.getItem('customConsultationTemplates');
      if (savedTemplates) {
        const parsed = JSON.parse(savedTemplates);
        setCustomTemplates(parsed);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des modèles:', error);
    }
    setTemplatesLoaded(true);
  }, []);

  // Sauvegarder les modèles personnalisés dans localStorage à chaque modification
  useEffect(() => {
    // Ne sauvegarder qu'après le chargement initial pour éviter d'écraser les données
    if (!templatesLoaded) return;

    try {
      localStorage.setItem('customConsultationTemplates', JSON.stringify(customTemplates));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des modèles:', error);
    }
  }, [customTemplates, templatesLoaded]);

  // Charger les consultations
  useEffect(() => {
    const fetchConsultations = async () => {
      try {
        const token = localStorage.getItem('token');
        // Simulation - en production, appeler l'API
        // const response = await fetch(`${API_BASE_URL}/consultations?patientId=${patient.id}`, {
        //   headers: { Authorization: `Bearer ${token}` },
        // });
        // const data = await response.json();

        // Données simulées pour démonstration
        const mockHistory: Consultation[] = [
          {
            id: '1',
            patientId: patient.id,
            doctorId: 'doc1',
            startedAt: '2025-01-20T14:30:00Z',
            endedAt: '2025-01-20T15:00:00Z',
            motif: 'Douleurs abdominales persistantes',
            interrogatoire: 'Douleurs épigastriques depuis 3 jours, aggravées après les repas. Pas de nausées ni vomissements. Transit normal.',
            examen: 'Abdomen souple, sensibilité épigastrique modérée. Pas de défense. Bruits hydro-aériques présents.',
            notes: 'Prescription de IPP pour 14 jours. Contrôle dans 2 semaines si persistance.',
            status: 'COMPLETED',
            doctor: { fullName: 'Dr. Martin Dupont' },
            prescriptions: [
              { id: '1', medicament: 'Oméprazole', dosage: '20mg', frequence: '1x/jour', duree: '14 jours', instructions: 'À prendre le matin à jeun' }
            ],
            analyses: [],
            courriers: [],
            imageries: []
          },
          {
            id: '2',
            patientId: patient.id,
            doctorId: 'doc1',
            startedAt: '2025-01-10T09:00:00Z',
            endedAt: '2025-01-10T09:30:00Z',
            motif: 'Renouvellement ordonnance',
            interrogatoire: 'Patient asymptomatique. Bonne observance du traitement.',
            examen: 'TA: 135/85 mmHg. FC: 72 bpm. Auscultation cardio-pulmonaire normale.',
            notes: 'Poursuite du traitement identique. Prochain contrôle dans 3 mois avec bilan sanguin.',
            status: 'COMPLETED',
            doctor: { fullName: 'Dr. Martin Dupont' },
            prescriptions: [
              { id: '1', medicament: 'Amlodipine', dosage: '5mg', frequence: '1x/jour', duree: '3 mois', instructions: '' },
              { id: '2', medicament: 'Périndopril', dosage: '5mg', frequence: '1x/jour', duree: '3 mois', instructions: '' }
            ],
            analyses: [
              { id: '1', nom: 'Bilan lipidique complet', type: 'biochimie', urgent: false, instructions: 'À jeun' }
            ],
            courriers: [],
            imageries: []
          },
          {
            id: '3',
            patientId: patient.id,
            doctorId: 'doc1',
            startedAt: '2024-12-15T11:00:00Z',
            endedAt: '2024-12-15T11:45:00Z',
            motif: 'Bilan annuel',
            interrogatoire: 'Pas de plainte particulière. Bon état général.',
            examen: 'Examen clinique complet sans particularité. Poids stable.',
            notes: 'Mise à jour vaccinations à prévoir.',
            status: 'COMPLETED',
            doctor: { fullName: 'Dr. Martin Dupont' },
            prescriptions: [],
            analyses: [
              { id: '1', nom: 'NFS', type: 'hematologie', urgent: false, instructions: '' },
              { id: '2', nom: 'Glycémie à jeun', type: 'biochimie', urgent: false, instructions: 'À jeun' },
              { id: '3', nom: 'Créatinine', type: 'biochimie', urgent: false, instructions: '' }
            ],
            courriers: [
              { id: '1', destinataire: 'Dr. Sophie Martin - Cardiologue', objet: 'Bilan cardiologique annuel', contenu: 'Je vous adresse ce patient pour son bilan cardiologique annuel.', dateCreation: '2024-12-15T11:30:00Z' }
            ],
            imageries: [
              { id: '1', examen: 'Radiographie', zone: 'Thorax', indication: 'Bilan annuel', urgent: false }
            ]
          },
        ];

        setConsultationHistory(mockHistory);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching consultations:', error);
        setLoading(false);
      }
    };

    fetchConsultations();
  }, [patient.id]);

  const startConsultation = () => {
    const newConsultation: Consultation = {
      id: `temp-${Date.now()}`,
      patientId: patient.id,
      doctorId: 'current-doctor',
      startedAt: new Date().toISOString(),
      endedAt: null,
      motif: '',
      interrogatoire: '',
      examen: '',
      notes: '',
      status: 'ACTIVE',
      prescriptions: [],
      analyses: [],
      courriers: [],
      imageries: [],
    };
    setActiveConsultation(newConsultation);
    setMotif('');
    setInterrogatoire('');
    setExamen('');
    setNotes('');
    setPrescriptions([]);
    setAnalyses([]);
    setCourriers([]);
    setImageries([]);
    setShowHistory(false);
  };

  const saveConsultation = async () => {
    if (!activeConsultation) return;
    setSaving(true);
    try {
      // Simulation sauvegarde - en production, appeler l'API
      // await fetch(`${API_BASE_URL}/consultations/${activeConsultation.id}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      //   body: JSON.stringify({ motif, interrogatoire, examen, notes, prescriptions, analyses, courriers, imageries }),
      // });

      setActiveConsultation({
        ...activeConsultation,
        motif,
        interrogatoire,
        examen,
        notes,
        prescriptions,
        analyses,
        courriers,
        imageries,
      });
      // Afficher notification succès
    } catch (error) {
      console.error('Error saving consultation:', error);
    } finally {
      setSaving(false);
    }
  };

  const endConsultation = async () => {
    if (!activeConsultation) return;
    setSaving(true);
    try {
      const completedConsultation: Consultation = {
        ...activeConsultation,
        motif,
        interrogatoire,
        examen,
        notes,
        prescriptions,
        analyses,
        courriers,
        imageries,
        endedAt: new Date().toISOString(),
        status: 'COMPLETED',
        doctor: { fullName: 'Dr. Martin Dupont' }
      };

      setConsultationHistory([completedConsultation, ...consultationHistory]);
      setActiveConsultation(null);
      setMotif('');
      setInterrogatoire('');
      setExamen('');
      setNotes('');
      setPrescriptions([]);
      setAnalyses([]);
      setCourriers([]);
      setImageries([]);
    } catch (error) {
      console.error('Error ending consultation:', error);
    } finally {
      setSaving(false);
    }
  };

  const formatConsultationDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (start: string, end: string | null) => {
    if (!end) return 'En cours';
    const duration = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
    return `${duration} min`;
  };

  // Fonction pour générer le contenu HTML d'impression
  const generatePrintContent = (type: 'ordonnance' | 'biologie' | 'courrier' | 'imagerie') => {
    const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    const doctorName = 'Dr. Martin Dupont';
    const doctorSpecialty = 'Médecin généraliste';
    const doctorAddress = '123 Avenue de la Santé, 75001 Paris';
    const doctorPhone = '01 23 45 67 89';

    const headerHTML = `
      <div style="display: flex; justify-content: space-between; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #0d9488;">
        <div>
          <h1 style="margin: 0; color: #0d9488; font-size: 24px;">${doctorName}</h1>
          <p style="margin: 5px 0; color: #666;">${doctorSpecialty}</p>
          <p style="margin: 5px 0; color: #666; font-size: 14px;">${doctorAddress}</p>
          <p style="margin: 5px 0; color: #666; font-size: 14px;">Tél: ${doctorPhone}</p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 5px 0; color: #333;">Date: ${today}</p>
        </div>
      </div>
      <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
        <p style="margin: 0;"><strong>Patient:</strong> ${patient.fullName}</p>
        <p style="margin: 5px 0 0;"><strong>Né(e) le:</strong> ${patient.birthdate ? new Date(patient.birthdate).toLocaleDateString('fr-FR') : 'Non renseigné'}</p>
      </div>
    `;

    let contentHTML = '';

    if (type === 'ordonnance' && prescriptions.length > 0) {
      contentHTML = `
        <h2 style="color: #0d9488; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">ORDONNANCE</h2>
        <div style="margin-top: 20px;">
          ${prescriptions.map((p, index) => `
            <div style="margin-bottom: 20px; padding: 15px; border-left: 4px solid #0d9488; background: #f0fdfa;">
              <p style="margin: 0; font-size: 18px; font-weight: bold;">${index + 1}. ${p.medicament}</p>
              <p style="margin: 8px 0; color: #333;">Posologie: ${p.dosage} - ${p.frequence}</p>
              <p style="margin: 8px 0; color: #333;">Durée: ${p.duree}</p>
              ${p.instructions ? `<p style="margin: 8px 0; color: #666; font-style: italic;">${p.instructions}</p>` : ''}
            </div>
          `).join('')}
        </div>
      `;
    } else if (type === 'biologie' && analyses.length > 0) {
      contentHTML = `
        <h2 style="color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">PRESCRIPTION D'ANALYSES BIOLOGIQUES</h2>
        <div style="margin-top: 20px;">
          ${analyses.map((a, index) => `
            <div style="margin-bottom: 15px; padding: 15px; border-left: 4px solid #2563eb; background: #eff6ff;">
              <p style="margin: 0; font-size: 16px; font-weight: bold;">
                ${index + 1}. ${a.nom}
                ${a.urgent ? '<span style="background: #fef2f2; color: #dc2626; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-left: 10px;">URGENT</span>' : ''}
              </p>
              <p style="margin: 5px 0; color: #666;">Type: ${a.type}</p>
              ${a.instructions ? `<p style="margin: 5px 0; color: #666; font-style: italic;">${a.instructions}</p>` : ''}
            </div>
          `).join('')}
        </div>
      `;
    } else if (type === 'courrier' && courriers.length > 0) {
      contentHTML = courriers.map(c => `
        <div style="margin-bottom: 30px;">
          <div style="margin-bottom: 20px;">
            <p style="margin: 0;"><strong>À l'attention de:</strong> ${c.destinataire}</p>
          </div>
          <h3 style="color: #7c3aed; margin-bottom: 15px;">Objet: ${c.objet}</h3>
          <div style="line-height: 1.8; white-space: pre-wrap;">${c.contenu}</div>
          <div style="margin-top: 40px; text-align: right;">
            <p>Confraternellement,</p>
            <p style="font-weight: bold;">${doctorName}</p>
          </div>
        </div>
      `).join('<hr style="margin: 40px 0; border: none; border-top: 1px dashed #ccc;">');
    } else if (type === 'imagerie' && imageries.length > 0) {
      contentHTML = `
        <h2 style="color: #ea580c; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">PRESCRIPTION D'IMAGERIE MÉDICALE</h2>
        <div style="margin-top: 20px;">
          ${imageries.map((i, index) => `
            <div style="margin-bottom: 15px; padding: 15px; border-left: 4px solid #ea580c; background: #fff7ed;">
              <p style="margin: 0; font-size: 16px; font-weight: bold;">
                ${index + 1}. ${i.examen}
                ${i.urgent ? '<span style="background: #fef2f2; color: #dc2626; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-left: 10px;">URGENT</span>' : ''}
              </p>
              <p style="margin: 5px 0; color: #333;"><strong>Zone:</strong> ${i.zone}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Indication:</strong> ${i.indication}</p>
            </div>
          `).join('')}
        </div>
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Document médical - ${patient.fullName}</title>
        <style>
          @media print {
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
        </style>
      </head>
      <body>
        ${headerHTML}
        ${contentHTML}
        <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #999; font-size: 12px;">
          <p>Document généré le ${today}</p>
        </div>
      </body>
      </html>
    `;
  };

  // Fonction d'impression
  const handlePrint = (type: 'ordonnance' | 'biologie' | 'courrier' | 'imagerie') => {
    const content = generatePrintContent(type);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  // Fonction d'envoi par email
  const handleSendEmail = async () => {
    if (!emailRecipient) return;
    setSendingEmail(true);
    try {
      // En production, appeler l'API pour envoyer l'email
      // await fetch(`${API_BASE_URL}/documents/send-email`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      //   body: JSON.stringify({
      //     recipient: emailRecipient,
      //     documentType: emailDocumentType,
      //     patientId: patient.id,
      //     prescriptions,
      //     analyses,
      //     courriers,
      //     imageries,
      //   }),
      // });

      // Simulation d'envoi
      await new Promise(resolve => setTimeout(resolve, 1500));

      alert(`Email envoyé avec succès à ${emailRecipient}`);
      setShowEmailModal(false);
      setEmailRecipient('');
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Erreur lors de l\'envoi de l\'email');
    } finally {
      setSendingEmail(false);
    }
  };

  // Ouvrir la modal d'email avec le type de document
  const openEmailModal = (type: 'ordonnance' | 'biologie' | 'courrier' | 'imagerie' | 'all') => {
    setEmailDocumentType(type);
    setEmailRecipient(patient.email || '');
    setShowEmailModal(true);
  };

  // Obtenir tous les modèles (prédéfinis + personnalisés)
  const allTemplates = [...PREDEFINED_TEMPLATES, ...customTemplates];

  // Filtrer les modèles
  const filteredTemplates = allTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(templateSearchQuery.toLowerCase());
    const matchesCategory = selectedTemplateCategory === 'all' || template.category === selectedTemplateCategory;
    return matchesSearch && matchesCategory;
  });

  // Obtenir les catégories uniques
  const templateCategories = Array.from(new Set(allTemplates.map(t => t.category)));

  // Appliquer un modèle à la consultation en cours
  const applyTemplate = (template: ConsultationTemplate) => {
    setMotif(template.motif);
    setInterrogatoire(template.interrogatoire);
    setExamen(template.examen);
    setNotes(template.notes);

    // Ajouter les prescriptions avec des IDs uniques
    const newPrescriptions = template.prescriptions.map((p, index) => ({
      ...p,
      id: `template-${Date.now()}-${index}`
    }));
    setPrescriptions(newPrescriptions);

    // Ajouter les analyses avec des IDs uniques
    const newAnalyses = template.analyses.map((a, index) => ({
      ...a,
      id: `template-${Date.now()}-${index}`
    }));
    setAnalyses(newAnalyses);

    // Ajouter les imageries avec des IDs uniques
    const newImageries = template.imageries.map((i, index) => ({
      ...i,
      id: `template-${Date.now()}-${index}`
    }));
    setImageries(newImageries);

    setSelectedModel(template.name);
    setShowTemplateModal(false);
  };

  // Sauvegarder la consultation actuelle comme modèle
  const saveAsTemplate = () => {
    if (!newTemplateName.trim()) return;

    const newTemplate: ConsultationTemplate = {
      id: `custom-${Date.now()}`,
      name: newTemplateName,
      category: newTemplateCategory || 'Personnalisé',
      description: newTemplateDescription || `Modèle créé le ${new Date().toLocaleDateString('fr-FR')}`,
      motif,
      interrogatoire,
      examen,
      notes,
      prescriptions: prescriptions.map(({ id, ...rest }) => rest),
      analyses: analyses.map(({ id, ...rest }) => rest),
      imageries: imageries.map(({ id, ...rest }) => rest),
      isCustom: true,
    };

    setCustomTemplates([...customTemplates, newTemplate]);
    setShowSaveTemplateModal(false);
    setNewTemplateName('');
    setNewTemplateCategory('');
    setNewTemplateDescription('');

    // En production, sauvegarder dans la base de données
    // await fetch(`${API_BASE_URL}/templates`, { method: 'POST', body: JSON.stringify(newTemplate) });
  };

  // Supprimer un modèle personnalisé
  const deleteCustomTemplate = (templateId: string) => {
    setCustomTemplates(customTemplates.filter(t => t.id !== templateId));
  };

  // Fonctions d'édition pour chaque type d'élément
  const openEditPrescription = (prescription: Prescription) => {
    setEditingPrescriptionId(prescription.id);
    setNewPrescription({
      medicament: prescription.medicament,
      dosage: prescription.dosage,
      frequence: prescription.frequence,
      duree: prescription.duree,
      instructions: prescription.instructions || ''
    });
    setShowPrescriptionModal(true);
  };

  const openEditAnalyse = (analyse: AnalyseBiologie) => {
    setEditingAnalyseId(analyse.id);
    setNewAnalyse({
      nom: analyse.nom,
      type: analyse.type,
      urgent: analyse.urgent,
      instructions: analyse.instructions || ''
    });
    setShowAnalyseModal(true);
  };

  const openEditCourrier = (courrier: Courrier) => {
    setEditingCourrierId(courrier.id);
    setNewCourrier({
      destinataire: courrier.destinataire,
      objet: courrier.objet,
      contenu: courrier.contenu
    });
    setShowCourrierModal(true);
  };

  const openEditImagerie = (imagerie: PrescriptionImagerie) => {
    setEditingImagerieId(imagerie.id);
    setNewImagerie({
      examen: imagerie.examen,
      zone: imagerie.zone,
      indication: imagerie.indication,
      urgent: imagerie.urgent
    });
    setShowImagerieModal(true);
  };

  // Fonctions de sauvegarde (création ou mise à jour)
  const savePrescription = () => {
    if (!newPrescription.medicament || !newPrescription.dosage || !newPrescription.frequence || !newPrescription.duree) return;

    if (editingPrescriptionId) {
      // Mode édition
      setPrescriptions(prescriptions.map(p =>
        p.id === editingPrescriptionId ? { ...newPrescription, id: editingPrescriptionId } : p
      ));
    } else {
      // Mode création
      setPrescriptions([...prescriptions, { ...newPrescription, id: Date.now().toString() }]);
    }

    // Reset
    setNewPrescription({ medicament: '', dosage: '', frequence: '', duree: '', instructions: '' });
    setEditingPrescriptionId(null);
    setShowPrescriptionModal(false);
  };

  const saveAnalyse = () => {
    if (!newAnalyse.nom) return;

    if (editingAnalyseId) {
      setAnalyses(analyses.map(a =>
        a.id === editingAnalyseId ? { ...newAnalyse, id: editingAnalyseId } : a
      ));
    } else {
      setAnalyses([...analyses, { ...newAnalyse, id: Date.now().toString() }]);
    }

    setNewAnalyse({ nom: '', type: 'standard', urgent: false, instructions: '' });
    setEditingAnalyseId(null);
    setShowAnalyseModal(false);
  };

  const saveCourrier = () => {
    if (!newCourrier.destinataire || !newCourrier.objet || !newCourrier.contenu) return;

    if (editingCourrierId) {
      setCourriers(courriers.map(c =>
        c.id === editingCourrierId ? { ...newCourrier, id: editingCourrierId, dateCreation: courriers.find(x => x.id === editingCourrierId)?.dateCreation || new Date().toISOString() } : c
      ));
    } else {
      setCourriers([...courriers, { ...newCourrier, id: Date.now().toString(), dateCreation: new Date().toISOString() }]);
    }

    setNewCourrier({ destinataire: '', objet: '', contenu: '' });
    setEditingCourrierId(null);
    setShowCourrierModal(false);
  };

  const saveImagerie = () => {
    if (!newImagerie.examen || !newImagerie.zone || !newImagerie.indication) return;

    if (editingImagerieId) {
      setImageries(imageries.map(i =>
        i.id === editingImagerieId ? { ...newImagerie, id: editingImagerieId } : i
      ));
    } else {
      setImageries([...imageries, { ...newImagerie, id: Date.now().toString() }]);
    }

    setNewImagerie({ examen: '', zone: '', indication: '', urgent: false });
    setEditingImagerieId(null);
    setShowImagerieModal(false);
  };

  // Fermer les modales et réinitialiser l'état d'édition
  const closePrescriptionModal = () => {
    setShowPrescriptionModal(false);
    setEditingPrescriptionId(null);
    setNewPrescription({ medicament: '', dosage: '', frequence: '', duree: '', instructions: '' });
  };

  const closeAnalyseModal = () => {
    setShowAnalyseModal(false);
    setEditingAnalyseId(null);
    setNewAnalyse({ nom: '', type: 'standard', urgent: false, instructions: '' });
  };

  const closeCourrierModal = () => {
    setShowCourrierModal(false);
    setEditingCourrierId(null);
    setNewCourrier({ destinataire: '', objet: '', contenu: '' });
  };

  const closeImagerieModal = () => {
    setShowImagerieModal(false);
    setEditingImagerieId(null);
    setNewImagerie({ examen: '', zone: '', indication: '', urgent: false });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-600 border-t-transparent"></div>
      </div>
    );
  }

  // Vue historique détaillée
  if (selectedHistoryItem) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedHistoryItem(null)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Retour à l'historique</span>
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Consultation du {formatConsultationDate(selectedHistoryItem.startedAt)}</h3>
              <p className="text-sm text-gray-500">{selectedHistoryItem.doctor?.fullName} • Durée: {formatDuration(selectedHistoryItem.startedAt, selectedHistoryItem.endedAt)}</p>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              Terminée
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Motif de consultation</label>
              <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-800">
                {selectedHistoryItem.motif || 'Non renseigné'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes cliniques</label>
              <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-800 whitespace-pre-wrap">
                {selectedHistoryItem.notes || 'Aucune note'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vue historique liste
  if (showHistory && !activeConsultation) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Historique des consultations</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(false)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Retour
            </button>
            <button
              onClick={startConsultation}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nouvelle consultation
            </button>
          </div>
        </div>

        {consultationHistory.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <History className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600">Aucune consultation passée</p>
          </div>
        ) : (
          <div className="space-y-3">
            {consultationHistory.map((consultation) => (
              <div
                key={consultation.id}
                onClick={() => setSelectedHistoryItem(consultation)}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:border-teal-300 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">
                        {formatConsultationDate(consultation.startedAt)}
                      </span>
                      <span className="text-xs text-gray-500">
                        • {formatDuration(consultation.startedAt, consultation.endedAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 font-medium mb-1">{consultation.motif || 'Motif non renseigné'}</p>
                    <p className="text-xs text-gray-500 line-clamp-2">{consultation.notes}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Consultation active
  if (activeConsultation) {
    const rightTabs = [
      { id: 'ordonnance' as const, label: 'Ordonnance pharmaceutique' },
      { id: 'biologie' as const, label: 'Biologie' },
      { id: 'courrier' as const, label: 'Courrier' },
      { id: 'imagerie' as const, label: 'Imagerie' },
    ];

    return (
      <div className="space-y-0">
        {/* Header avec actions - pleine largeur */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-900">Consultation active</span>
            </div>
            <span className="text-xs text-gray-500">
              Démarrée le {formatConsultationDate(activeConsultation.startedAt)}
            </span>
            {consultationHistory.length > 0 && (
              <button
                onClick={() => setShowHistoryModal(true)}
                className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
              >
                <History className="w-3.5 h-3.5" />
                Historique ({consultationHistory.length})
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={saveConsultation}
              disabled={saving}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Enregistrer
            </button>
            <button
              onClick={endConsultation}
              disabled={saving}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50"
            >
              Terminer la consultation
            </button>
          </div>
        </div>

        {/* Layout principal - 2 colonnes */}
        <div className="flex gap-6">
          {/* Colonne gauche - Formulaire */}
          <div className="flex-1 min-w-0">
            {/* Modèle de consultation */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Modèle de consultation</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowTemplateModal(true)}
                  className="flex-1 flex items-center justify-between px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                >
                  <span className={selectedModel ? 'text-gray-900' : 'text-gray-500'}>
                    {selectedModel || 'Sélectionner un modèle...'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                {(motif || prescriptions.length > 0 || analyses.length > 0) && (
                  <button
                    onClick={() => setShowSaveTemplateModal(true)}
                    className="px-3 py-2.5 border border-teal-300 bg-teal-50 text-teal-700 rounded-lg text-sm hover:bg-teal-100 transition-colors flex items-center gap-1"
                    title="Sauvegarder comme modèle"
                  >
                    <Plus className="w-4 h-4" />
                    Sauvegarder
                  </button>
                )}
              </div>
              {selectedModel && (
                <button
                  onClick={() => {
                    setSelectedModel('');
                    setMotif('');
                    setInterrogatoire('');
                    setExamen('');
                    setNotes('');
                    setPrescriptions([]);
                    setAnalyses([]);
                    setImageries([]);
                  }}
                  className="mt-1 text-xs text-gray-500 hover:text-gray-700"
                >
                  Effacer le modèle
                </button>
              )}
            </div>

            {/* Motif */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Motif</label>
              <textarea
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                placeholder="Entrer le motif de consultation..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-y focus:ring-2 focus:ring-teal-500 focus:border-teal-500 min-h-[60px]"
                rows={2}
              />
            </div>

            {/* Interrogatoire */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Interrogatoire</label>
              <textarea
                value={interrogatoire}
                onChange={(e) => setInterrogatoire(e.target.value)}
                placeholder="Entrer les réponses de l'interrogatoire : symptômes, anamnèse..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-y focus:ring-2 focus:ring-teal-500 focus:border-teal-500 min-h-[100px]"
                rows={4}
              />
            </div>

            {/* Examen */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Examen</label>
              <textarea
                value={examen}
                onChange={(e) => setExamen(e.target.value)}
                placeholder="Entrer les résultats de l'examen..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-y focus:ring-2 focus:ring-teal-500 focus:border-teal-500 min-h-[100px]"
                rows={4}
              />
            </div>

            {/* Notes supplémentaires */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes supplémentaires</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observations complémentaires, recommandations..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-y focus:ring-2 focus:ring-teal-500 focus:border-teal-500 min-h-[80px]"
                rows={3}
              />
            </div>
          </div>

          {/* Colonne droite - Onglets */}
          <div className="w-80 flex-shrink-0">
            {/* Tabs */}
            <div className="border-b border-gray-200 mb-4">
              <div className="flex flex-wrap gap-1">
                {rightTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveRightTab(tab.id)}
                    className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                      activeRightTab === tab.id
                        ? 'bg-white border border-b-white border-gray-200 text-teal-600 -mb-px'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 min-h-[300px]">
              {/* Onglet Ordonnance */}
              {activeRightTab === 'ordonnance' && (
                <div className="space-y-3">
                  <button
                    onClick={() => setShowPrescriptionModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-teal-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter un médicament
                  </button>
                  {prescriptions.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4">Aucun médicament prescrit</p>
                  ) : (
                    <div className="space-y-2 max-h-[250px] overflow-y-auto">
                      {prescriptions.map((p) => (
                        <div key={p.id} className="p-2 bg-gray-50 rounded-lg group relative">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 cursor-pointer" onClick={() => openEditPrescription(p)}>
                              <p className="text-sm font-medium text-gray-900">{p.medicament}</p>
                              <p className="text-xs text-gray-600">{p.dosage} - {p.frequence}</p>
                              <p className="text-xs text-gray-500">Durée: {p.duree}</p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                              <button
                                onClick={() => openEditPrescription(p)}
                                className="p-1 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded"
                                title="Modifier"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setPrescriptions(prescriptions.filter(x => x.id !== p.id))}
                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                                title="Supprimer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          {p.instructions && <p className="text-xs text-gray-500 mt-1 italic">{p.instructions}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                  {prescriptions.length > 0 && (
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => handlePrint('ordonnance')}
                        className="flex-1 flex items-center justify-center gap-1 text-xs text-teal-600 hover:text-teal-700 hover:bg-teal-50 font-medium py-2 rounded transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Imprimer
                      </button>
                      <button
                        onClick={() => openEmailModal('ordonnance')}
                        className="flex-1 flex items-center justify-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium py-2 rounded transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Envoyer
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Onglet Biologie */}
              {activeRightTab === 'biologie' && (
                <div className="space-y-3">
                  <button
                    onClick={() => setShowAnalyseModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-teal-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Prescrire une analyse
                  </button>
                  {analyses.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4">Aucune analyse prescrite</p>
                  ) : (
                    <div className="space-y-2 max-h-[250px] overflow-y-auto">
                      {analyses.map((a) => (
                        <div key={a.id} className="p-2 bg-gray-50 rounded-lg group relative">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 cursor-pointer" onClick={() => openEditAnalyse(a)}>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-gray-900">{a.nom}</p>
                                {a.urgent && <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded">URGENT</span>}
                              </div>
                              <p className="text-xs text-gray-500">{a.type}</p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                              <button
                                onClick={() => openEditAnalyse(a)}
                                className="p-1 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded"
                                title="Modifier"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setAnalyses(analyses.filter(x => x.id !== a.id))}
                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                                title="Supprimer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          {a.instructions && <p className="text-xs text-gray-500 mt-1 italic">{a.instructions}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                  {analyses.length > 0 && (
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => handlePrint('biologie')}
                        className="flex-1 flex items-center justify-center gap-1 text-xs text-teal-600 hover:text-teal-700 hover:bg-teal-50 font-medium py-2 rounded transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Imprimer
                      </button>
                      <button
                        onClick={() => openEmailModal('biologie')}
                        className="flex-1 flex items-center justify-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium py-2 rounded transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Envoyer
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Onglet Courrier */}
              {activeRightTab === 'courrier' && (
                <div className="space-y-3">
                  <button
                    onClick={() => setShowCourrierModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-teal-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Créer un courrier
                  </button>
                  {courriers.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4">Aucun courrier créé</p>
                  ) : (
                    <div className="space-y-2 max-h-[250px] overflow-y-auto">
                      {courriers.map((c) => (
                        <div key={c.id} className="p-2 bg-gray-50 rounded-lg group relative">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 cursor-pointer" onClick={() => openEditCourrier(c)}>
                              <p className="text-sm font-medium text-gray-900">{c.objet}</p>
                              <p className="text-xs text-gray-600">À: {c.destinataire}</p>
                              <p className="text-xs text-gray-500 line-clamp-2">{c.contenu}</p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                              <button
                                onClick={() => openEditCourrier(c)}
                                className="p-1 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded"
                                title="Modifier"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setCourriers(courriers.filter(x => x.id !== c.id))}
                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                                title="Supprimer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {courriers.length > 0 && (
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => handlePrint('courrier')}
                        className="flex-1 flex items-center justify-center gap-1 text-xs text-teal-600 hover:text-teal-700 hover:bg-teal-50 font-medium py-2 rounded transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Imprimer
                      </button>
                      <button
                        onClick={() => openEmailModal('courrier')}
                        className="flex-1 flex items-center justify-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium py-2 rounded transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Envoyer
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Onglet Imagerie */}
              {activeRightTab === 'imagerie' && (
                <div className="space-y-3">
                  <button
                    onClick={() => setShowImagerieModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-teal-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Prescrire un examen
                  </button>
                  {imageries.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4">Aucun examen d'imagerie prescrit</p>
                  ) : (
                    <div className="space-y-2 max-h-[250px] overflow-y-auto">
                      {imageries.map((i) => (
                        <div key={i.id} className="p-2 bg-gray-50 rounded-lg group relative">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 cursor-pointer" onClick={() => openEditImagerie(i)}>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-gray-900">{i.examen}</p>
                                {i.urgent && <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded">URGENT</span>}
                              </div>
                              <p className="text-xs text-gray-600">Zone: {i.zone}</p>
                              <p className="text-xs text-gray-500">{i.indication}</p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                              <button
                                onClick={() => openEditImagerie(i)}
                                className="p-1 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded"
                                title="Modifier"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setImageries(imageries.filter(x => x.id !== i.id))}
                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                                title="Supprimer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {imageries.length > 0 && (
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => handlePrint('imagerie')}
                        className="flex-1 flex items-center justify-center gap-1 text-xs text-teal-600 hover:text-teal-700 hover:bg-teal-50 font-medium py-2 rounded transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Imprimer
                      </button>
                      <button
                        onClick={() => openEmailModal('imagerie')}
                        className="flex-1 flex items-center justify-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium py-2 rounded transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Envoyer
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Consultations récentes */}
            {consultationHistory.length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Consultations récentes</h4>
                <div className="space-y-1.5">
                  {consultationHistory.slice(0, 2).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setViewingHistoryItem(c)}
                      className="w-full text-left p-2 bg-white rounded border border-gray-200 hover:border-teal-300 transition-colors"
                    >
                      <p className="text-xs font-medium text-gray-900 truncate">{c.motif || 'Sans motif'}</p>
                      <p className="text-[10px] text-gray-500">{formatConsultationDate(c.startedAt)}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal pour voir les détails d'une consultation passée */}
        {viewingHistoryItem && (
          <>
            <div
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setViewingHistoryItem(null)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <h2 className="text-base font-semibold text-gray-900">Détails de la consultation</h2>
                  <button
                    onClick={() => setViewingHistoryItem(null)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{formatConsultationDate(viewingHistoryItem.startedAt)}</p>
                      <p className="text-xs text-gray-500">{viewingHistoryItem.doctor?.fullName} • {formatDuration(viewingHistoryItem.startedAt, viewingHistoryItem.endedAt)}</p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      Terminée
                    </span>
                  </div>

                  <div className="space-y-4">
                    {/* Motif */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Motif de consultation</label>
                      <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-800">
                        {viewingHistoryItem.motif || 'Non renseigné'}
                      </div>
                    </div>

                    {/* Interrogatoire */}
                    {viewingHistoryItem.interrogatoire && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Interrogatoire</label>
                        <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-800 whitespace-pre-wrap">
                          {viewingHistoryItem.interrogatoire}
                        </div>
                      </div>
                    )}

                    {/* Examen */}
                    {viewingHistoryItem.examen && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Examen clinique</label>
                        <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-800 whitespace-pre-wrap">
                          {viewingHistoryItem.examen}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {viewingHistoryItem.notes && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                        <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-800 whitespace-pre-wrap">
                          {viewingHistoryItem.notes}
                        </div>
                      </div>
                    )}

                    {/* Prescriptions */}
                    {viewingHistoryItem.prescriptions && viewingHistoryItem.prescriptions.length > 0 && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-2">Ordonnance ({viewingHistoryItem.prescriptions.length} médicament{viewingHistoryItem.prescriptions.length > 1 ? 's' : ''})</label>
                        <div className="space-y-2">
                          {viewingHistoryItem.prescriptions.map((p) => (
                            <div key={p.id} className="p-3 bg-teal-50 border border-teal-100 rounded-lg">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{p.medicament}</p>
                                  <p className="text-xs text-gray-600">{p.dosage} - {p.frequence} - {p.duree}</p>
                                  {p.instructions && <p className="text-xs text-gray-500 mt-1 italic">{p.instructions}</p>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Analyses */}
                    {viewingHistoryItem.analyses && viewingHistoryItem.analyses.length > 0 && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-2">Biologie ({viewingHistoryItem.analyses.length} analyse{viewingHistoryItem.analyses.length > 1 ? 's' : ''})</label>
                        <div className="space-y-2">
                          {viewingHistoryItem.analyses.map((a) => (
                            <div key={a.id} className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-gray-900">{a.nom}</p>
                                {a.urgent && <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded">URGENT</span>}
                              </div>
                              <p className="text-xs text-gray-600">{a.type}</p>
                              {a.instructions && <p className="text-xs text-gray-500 mt-1 italic">{a.instructions}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Courriers */}
                    {viewingHistoryItem.courriers && viewingHistoryItem.courriers.length > 0 && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-2">Courriers ({viewingHistoryItem.courriers.length})</label>
                        <div className="space-y-2">
                          {viewingHistoryItem.courriers.map((c) => (
                            <div key={c.id} className="p-3 bg-purple-50 border border-purple-100 rounded-lg">
                              <p className="text-sm font-medium text-gray-900">{c.objet}</p>
                              <p className="text-xs text-gray-600">À: {c.destinataire}</p>
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{c.contenu}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Imageries */}
                    {viewingHistoryItem.imageries && viewingHistoryItem.imageries.length > 0 && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-2">Imagerie ({viewingHistoryItem.imageries.length} examen{viewingHistoryItem.imageries.length > 1 ? 's' : ''})</label>
                        <div className="space-y-2">
                          {viewingHistoryItem.imageries.map((i) => (
                            <div key={i.id} className="p-3 bg-orange-50 border border-orange-100 rounded-lg">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-gray-900">{i.examen}</p>
                                {i.urgent && <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded">URGENT</span>}
                              </div>
                              <p className="text-xs text-gray-600">Zone: {i.zone}</p>
                              <p className="text-xs text-gray-500 mt-1">{i.indication}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
                  <button
                    onClick={() => setViewingHistoryItem(null)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    Fermer
                  </button>
                  <button
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    Imprimer
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Modal pour voir tout l'historique */}
        {showHistoryModal && (
          <>
            <div
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setShowHistoryModal(false)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <h2 className="text-base font-semibold text-gray-900">Historique des consultations</h2>
                  <button
                    onClick={() => setShowHistoryModal(false)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="overflow-y-auto max-h-[calc(80vh-120px)] p-5">
                  {consultationHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <History className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                      <p className="text-sm text-gray-500">Aucune consultation passée</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {consultationHistory.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setShowHistoryModal(false);
                            setViewingHistoryItem(c);
                          }}
                          className="p-4 border border-gray-200 rounded-lg hover:border-teal-300 hover:bg-gray-50 cursor-pointer transition-all"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900">
                              {formatConsultationDate(c.startedAt)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDuration(c.startedAt, c.endedAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 font-medium mb-1">{c.motif || 'Motif non renseigné'}</p>
                          <p className="text-xs text-gray-500 line-clamp-2">{c.notes}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={() => setShowHistoryModal(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Modal Ordonnance - Ajouter/Modifier un médicament */}
        {showPrescriptionModal && (
          <>
            <div
              className="fixed inset-0 bg-black/30 z-40"
              onClick={closePrescriptionModal}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <h2 className="text-base font-semibold text-gray-900">
                    {editingPrescriptionId ? 'Modifier le médicament' : 'Ajouter un médicament'}
                  </h2>
                  <button
                    onClick={closePrescriptionModal}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Médicament *</label>
                    <input
                      type="text"
                      value={newPrescription.medicament}
                      onChange={(e) => setNewPrescription({ ...newPrescription, medicament: e.target.value })}
                      placeholder="Nom du médicament"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dosage *</label>
                      <input
                        type="text"
                        value={newPrescription.dosage}
                        onChange={(e) => setNewPrescription({ ...newPrescription, dosage: e.target.value })}
                        placeholder="ex: 500mg"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fréquence *</label>
                      <select
                        value={newPrescription.frequence}
                        onChange={(e) => setNewPrescription({ ...newPrescription, frequence: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      >
                        <option value="">Sélectionner</option>
                        <option value="1x/jour">1x/jour</option>
                        <option value="2x/jour">2x/jour</option>
                        <option value="3x/jour">3x/jour</option>
                        <option value="4x/jour">4x/jour</option>
                        <option value="Matin">Matin</option>
                        <option value="Midi">Midi</option>
                        <option value="Soir">Soir</option>
                        <option value="Au coucher">Au coucher</option>
                        <option value="Si besoin">Si besoin</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Durée du traitement *</label>
                    <select
                      value={newPrescription.duree}
                      onChange={(e) => setNewPrescription({ ...newPrescription, duree: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="">Sélectionner</option>
                      <option value="3 jours">3 jours</option>
                      <option value="5 jours">5 jours</option>
                      <option value="7 jours">7 jours</option>
                      <option value="10 jours">10 jours</option>
                      <option value="14 jours">14 jours</option>
                      <option value="1 mois">1 mois</option>
                      <option value="3 mois">3 mois</option>
                      <option value="6 mois">6 mois</option>
                      <option value="Chronique">Chronique</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Instructions (optionnel)</label>
                    <textarea
                      value={newPrescription.instructions || ''}
                      onChange={(e) => setNewPrescription({ ...newPrescription, instructions: e.target.value })}
                      placeholder="Instructions particulières..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
                      rows={2}
                    />
                  </div>
                </div>
                <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
                  <button
                    onClick={closePrescriptionModal}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={savePrescription}
                    disabled={!newPrescription.medicament || !newPrescription.dosage || !newPrescription.frequence || !newPrescription.duree}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {editingPrescriptionId ? 'Enregistrer' : 'Ajouter'}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Modal Biologie - Prescrire/Modifier une analyse */}
        {showAnalyseModal && (
          <>
            <div
              className="fixed inset-0 bg-black/30 z-40"
              onClick={closeAnalyseModal}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <h2 className="text-base font-semibold text-gray-900">
                    {editingAnalyseId ? 'Modifier l\'analyse' : 'Prescrire une analyse'}
                  </h2>
                  <button
                    onClick={closeAnalyseModal}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'analyse *</label>
                    <input
                      type="text"
                      value={newAnalyse.nom}
                      onChange={(e) => setNewAnalyse({ ...newAnalyse, nom: e.target.value })}
                      placeholder="ex: NFS, Glycémie, CRP..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type d'analyse *</label>
                    <select
                      value={newAnalyse.type}
                      onChange={(e) => setNewAnalyse({ ...newAnalyse, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="standard">Standard</option>
                      <option value="hematologie">Hématologie</option>
                      <option value="biochimie">Biochimie</option>
                      <option value="serologie">Sérologie</option>
                      <option value="microbiologie">Microbiologie</option>
                      <option value="hormonologie">Hormonologie</option>
                      <option value="immunologie">Immunologie</option>
                      <option value="parasitologie">Parasitologie</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="analyse-urgent"
                      checked={newAnalyse.urgent}
                      onChange={(e) => setNewAnalyse({ ...newAnalyse, urgent: e.target.checked })}
                      className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    />
                    <label htmlFor="analyse-urgent" className="text-sm text-gray-700">
                      Analyse urgente
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Instructions (optionnel)</label>
                    <textarea
                      value={newAnalyse.instructions || ''}
                      onChange={(e) => setNewAnalyse({ ...newAnalyse, instructions: e.target.value })}
                      placeholder="Instructions particulières (à jeun, heure précise...)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
                      rows={2}
                    />
                  </div>
                </div>
                <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
                  <button
                    onClick={closeAnalyseModal}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={saveAnalyse}
                    disabled={!newAnalyse.nom}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {editingAnalyseId ? 'Enregistrer' : 'Prescrire'}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Modal Courrier - Créer/Modifier un courrier */}
        {showCourrierModal && (
          <>
            <div
              className="fixed inset-0 bg-black/30 z-40"
              onClick={closeCourrierModal}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <h2 className="text-base font-semibold text-gray-900">
                    {editingCourrierId ? 'Modifier le courrier' : 'Créer un courrier'}
                  </h2>
                  <button
                    onClick={closeCourrierModal}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Destinataire *</label>
                    <input
                      type="text"
                      value={newCourrier.destinataire}
                      onChange={(e) => setNewCourrier({ ...newCourrier, destinataire: e.target.value })}
                      placeholder="Dr. Nom ou Établissement"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Objet *</label>
                    <input
                      type="text"
                      value={newCourrier.objet}
                      onChange={(e) => setNewCourrier({ ...newCourrier, objet: e.target.value })}
                      placeholder="Objet du courrier"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contenu *</label>
                    <textarea
                      value={newCourrier.contenu}
                      onChange={(e) => setNewCourrier({ ...newCourrier, contenu: e.target.value })}
                      placeholder="Rédigez votre courrier..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
                      rows={6}
                    />
                  </div>
                </div>
                <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
                  <button
                    onClick={closeCourrierModal}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={saveCourrier}
                    disabled={!newCourrier.destinataire || !newCourrier.objet || !newCourrier.contenu}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {editingCourrierId ? 'Enregistrer' : 'Créer'}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Modal Imagerie - Prescrire/Modifier un examen */}
        {showImagerieModal && (
          <>
            <div
              className="fixed inset-0 bg-black/30 z-40"
              onClick={closeImagerieModal}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <h2 className="text-base font-semibold text-gray-900">
                    {editingImagerieId ? 'Modifier l\'examen' : 'Prescrire un examen d\'imagerie'}
                  </h2>
                  <button
                    onClick={closeImagerieModal}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type d'examen *</label>
                    <select
                      value={newImagerie.examen}
                      onChange={(e) => setNewImagerie({ ...newImagerie, examen: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="">Sélectionner un examen</option>
                      <option value="Radiographie">Radiographie</option>
                      <option value="Échographie">Échographie</option>
                      <option value="Scanner (TDM)">Scanner (TDM)</option>
                      <option value="IRM">IRM</option>
                      <option value="Mammographie">Mammographie</option>
                      <option value="Ostéodensitométrie">Ostéodensitométrie</option>
                      <option value="Scintigraphie">Scintigraphie</option>
                      <option value="TEP-Scan">TEP-Scan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Zone anatomique *</label>
                    <input
                      type="text"
                      value={newImagerie.zone}
                      onChange={(e) => setNewImagerie({ ...newImagerie, zone: e.target.value })}
                      placeholder="ex: Thorax, Abdomen, Genou droit..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Indication clinique *</label>
                    <textarea
                      value={newImagerie.indication}
                      onChange={(e) => setNewImagerie({ ...newImagerie, indication: e.target.value })}
                      placeholder="Motif de la prescription..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
                      rows={2}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="imagerie-urgent"
                      checked={newImagerie.urgent}
                      onChange={(e) => setNewImagerie({ ...newImagerie, urgent: e.target.checked })}
                      className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    />
                    <label htmlFor="imagerie-urgent" className="text-sm text-gray-700">
                      Examen urgent
                    </label>
                  </div>
                </div>
                <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
                  <button
                    onClick={closeImagerieModal}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={saveImagerie}
                    disabled={!newImagerie.examen || !newImagerie.zone || !newImagerie.indication}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {editingImagerieId ? 'Enregistrer' : 'Prescrire'}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Modal Envoi par Email */}
        {showEmailModal && (
          <>
            <div
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setShowEmailModal(false)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <h2 className="text-base font-semibold text-gray-900">Envoyer par email</h2>
                  <button
                    onClick={() => setShowEmailModal(false)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adresse email du destinataire *</label>
                    <input
                      type="email"
                      value={emailRecipient}
                      onChange={(e) => setEmailRecipient(e.target.value)}
                      placeholder="exemple@email.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Document à envoyer</label>
                    <div className="space-y-2">
                      {emailDocumentType === 'ordonnance' && prescriptions.length > 0 && (
                        <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg">
                          <p className="text-sm font-medium text-teal-800">Ordonnance</p>
                          <p className="text-xs text-teal-600">{prescriptions.length} médicament{prescriptions.length > 1 ? 's' : ''}</p>
                        </div>
                      )}
                      {emailDocumentType === 'biologie' && analyses.length > 0 && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm font-medium text-blue-800">Prescription de biologie</p>
                          <p className="text-xs text-blue-600">{analyses.length} analyse{analyses.length > 1 ? 's' : ''}</p>
                        </div>
                      )}
                      {emailDocumentType === 'courrier' && courriers.length > 0 && (
                        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                          <p className="text-sm font-medium text-purple-800">Courrier{courriers.length > 1 ? 's' : ''}</p>
                          <p className="text-xs text-purple-600">{courriers.length} document{courriers.length > 1 ? 's' : ''}</p>
                        </div>
                      )}
                      {emailDocumentType === 'imagerie' && imageries.length > 0 && (
                        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <p className="text-sm font-medium text-orange-800">Prescription d'imagerie</p>
                          <p className="text-xs text-orange-600">{imageries.length} examen{imageries.length > 1 ? 's' : ''}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">
                      <strong>Patient:</strong> {patient.fullName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Le document sera envoyé en pièce jointe au format PDF.
                    </p>
                  </div>
                </div>
                <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
                  <button
                    onClick={() => setShowEmailModal(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSendEmail}
                    disabled={!emailRecipient || sendingEmail}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {sendingEmail ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Envoi...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Envoyer
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Modal Sélection de Modèle */}
        {showTemplateModal && (
          <>
            <div
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setShowTemplateModal(false)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[85vh] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <h2 className="text-base font-semibold text-gray-900">Choisir un modèle de consultation</h2>
                  <button
                    onClick={() => setShowTemplateModal(false)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Filtres */}
                <div className="px-5 py-3 border-b border-gray-100 flex gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={templateSearchQuery}
                      onChange={(e) => setTemplateSearchQuery(e.target.value)}
                      placeholder="Rechercher un modèle..."
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <select
                    value={selectedTemplateCategory}
                    onChange={(e) => setSelectedTemplateCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="all">Toutes les catégories</option>
                    {templateCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Liste des modèles */}
                <div className="overflow-y-auto max-h-[calc(85vh-180px)] p-5">
                  {filteredTemplates.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                      <p className="text-sm text-gray-500">Aucun modèle trouvé</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {filteredTemplates.map((template) => (
                        <div
                          key={template.id}
                          className="p-4 border border-gray-200 rounded-lg hover:border-teal-300 hover:shadow-sm transition-all cursor-pointer group"
                          onClick={() => applyTemplate(template)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-sm font-semibold text-gray-900 group-hover:text-teal-600">
                                {template.name}
                              </h3>
                              <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600 rounded">
                                {template.category}
                              </span>
                            </div>
                            {template.isCustom && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteCustomTemplate(template.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded transition-all"
                                title="Supprimer ce modèle"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                            {template.description}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {template.prescriptions.length > 0 && (
                              <span className="px-1.5 py-0.5 text-[10px] bg-teal-50 text-teal-700 rounded">
                                {template.prescriptions.length} médicament{template.prescriptions.length > 1 ? 's' : ''}
                              </span>
                            )}
                            {template.analyses.length > 0 && (
                              <span className="px-1.5 py-0.5 text-[10px] bg-blue-50 text-blue-700 rounded">
                                {template.analyses.length} analyse{template.analyses.length > 1 ? 's' : ''}
                              </span>
                            )}
                            {template.imageries.length > 0 && (
                              <span className="px-1.5 py-0.5 text-[10px] bg-orange-50 text-orange-700 rounded">
                                {template.imageries.length} imagerie{template.imageries.length > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="px-5 py-3 border-t border-gray-100 flex justify-between items-center">
                  <p className="text-xs text-gray-500">
                    {filteredTemplates.length} modèle{filteredTemplates.length > 1 ? 's' : ''} disponible{filteredTemplates.length > 1 ? 's' : ''}
                  </p>
                  <button
                    onClick={() => setShowTemplateModal(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Modal Sauvegarder comme Modèle */}
        {showSaveTemplateModal && (
          <>
            <div
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setShowSaveTemplateModal(false)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <h2 className="text-base font-semibold text-gray-900">Sauvegarder comme modèle</h2>
                  <button
                    onClick={() => setShowSaveTemplateModal(false)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom du modèle *</label>
                    <input
                      type="text"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      placeholder="ex: Consultation grippe saisonnière"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                    <input
                      type="text"
                      value={newTemplateCategory}
                      onChange={(e) => setNewTemplateCategory(e.target.value)}
                      placeholder="ex: Infectiologie, Cardiologie..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      list="template-categories"
                    />
                    <datalist id="template-categories">
                      {templateCategories.map(cat => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={newTemplateDescription}
                      onChange={(e) => setNewTemplateDescription(e.target.value)}
                      placeholder="Brève description du modèle..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
                      rows={2}
                    />
                  </div>

                  {/* Aperçu du contenu */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-700 mb-2">Ce modèle contiendra :</p>
                    <div className="space-y-1 text-xs text-gray-600">
                      {motif && <p>• Motif: {motif.substring(0, 50)}{motif.length > 50 ? '...' : ''}</p>}
                      {interrogatoire && <p>• Interrogatoire prérempli</p>}
                      {examen && <p>• Examen prérempli</p>}
                      {notes && <p>• Notes préremplies</p>}
                      {prescriptions.length > 0 && <p>• {prescriptions.length} prescription{prescriptions.length > 1 ? 's' : ''}</p>}
                      {analyses.length > 0 && <p>• {analyses.length} analyse{analyses.length > 1 ? 's' : ''}</p>}
                      {imageries.length > 0 && <p>• {imageries.length} examen{imageries.length > 1 ? 's' : ''} d'imagerie</p>}
                    </div>
                  </div>
                </div>
                <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
                  <button
                    onClick={() => setShowSaveTemplateModal(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={saveAsTemplate}
                    disabled={!newTemplateName.trim()}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Sauvegarder
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // État initial - pas de consultation active
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Consultation</h2>
        <div className="flex items-center gap-2">
          {consultationHistory.length > 0 && (
            <button
              onClick={() => setShowHistory(true)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              Historique ({consultationHistory.length})
            </button>
          )}
          <button
            onClick={startConsultation}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouvelle consultation
          </button>
        </div>
      </div>

      <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
        <Stethoscope className="w-12 h-12 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-600 mb-2">Aucune consultation en cours</p>
        <p className="text-sm text-gray-500 mb-6">
          Démarrez une nouvelle consultation pour {patient.fullName}
        </p>
        <button
          onClick={startConsultation}
          className="px-6 py-3 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Démarrer une consultation
        </button>
      </div>

      {/* Aperçu historique */}
      {consultationHistory.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Dernières consultations</h3>
            <button
              onClick={() => setShowHistory(true)}
              className="text-xs text-teal-600 hover:text-teal-700 font-medium"
            >
              Voir tout →
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {consultationHistory.slice(0, 3).map((consultation) => (
              <div
                key={consultation.id}
                onClick={() => setSelectedHistoryItem(consultation)}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:border-teal-300 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">
                    {formatConsultationDate(consultation.startedAt)}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                    {formatDuration(consultation.startedAt, consultation.endedAt)}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1 line-clamp-1">
                  {consultation.motif || 'Motif non renseigné'}
                </p>
                <p className="text-xs text-gray-500 line-clamp-2">
                  {consultation.notes}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
