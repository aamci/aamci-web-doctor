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

          {activeSection === 'factures' && (
            <FacturesSection invoices={invoices} />
          )}

          {activeSection === 'consultations' && (
            <ConsultationSection patient={patient} />
          )}
        </div>
      </div>

      {/* Actions Sidebar */}
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

function ConsultationSection({ patient }: { patient: Patient }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Consultation en cours</h2>
        <button className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nouvelle consultation
        </button>
      </div>

      <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
        <Stethoscope className="w-12 h-12 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-600 mb-2">Aucune consultation en cours</p>
        <p className="text-sm text-gray-500 mb-4">
          Démarrez une nouvelle consultation pour {patient.fullName} ou sélectionnez une consultation existante dans l'historique.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Démarrer une consultation
          </button>
          <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <History className="w-4 h-4" />
            Voir l'historique
          </button>
        </div>
      </div>
    </div>
  );
}
