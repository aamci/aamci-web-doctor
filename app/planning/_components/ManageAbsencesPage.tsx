'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, Trash2, AlertCircle, Plus } from 'lucide-react';
import { toast } from '../../_components/Toaster';
import ConfirmModal from './wizard/ConfirmModal';
import CreateAbsenceModal from './CreateAbsenceModal';

interface DoctorAbsence {
  id: string;
  doctorId: string;
  startDate: string;
  endDate: string;
  type: string;
  reason?: string;
  blockSlots: boolean;
  cancelAppointments: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ManageAbsencesPageProps {
  isOpen: boolean;
  onClose: () => void;
  onAbsenceUpdated: () => void;
}

const ABSENCE_TYPES: Record<string, { label: string; color: string; bgColor: string }> = {
  VACATION: { label: 'Vacances', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  SICK_LEAVE: { label: 'Congé maladie', color: 'text-red-700', bgColor: 'bg-red-100' },
  TRAINING: { label: 'Formation', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  PERSONAL: { label: 'Personnel', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  OTHER: { label: 'Autre', color: 'text-gray-700', bgColor: 'bg-gray-100' },
};

export default function ManageAbsencesPage({ isOpen, onClose, onAbsenceUpdated }: ManageAbsencesPageProps) {
  const [absences, setAbsences] = useState<DoctorAbsence[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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

  useEffect(() => {
    if (isOpen) {
      fetchAbsences();
    }
  }, [isOpen]);

  const fetchAbsences = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

      const response = await fetch(`${apiBase}/doctor-absences/mine`, {
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
      setAbsences(Array.isArray(data) ? data : data?.data || []);
    } catch (error) {
      console.error('Error fetching absences:', error);
      toast.error('Erreur lors du chargement des absences');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAbsence = (absence: DoctorAbsence) => {
    setConfirmModal({
      isOpen: true,
      title: 'Supprimer l\'absence',
      message: `Êtes-vous sûr de vouloir supprimer cette période d'absence ? Cette action est irréversible.`,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

          await toast.promise(
            fetch(`${apiBase}/doctor-absences/${absence.id}`, {
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
              loading: 'Suppression de l\'absence...',
              success: 'Absence supprimée !',
              error: (err) => `Erreur: ${err.message}`,
            }
          );

          await fetchAbsences();
          onAbsenceUpdated();
        } catch (error) {
          console.error('Error deleting absence:', error);
        }
      },
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const getDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return `${days} jour${days > 1 ? 's' : ''}`;
  };

  const isPast = (endDate: string) => {
    return new Date(endDate) < new Date();
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
          className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Gestion des absences
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {absences.length} absence{absences.length !== 1 ? 's' : ''} enregistrée{absences.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Nouvelle absence
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
              </div>
            ) : absences.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Aucune absence enregistrée</p>
                <p className="text-sm text-gray-500 mt-1">
                  Créez votre première absence pour bloquer des créneaux
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {absences.map((absence) => {
                  const typeInfo = ABSENCE_TYPES[absence.type] || ABSENCE_TYPES.OTHER;
                  const past = isPast(absence.endDate);

                  return (
                    <div
                      key={absence.id}
                      className={`border-2 rounded-lg p-4 transition-all ${
                        past
                          ? 'border-gray-200 bg-gray-50 opacity-75'
                          : 'border-teal-200 bg-teal-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${typeInfo.bgColor} ${typeInfo.color}`}>
                              {typeInfo.label}
                            </span>
                            {past && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                                Passée
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-gray-900 mb-1">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">
                              {formatDate(absence.startDate)} - {formatDate(absence.endDate)}
                            </span>
                            <span className="text-sm text-gray-600">
                              ({getDuration(absence.startDate, absence.endDate)})
                            </span>
                          </div>

                          {absence.reason && (
                            <p className="text-sm text-gray-700 mt-2">
                              {absence.reason}
                            </p>
                          )}

                          <div className="flex items-center gap-3 mt-3">
                            {absence.blockSlots && (
                              <span className="text-xs text-gray-600">
                                ✓ Créneaux bloqués
                              </span>
                            )}
                            {absence.cancelAppointments && (
                              <span className="text-xs text-red-600">
                                ✓ RDV annulés
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <button
                          onClick={() => handleDeleteAbsence(absence)}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                          title="Supprimer"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>

      {/* Create Absence Modal */}
      <CreateAbsenceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          fetchAbsences();
          onAbsenceUpdated();
        }}
      />

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
