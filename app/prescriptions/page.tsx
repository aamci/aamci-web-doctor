'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';
import {
  ArrowLeft,
  Plus,
  FileText,
  Search,
  Eye,
  Calendar,
  User,
  Pill,
  XCircle,
  Save,
  Loader2,
  Check,
  Printer,
  ZoomIn,
  ZoomOut,
  X,
} from 'lucide-react';
import { useAuth } from '../_providers/AuthProvider';
import { PrescriptionTemplate, PrintButton } from '../_components/templates';
import type { Medication, PrescriptionData } from '../_components/templates';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

interface PrescriptionFormData {
  patientId: string;
  patientName: string;
  patientBirthDate?: string;
  patientGender?: 'MALE' | 'FEMALE';
  diagnosis?: string;
  generalInstructions?: string;
  validDays: number;
  medications: Medication[];
}

interface SavedPrescription {
  id: string;
  prescriptionNumber: string;
  issueDate: string;
  validUntil?: string;
  status: string;
  diagnosis?: string;
  generalInstructions?: string;
  patient: {
    id: string;
    fullName: string;
    email: string;
    birthdate?: string;
    sex?: string;
  };
  medications: Array<{
    id: string;
    name: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
    instructions?: string;
    quantity?: number;
  }>;
}

interface MedicationTemplate {
  id: string;
  name: string;
  category: string;
  description?: string;
  diagnosis?: string;
  generalInstructions?: string;
  medications: Medication[];
  createdAt: string;
  isDefault?: boolean;
}

// Templates prédéfinis
const PREDEFINED_TEMPLATES: MedicationTemplate[] = [
  {
    id: 'template-grippe',
    name: 'Grippe standard',
    category: 'Infectieux',
    description: 'Traitement symptomatique de la grippe',
    diagnosis: 'Syndrome grippal',
    generalInstructions: 'Repos recommandé. Hydratation abondante. Consulter si aggravation.',
    medications: [
      { name: 'Paracétamol', dosage: '1g', frequency: '3 fois par jour', duration: '5 jours', instructions: 'En cas de fièvre ou douleurs', quantity: 15 },
      { name: 'Vitamine C', dosage: '1000mg', frequency: '1 fois par jour', duration: '7 jours', instructions: 'Le matin', quantity: 7 },
    ],
    createdAt: new Date().toISOString(),
    isDefault: true,
  },
  {
    id: 'template-infection-resp',
    name: 'Infection respiratoire',
    category: 'Infectieux',
    description: 'Traitement antibiotique infection respiratoire haute',
    diagnosis: 'Infection respiratoire haute',
    generalInstructions: 'Terminer le traitement même en cas d\'amélioration.',
    medications: [
      { name: 'Amoxicilline', dosage: '1g', frequency: '3 fois par jour', duration: '7 jours', instructions: 'Pendant les repas', quantity: 21 },
      { name: 'Paracétamol', dosage: '1g', frequency: 'Si besoin (max 3/j)', duration: '7 jours', instructions: 'En cas de fièvre', quantity: 21 },
    ],
    createdAt: new Date().toISOString(),
    isDefault: true,
  },
  {
    id: 'template-allergie',
    name: 'Allergie saisonnière',
    category: 'Allergie',
    description: 'Traitement antihistaminique',
    diagnosis: 'Rhinite allergique',
    medications: [
      { name: 'Cétirizine', dosage: '10mg', frequency: '1 fois par jour', duration: '15 jours', instructions: 'Le soir', quantity: 15 },
      { name: 'Collyre antiallergique', dosage: '1 goutte', frequency: '2 fois par jour', duration: '15 jours', instructions: 'Matin et soir dans chaque œil', quantity: 1 },
    ],
    createdAt: new Date().toISOString(),
    isDefault: true,
  },
  {
    id: 'template-gastro',
    name: 'Gastro-entérite',
    category: 'Digestif',
    description: 'Traitement symptomatique gastro-entérite',
    diagnosis: 'Gastro-entérite aiguë',
    generalInstructions: 'Régime léger. Hydratation orale abondante (SRO si besoin).',
    medications: [
      { name: 'Lopéramide', dosage: '2mg', frequency: 'Après chaque selle liquide (max 8/j)', duration: '3 jours', instructions: 'Ne pas dépasser 16mg/jour', quantity: 12 },
      { name: 'Saccharomyces boulardii', dosage: '200mg', frequency: '2 fois par jour', duration: '7 jours', instructions: 'Probiotique', quantity: 14 },
    ],
    createdAt: new Date().toISOString(),
    isDefault: true,
  },
];

