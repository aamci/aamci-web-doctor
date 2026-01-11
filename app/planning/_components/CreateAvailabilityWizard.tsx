'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { toast } from '../../_components/Toaster';
import Step1Hours from './wizard/Step1Hours';
import Step2Recurrence from './wizard/Step2Recurrence';
import Step3Options from './wizard/Step3Options';
import WizardProgress from './wizard/WizardProgress';
import ConfirmModal from './wizard/ConfirmModal';
import type {
  WizardFormData,
  AvailabilityPreference,
  AppointmentKind,
  CreateAvailabilityRulePayload,
  CreatePreferencePayload,
} from './wizard/types';

interface CreateAvailabilityWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DEFAULT_FORM_DATA: WizardFormData = {
  // Step 1
  startHour: 9,
  endHour: 17,
  slotDurationMins: 30,
  capacity: 1,

  // Step 2
  daysOfWeek: [1, 2, 3, 4, 5], // Lun-Ven par défaut
  startDate: '',
  endDate: '',
  excludedTimes: [],

  // Step 3
  allowedKindIds: [],
  autoConfirm: true,
  allowCancellation: true,
};

export default function CreateAvailabilityWizard({
  isOpen,
  onClose,
  onSuccess,
}: CreateAvailabilityWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<WizardFormData>(DEFAULT_FORM_DATA);
  const [templates, setTemplates] = useState<AvailabilityPreference[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Step 3 states
  const [appointmentKinds, setAppointmentKinds] = useState<AppointmentKind[]>([]);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');

  // Confirmation modal states
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Fetch templates and appointment kinds au montage
  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      fetchAppointmentKinds();
      resetForm();
    }
  }, [isOpen]);

  // Auto-sélection du template par défaut
  useEffect(() => {
    if (templates.length > 0 && selectedTemplate === null) {
      const defaultTemplate = templates.find(t => t.isDefault);
      if (defaultTemplate) {
        handleTemplateSelect(defaultTemplate.id);
      }
    }
  }, [templates]);

  const resetForm = () => {
    setCurrentStep(1);
    setFormData(DEFAULT_FORM_DATA);
    setSelectedTemplate(null);
    setLoading(false);
    setSaveAsTemplate(false);
    setTemplateName('');
    setTemplateDescription('');
  };

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const token = localStorage.getItem('token');
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

      const response = await fetch(`${apiBase}/availability-preferences`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setTemplates(Array.isArray(data) ? data : data?.data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Erreur lors du chargement des modèles');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const fetchAppointmentKinds = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

      const response = await fetch(`${apiBase}/appointment-kinds`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setAppointmentKinds(Array.isArray(data) ? data : data?.data || []);
    } catch (error) {
      console.error('Error fetching appointment kinds:', error);
      // Non-bloquant, continue sans types
    }
  };

  const handleTemplateSelect = (templateId: string | null) => {
    setSelectedTemplate(templateId);

    if (templateId) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        // Pre-fill form from template
        setFormData(prev => ({
          ...prev,
          daysOfWeek: template.daysOfWeek,
          startHour: template.startHour,
          endHour: template.endHour,
          slotDurationMins: template.slotDurationMins,
          capacity: template.capacity,
          excludedTimes: template.excludedTimes,
          allowedKindIds: template.allowedKindIds,
          minBookingNotice: template.minBookingNotice,
          maxBookingAdvance: template.maxBookingAdvance,
          autoConfirm: template.autoConfirm,
          allowCancellation: template.allowCancellation,
          cancellationDeadline: template.cancellationDeadline,
        }));
      }
    } else {
      // Reset to defaults
      setFormData(DEFAULT_FORM_DATA);
    }
  };

  const handleFormChange = (data: Partial<WizardFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const validateStep1 = (): boolean => {
    if (formData.endHour <= formData.startHour) {
      toast.error('L\'heure de fin doit être après l\'heure de début');
      return false;
    }

    if (formData.capacity < 1 || formData.capacity > 10) {
      toast.error('La capacité doit être entre 1 et 10 patients');
      return false;
    }

    return true;
  };

  const validateStep2 = (): boolean => {
    if (formData.daysOfWeek.length === 0) {
      toast.error('Veuillez sélectionner au moins un jour de la semaine');
      return false;
    }

    if (!formData.startDate || !formData.endDate) {
      toast.error('Les dates de début et de fin sont requises');
      return false;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);

    if (start >= end) {
      toast.error('La date de fin doit être après la date de début');
      return false;
    }

    const diffMonths =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());

    if (diffMonths > 3) {
      toast.error('La période ne peut pas dépasser 3 mois');
      return false;
    }

    return true;
  };

  const validateStep3 = (): boolean => {
    if (saveAsTemplate && !templateName.trim()) {
      toast.error('Le nom du modèle est requis');
      return false;
    }

    return true;
  };

  const handleSetDefaultTemplate = async (templateId: string) => {
    try {
      const token = localStorage.getItem('token');
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

      await toast.promise(
        fetch(`${apiBase}/availability-preferences/${templateId}/set-default`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        }).then(async (res) => {
          if (!res.ok) {
            const errorText = await res.text().catch(() => '');
            throw new Error(errorText || `HTTP ${res.status}`);
          }
          return res.json();
        }),
        {
          loading: 'Définition du modèle par défaut...',
          success: 'Modèle défini par défaut !',
          error: (err) => `Erreur: ${err.message}`,
        }
      );

      // Rafraîchir la liste des templates
      await fetchTemplates();
    } catch (error) {
      console.error('Error setting default template:', error);
    }
  };

  const handleDeleteTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    setConfirmModal({
      isOpen: true,
      title: 'Supprimer le modèle',
      message: `Êtes-vous sûr de vouloir supprimer le modèle "${template.name}" ? Cette action est irréversible.`,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

          await toast.promise(
            fetch(`${apiBase}/availability-preferences/${templateId}`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              credentials: 'include',
            }).then(async (res) => {
              if (!res.ok) {
                const errorText = await res.text().catch(() => '');
                throw new Error(errorText || `HTTP ${res.status}`);
              }
              return res.json();
            }),
            {
              loading: 'Suppression du modèle...',
              success: 'Modèle supprimé !',
              error: (err) => `Erreur: ${err.message}`,
            }
          );

          // Si le template supprimé était sélectionné, réinitialiser
          if (selectedTemplate === templateId) {
            setSelectedTemplate(null);
            setFormData(DEFAULT_FORM_DATA);
          }

          // Rafraîchir la liste des templates
          await fetchTemplates();
        } catch (error) {
          console.error('Error deleting template:', error);
        }
      },
    });
  };

  const handleCreate = async () => {
    // Validate all steps
    if (!validateStep1() || !validateStep2() || !validateStep3()) return;

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

      // Step 1: Create availability rule
      const rulePayload: CreateAvailabilityRulePayload = {
        startDate: formData.startDate,
        endDate: formData.endDate,
        daysOfWeek: formData.daysOfWeek,
        startHour: formData.startHour,
        endHour: formData.endHour,
        slotDurationMins: formData.slotDurationMins,
        capacity: formData.capacity,
        allowedKindIds: formData.allowedKindIds,
        excludedTimes: formData.excludedTimes,
        minBookingNotice: formData.minBookingNotice,
        maxBookingAdvance: formData.maxBookingAdvance,
        autoConfirm: formData.autoConfirm,
        allowCancellation: formData.allowCancellation,
        cancellationDeadline: formData.cancellationDeadline,
      };

      await toast.promise(
        fetch(`${apiBase}/availability-rules`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
          body: JSON.stringify(rulePayload),
        }).then(async res => {
          if (!res.ok) {
            const errorText = await res.text().catch(() => '');
            throw new Error(errorText || `HTTP ${res.status}`);
          }
          return res.json();
        }),
        {
          loading: 'Création de la disponibilité...',
          success: 'Disponibilité créée avec succès !',
          error: err => `Erreur: ${err.message}`,
        }
      );

      // Step 2: Save as template if requested (non-blocking)
      if (saveAsTemplate && templateName.trim() && templates.length < 3) {
        const templatePayload: CreatePreferencePayload = {
          name: templateName.trim(),
          description: templateDescription.trim() || undefined,
          isDefault: false,
          daysOfWeek: formData.daysOfWeek,
          startHour: formData.startHour,
          endHour: formData.endHour,
          slotDurationMins: formData.slotDurationMins,
          capacity: formData.capacity,
          allowedKindIds: formData.allowedKindIds,
          excludedTimes: formData.excludedTimes,
          minBookingNotice: formData.minBookingNotice,
          maxBookingAdvance: formData.maxBookingAdvance,
          autoConfirm: formData.autoConfirm,
          allowCancellation: formData.allowCancellation,
          cancellationDeadline: formData.cancellationDeadline,
        };

        await fetch(`${apiBase}/availability-preferences`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
          body: JSON.stringify(templatePayload),
        }).catch(error => {
          console.error('Error saving template:', error);
          toast.warning('Disponibilité créée mais le modèle n\'a pas pu être sauvegardé');
        });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating availability:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header (sticky) */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Nouvelle disponibilité
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Fermer"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <WizardProgress currentStep={currentStep} totalSteps={3} />
          </div>

          {/* Body (scrollable) */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {loadingTemplates ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
              </div>
            ) : (
              <>
                {currentStep === 1 && (
                  <Step1Hours
                    formData={formData}
                    onChange={handleFormChange}
                    templates={templates}
                    selectedTemplate={selectedTemplate}
                    onTemplateSelect={handleTemplateSelect}
                    onSetDefaultTemplate={handleSetDefaultTemplate}
                    onDeleteTemplate={handleDeleteTemplate}
                  />
                )}

                {currentStep === 2 && (
                  <Step2Recurrence formData={formData} onChange={handleFormChange} />
                )}

                {currentStep === 3 && (
                  <Step3Options
                    formData={formData}
                    onChange={handleFormChange}
                    appointmentKinds={appointmentKinds}
                    saveAsTemplate={saveAsTemplate}
                    onSaveAsTemplateChange={setSaveAsTemplate}
                    templateName={templateName}
                    onTemplateNameChange={setTemplateName}
                    templateDescription={templateDescription}
                    onTemplateDescriptionChange={setTemplateDescription}
                    templateCount={templates.length}
                  />
                )}
              </>
            )}
          </div>

          {/* Footer (sticky) */}
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex justify-between gap-3">
              <button
                onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                disabled={currentStep === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                ← Précédent
              </button>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
                >
                  Annuler
                </button>

                {currentStep < 3 ? (
                  <button
                    onClick={() => {
                      const isValid =
                        currentStep === 1 ? validateStep1() : validateStep2();
                      if (isValid) {
                        setCurrentStep(prev => Math.min(3, prev + 1));
                      }
                    }}
                    className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    Suivant →
                  </button>
                ) : (
                  <button
                    onClick={handleCreate}
                    disabled={loading}
                    className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Création...
                      </>
                    ) : (
                      'Créer la disponibilité'
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
      />
    </>
  );
}