export default function PrescriptionsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewPrescription, setPreviewPrescription] = useState<PrescriptionFormData | null>(null);

  // Database state
  const [prescriptions, setPrescriptions] = useState<SavedPrescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Quick print state
  const [quickPrintPrescription, setQuickPrintPrescription] = useState<SavedPrescription | null>(null);
  const [quickPrintZoom, setQuickPrintZoom] = useState(100);
  const [isQuickPrinting, setIsQuickPrinting] = useState(false);
  const quickPrintRef = useRef<HTMLDivElement | null>(null);

  // Templates state
  const [templates, setTemplates] = useState<MedicationTemplate[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');

  // Form state
  const [formData, setFormData] = useState<PrescriptionFormData>({
    patientId: '',
    patientName: '',
    diagnosis: '',
    generalInstructions: '',
    validDays: 30,
    medications: [
      {
        name: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
        quantity: 1,
      },
    ],
  });

  // Load prescriptions from database
  useEffect(() => {
    loadPrescriptions();
    loadTemplates();
  }, []);

  // Load templates from localStorage
  const loadTemplates = () => {
    try {
      const savedTemplates = localStorage.getItem('medicationTemplates');
      if (savedTemplates) {
        const parsed = JSON.parse(savedTemplates);
        setTemplates([...PREDEFINED_TEMPLATES, ...parsed]);
      } else {
        setTemplates(PREDEFINED_TEMPLATES);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates(PREDEFINED_TEMPLATES);
    }
  };

  // Save template to localStorage
  const saveTemplate = () => {
    if (!templateName.trim()) {
      toast.warning('Veuillez donner un nom au template');
      return;
    }

    const newTemplate: MedicationTemplate = {
      id: `custom-${Date.now()}`,
      name: templateName,
      category: templateCategory || 'Personnalisé',
      description: templateDescription,
      diagnosis: formData.diagnosis,
      generalInstructions: formData.generalInstructions,
      medications: formData.medications.filter(m => m.name),
      createdAt: new Date().toISOString(),
      isDefault: false,
    };

    try {
      const savedTemplates = localStorage.getItem('medicationTemplates');
      const existing = savedTemplates ? JSON.parse(savedTemplates) : [];
      const updated = [...existing, newTemplate];
      localStorage.setItem('medicationTemplates', JSON.stringify(updated));

      setTemplates([...PREDEFINED_TEMPLATES, ...updated]);
      setShowSaveTemplateModal(false);
      setTemplateName('');
      setTemplateCategory('');
      setTemplateDescription('');
      toast.success('Template sauvegardé avec succès !');
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Erreur lors de la sauvegarde du template');
    }
  };

  // Load template into form
  const loadTemplate = (template: MedicationTemplate) => {
    setFormData({
      ...formData,
      diagnosis: template.diagnosis || '',
      generalInstructions: template.generalInstructions || '',
      medications: template.medications.map(m => ({ ...m })),
    });
    setShowTemplateModal(false);
    toast.success(`Template "${template.name}" chargé !`);
  };

  // Delete custom template
  const deleteTemplate = (templateId: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce template ?')) return;

    try {
      const savedTemplates = localStorage.getItem('medicationTemplates');
      if (savedTemplates) {
        const existing = JSON.parse(savedTemplates);
        const updated = existing.filter((t: MedicationTemplate) => t.id !== templateId);
        localStorage.setItem('medicationTemplates', JSON.stringify(updated));
        setTemplates([...PREDEFINED_TEMPLATES, ...updated]);
      }
      toast.success('Template supprimé');
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const loadPrescriptions = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/prescriptions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPrescriptions(data);
      }
    } catch (error) {
      console.error('Error loading prescriptions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Save prescription to database
  const savePrescription = async () => {
    if (!formData.patientId) {
      toast.warning('Veuillez sélectionner un patient');
      return;
    }

    if (formData.medications.every((m) => !m.name)) {
      toast.warning('Veuillez ajouter au moins un médicament');
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const token = localStorage.getItem('token');
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + formData.validDays);

      const payload = {
        patientId: formData.patientId,
        diagnosis: formData.diagnosis,
        generalInstructions: formData.generalInstructions,
        validUntil: validUntil.toISOString(),
        medications: formData.medications.filter((m) => m.name),
      };

      const response = await fetch(`${API_BASE_URL}/prescriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde');
      }

      const savedPrescription = await response.json();
      setSaveSuccess(true);

      // Reload prescriptions list
      await loadPrescriptions();

      // Show success message
      setTimeout(() => setSaveSuccess(false), 3000);

      return savedPrescription;
    } catch (error) {
      console.error('Error saving prescription:', error);
      toast.error('Erreur lors de la sauvegarde de l\'ordonnance');
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const addMedication = () => {
    setFormData({
      ...formData,
      medications: [
        ...formData.medications,
        {
          name: '',
          dosage: '',
          frequency: '',
          duration: '',
          instructions: '',
          quantity: 1,
        },
      ],
    });
  };

  const removeMedication = (index: number) => {
    setFormData({
      ...formData,
      medications: formData.medications.filter((_, i) => i !== index),
    });
  };

  const updateMedication = (index: number, field: keyof Medication, value: string | number) => {
    const newMedications = [...formData.medications];
    newMedications[index] = { ...newMedications[index], [field]: value };
    setFormData({ ...formData, medications: newMedications });
  };

  const handlePreview = () => {
    if (!formData.patientName || formData.medications.every((m) => !m.name)) {
      toast.warning('Veuillez remplir au moins le nom du patient et un médicament');
      return;
    }
    setPreviewPrescription(formData);
  };

  const handleSaveAndPreview = async () => {
    const saved = await savePrescription();
    if (saved) {
      setPreviewPrescription(formData);
    }
  };

  const handleReset = () => {
    setFormData({
      patientId: '',
      patientName: '',
      diagnosis: '',
      generalInstructions: '',
      validDays: 30,
      medications: [
        {
          name: '',
          dosage: '',
          frequency: '',
          duration: '',
          instructions: '',
          quantity: 1,
        },
      ],
    });
    setIsCreateModalOpen(false);
    setPreviewPrescription(null);
  };

  const handleQuickPrint = () => {
    if (!quickPrintRef.current) return;
    setIsQuickPrinting(true);

    const styles = Array.from(document.styleSheets)
      .map((ss) => {
        try { return Array.from(ss.cssRules).map((r) => r.cssText).join('\n'); }
        catch { return ''; }
      })
      .join('\n');

    const html = `<!DOCTYPE html>
<html>
  <head>
    <title>Ordonnance</title>
    <style>
      ${styles}
      @page { size: A4; margin: 12mm 15mm; }
      html, body { margin: 0; padding: 0; width: 100%; }
      .print-content { width: 100%; box-sizing: border-box; }
    </style>
  </head>
  <body><div class="print-content">${quickPrintRef.current.innerHTML}</div></body>
</html>`;

    const cleanup = (frame: HTMLIFrameElement) => {
      try { document.body.removeChild(frame); } catch { /* already removed */ }
      setIsQuickPrinting(false);
    };

    const printFrame = document.createElement('iframe');
    printFrame.style.cssText = 'position:absolute;top:-9999px;left:-9999px;width:0;height:0;border:0;';
    printFrame.onload = () => {
      setTimeout(() => {
        try { printFrame.contentWindow?.print(); } catch { /* silent */ }
        setTimeout(() => cleanup(printFrame), 1500);
      }, 500);
    };
    document.body.appendChild(printFrame);
    printFrame.srcdoc = html;
  };

  const generatePrescriptionData = (): PrescriptionData => {
    const today = new Date();
    const validUntil = new Date(today);
    validUntil.setDate(validUntil.getDate() + formData.validDays);

    return {
      prescriptionNumber: `ORD-${Date.now()}`,
      issueDate: today.toISOString(),
      validUntil: validUntil.toISOString(),
      medications: formData.medications.filter((m) => m.name),
      diagnosis: formData.diagnosis,
      generalInstructions: formData.generalInstructions,
    };
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Ordonnances</h1>
            <p className="text-gray-600 text-sm">Créez et gérez vos prescriptions médicales</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Nouvelle ordonnance
          </button>
        </div>

        {/* Info Card */}
        <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl p-6 mb-6 border border-blue-100">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white rounded-lg">
              <Pill className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Créez des ordonnances professionnelles
              </h3>
              <p className="text-sm text-gray-600">
                Utilisez notre template médical pour générer des ordonnances conformes avec votre
                logo et vos informations professionnelles. Imprimez ou exportez en PDF.
              </p>
            </div>
          </div>
        </div>

        {/* Prescriptions List */}
        {isLoading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Loader2 className="w-12 h-12 text-teal-600 mx-auto mb-4 animate-spin" />
            <p className="text-gray-500">Chargement des ordonnances...</p>
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">Aucune ordonnance sauvegardée</p>
            <p className="text-sm text-gray-400 mb-4">
              Les ordonnances créées apparaîtront ici. Vous pouvez les créer directement ou depuis
              le dossier patient.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="text-teal-600 hover:text-teal-700 text-sm font-medium"
            >
              + Créer votre première ordonnance
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      N° Ordonnance
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Médicaments
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {prescriptions.map((prescription) => (
                    <tr key={prescription.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {prescription.prescriptionNumber}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {prescription.patient.fullName}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {new Date(prescription.issueDate).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {prescription.medications.length} médicament
                        {prescription.medications.length > 1 ? 's' : ''}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            prescription.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800'
                              : prescription.status === 'DRAFT'
                                ? 'bg-gray-100 text-gray-800'
                                : prescription.status === 'EXPIRED'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {prescription.status === 'ACTIVE'
                            ? 'Active'
                            : prescription.status === 'DRAFT'
                              ? 'Brouillon'
                              : prescription.status === 'EXPIRED'
                                ? 'Expirée'
                                : 'Annulée'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setQuickPrintPrescription(prescription); setQuickPrintZoom(100); }}
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-teal-600"
                            title="Aperçu"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setQuickPrintPrescription(prescription); setQuickPrintZoom(100); }}
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
                            title="Imprimer"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create Prescription Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold">Nouvelle ordonnance</h2>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setPreviewPrescription(null);
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Templates Quick Actions */}
              <div className="flex items-center gap-2 pb-4 border-b">
                <button
                  onClick={() => setShowTemplateModal(true)}
                  className="flex-1 px-4 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <FileText className="w-4 h-4" />
                  Charger un template
                </button>
                {formData.medications.some(m => m.name) && (
                  <button
                    onClick={() => setShowSaveTemplateModal(true)}
                    className="flex-1 px-4 py-2 bg-teal-50 text-teal-700 border border-teal-200 rounded-lg hover:bg-teal-100 flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <Save className="w-4 h-4" />
                    Sauvegarder comme template
                  </button>
                )}
              </div>

              {/* Patient Info */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <h3 className="text-sm font-semibold text-blue-900 mb-3">
                  Informations Patient
                </h3>
                {!formData.patientId && (
                  <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                    💡 Pour sauvegarder en base de données, créez l'ordonnance depuis le dossier patient
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom complet du patient *
                    </label>
                    <input
                      type="text"
                      value={formData.patientName}
                      onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Ex: Marie Dupont"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date de naissance
                    </label>
                    <input
                      type="date"
                      value={formData.patientBirthDate || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, patientBirthDate: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
                    <select
                      value={formData.patientGender || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          patientGender: e.target.value as 'MALE' | 'FEMALE',
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option value="">Non spécifié</option>
                      <option value="MALE">Masculin</option>
                      <option value="FEMALE">Féminin</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Diagnostic */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Diagnostic / Motif (optionnel)
                </label>
                <input
                  type="text"
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Ex: Infection respiratoire haute"
                />
              </div>

              {/* Medications */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Médicaments prescrits *
                </label>
                <div className="space-y-4">
                  {formData.medications.map((med, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                      {formData.medications.length > 1 && (
                        <button
                          onClick={() => removeMedication(index)}
                          className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                      <p className="text-sm font-medium text-gray-700 mb-3">
                        Médicament {index + 1}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <input
                            type="text"
                            placeholder="Nom du médicament *"
                            value={med.name}
                            onChange={(e) => updateMedication(index, 'name', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                            required
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Dosage (ex: 500mg)"
                          value={med.dosage || ''}
                          onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                        />
                        <input
                          type="number"
                          placeholder="Quantité"
                          value={med.quantity || 1}
                          onChange={(e) =>
                            updateMedication(index, 'quantity', parseInt(e.target.value) || 1)
                          }
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                          min="1"
                        />
                        <input
                          type="text"
                          placeholder="Posologie (ex: 3 fois par jour)"
                          value={med.frequency || ''}
                          onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Durée (ex: 7 jours)"
                          value={med.duration || ''}
                          onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                        />
                        <div className="col-span-2">
                          <input
                            type="text"
                            placeholder="Instructions spéciales (ex: À prendre pendant les repas)"
                            value={med.instructions || ''}
                            onChange={(e) =>
                              updateMedication(index, 'instructions', e.target.value)
                            }
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addMedication}
                  className="mt-3 text-sm text-teal-600 hover:text-teal-700 font-medium"
                >
                  + Ajouter un médicament
                </button>
              </div>

              {/* General Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instructions générales (optionnel)
                </label>
                <textarea
                  value={formData.generalInstructions}
                  onChange={(e) =>
                    setFormData({ ...formData, generalInstructions: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-sm"
                  placeholder="Ex: Repos recommandé, boire beaucoup d'eau..."
                />
              </div>

              {/* Validity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Validité de l'ordonnance
                </label>
                <select
                  value={formData.validDays}
                  onChange={(e) => setFormData({ ...formData, validDays: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="7">7 jours</option>
                  <option value="15">15 jours</option>
                  <option value="30">30 jours (par défaut)</option>
                  <option value="90">90 jours (3 mois)</option>
                  <option value="180">180 jours (6 mois)</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setPreviewPrescription(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                {formData.patientId && (
                  <button
                    onClick={handleSaveAndPreview}
                    disabled={isSaving}
                    className="flex-1 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sauvegarde...
                      </>
                    ) : saveSuccess ? (
                      <>
                        <Check className="w-4 h-4" />
                        Sauvegardée !
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Sauvegarder et Aperçu
                      </>
                    )}
                  </button>
                )}
                {!formData.patientId && (
                  <button
                    onClick={handlePreview}
                    className="flex-1 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Aperçu seulement
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewPrescription && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold">Aperçu de l'ordonnance</h2>
              <button
                onClick={() => setPreviewPrescription(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Print Button */}
              <div className="flex justify-between items-center pb-4 border-b">
                <p className="text-sm text-gray-600">
                  Vérifiez les informations avant d'imprimer
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium"
                  >
                    Nouvelle ordonnance
                  </button>
                  <PrintButton documentTitle={`Ordonnance-${previewPrescription.patientName}`}>
                    <PrescriptionTemplate
                      doctor={{
                        fullName: user?.fullName || 'Dr. Médecin',
                        specialty: (user as any)?.doctorProfile?.specialty,
                        address: (user as any)?.doctorProfile?.address,
                        city: (user as any)?.doctorProfile?.city,
                        phone: (user as any)?.phone,
                        email: user?.email,
                      }}
                      patient={{
                        fullName: previewPrescription.patientName,
                        birthDate: previewPrescription.patientBirthDate,
                        gender: previewPrescription.patientGender,
                      }}
                      prescription={generatePrescriptionData()}
                    />
                  </PrintButton>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-gray-50 rounded-lg p-4">
                <PrescriptionTemplate
                  doctor={{
                    fullName: user?.fullName || 'Dr. Médecin',
                    specialty: (user as any)?.doctorProfile?.specialty,
                    address: (user as any)?.doctorProfile?.address,
                    city: (user as any)?.doctorProfile?.city,
                    phone: (user as any)?.phone,
                    email: user?.email,
                  }}
                  patient={{
                    fullName: previewPrescription.patientName,
                    birthDate: previewPrescription.patientBirthDate,
                    gender: previewPrescription.patientGender,
                  }}
                  prescription={generatePrescriptionData()}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Print Preview Modal */}
      {quickPrintPrescription && (
        <>
          <div className="fixed inset-0 bg-black/60 z-50" onClick={() => setQuickPrintPrescription(null)} />
          <div className="fixed inset-4 md:inset-8 lg:inset-12 bg-gray-200 rounded-xl z-50 flex flex-col overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b flex-shrink-0">
              <h2 className="font-semibold text-gray-900 text-sm truncate mr-4">
                Aperçu — {quickPrintPrescription.prescriptionNumber} · {quickPrintPrescription.patient.fullName}
              </h2>
              <div className="flex items-center gap-2">
                {/* Zoom controls */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-1 py-1">
                  <button
                    onClick={() => setQuickPrintZoom((z) => Math.max(50, z - 10))}
                    className="p-1.5 hover:bg-white rounded-md transition-colors"
                    title="Zoom arrière"
                  >
                    <ZoomOut className="w-4 h-4 text-gray-600" />
                  </button>
                  <span className="text-xs font-medium text-gray-600 w-10 text-center select-none">
                    {quickPrintZoom}%
                  </span>
                  <button
                    onClick={() => setQuickPrintZoom((z) => Math.min(200, z + 10))}
                    className="p-1.5 hover:bg-white rounded-md transition-colors"
                    title="Zoom avant"
                  >
                    <ZoomIn className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
                <button
                  onClick={handleQuickPrint}
                  disabled={isQuickPrinting}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isQuickPrinting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Printer className="w-4 h-4" />
                  )}
                  Imprimer
                </button>
                <button
                  onClick={() => setQuickPrintPrescription(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Preview content */}
            <div className="flex-1 overflow-auto py-6 px-4">
              <div
                ref={quickPrintRef}
                className="mx-auto bg-white shadow-lg origin-top"
                style={{
                  width: '210mm',
                  minHeight: '297mm',
                  padding: '12mm 15mm',
                  boxSizing: 'border-box',
                  transform: `scale(${quickPrintZoom / 100})`,
                  transformOrigin: 'top center',
                  marginBottom: `calc((${quickPrintZoom / 100} - 1) * 297mm)`,
                }}
              >
                <PrescriptionTemplate
                  doctor={{
                    fullName: user?.fullName || 'Dr. Médecin',
                    specialty: (user as any)?.doctorProfile?.specialty,
                    address: (user as any)?.doctorProfile?.address,
                    city: (user as any)?.doctorProfile?.city,
                    phone: (user as any)?.phone,
                    email: user?.email,
                  }}
                  patient={{
                    fullName: quickPrintPrescription.patient.fullName,
                    birthDate: quickPrintPrescription.patient.birthdate,
                    gender: quickPrintPrescription.patient.sex as 'MALE' | 'FEMALE' | undefined,
                  }}
                  prescription={{
                    prescriptionNumber: quickPrintPrescription.prescriptionNumber,
                    issueDate: quickPrintPrescription.issueDate,
                    validUntil: quickPrintPrescription.validUntil,
                    medications: quickPrintPrescription.medications,
                    diagnosis: quickPrintPrescription.diagnosis,
                    generalInstructions: quickPrintPrescription.generalInstructions,
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Template Selector Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold">Choisir un template de médicaments</h2>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              {/* Template categories */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-3">
                  Chargez rapidement un template prédéfini ou personnalisé avec vos médicaments fréquents.
                </p>
              </div>

              {/* Templates grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-teal-500 hover:bg-teal-50 cursor-pointer transition-colors"
                    onClick={() => loadTemplate(template)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{template.name}</h3>
                        <span className="text-xs text-gray-500">{template.category}</span>
                      </div>
                      {template.isDefault ? (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                          Prédéfini
                        </span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTemplate(template.id);
                          }}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {template.description && (
                      <p className="text-xs text-gray-600 mb-2">{template.description}</p>
                    )}
                    <div className="text-xs text-gray-500">
                      {template.medications.length} médicament{template.medications.length > 1 ? 's' : ''}
                      {template.diagnosis && <span> · {template.diagnosis}</span>}
                    </div>
                  </div>
                ))}
              </div>

              {templates.filter(t => !t.isDefault).length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Aucun template personnalisé. Créez-en un en sauvegardant une ordonnance !
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Save Template Modal */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Sauvegarder comme template</h2>
              <button
                onClick={() => setShowSaveTemplateModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du template *
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="Ex: Mon traitement grippe"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catégorie
                </label>
                <input
                  type="text"
                  value={templateCategory}
                  onChange={(e) => setTemplateCategory(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="Ex: Infectieux, Allergie, Digestif..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optionnel)
                </label>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 resize-none"
                  rows={2}
                  placeholder="Décrivez ce template..."
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-900">
                  <strong>Contenu:</strong> {formData.medications.filter(m => m.name).length} médicament(s)
                  {formData.diagnosis && ` · ${formData.diagnosis}`}
                </p>
              </div>
            </div>

            <div className="p-4 border-t flex gap-3">
              <button
                onClick={() => setShowSaveTemplateModal(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={saveTemplate}
                className="flex-1 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
