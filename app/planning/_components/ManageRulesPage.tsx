'use client';

import { useState, useEffect } from 'react';
import { X, Edit2, Trash2, ToggleLeft, ToggleRight, Calendar, Clock, Users, AlertCircle } from 'lucide-react';
import { toast } from '../../_components/Toaster';
import ConfirmModal from './wizard/ConfirmModal';

interface AvailabilityRule {
  id: string;
  ownerId: string;
  ownerType: string;
  startDate: string;
  endDate: string;
  daysOfWeek: number[];
  startHour: number;
  endHour: number;
  slotDurationMins: number;
  capacity: number;
  excludedTimes: string[];
  allowedKindIds: string[];
  minBookingNotice?: number;
  maxBookingAdvance?: number;
  autoConfirm: boolean;
  allowCancellation: boolean;
  cancellationDeadline?: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface ManageRulesPageProps {
  isOpen: boolean;
  onClose: () => void;
  onRuleUpdated: () => void;
}

const DAY_NAMES: Record<number, string> = {
  1: 'Lun',
  2: 'Mar',
  3: 'Mer',
  4: 'Jeu',
  5: 'Ven',
  6: 'Sam',
  7: 'Dim',
};

export default function ManageRulesPage({ isOpen, onClose, onRuleUpdated }: ManageRulesPageProps) {
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [loading, setLoading] = useState(false);
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
      fetchRules();
    }
  }, [isOpen]);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

      const response = await fetch(`${apiBase}/availability-rules/mine`, {
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
      setRules(Array.isArray(data) ? data : data?.data || []);
    } catch (error) {
      console.error('Error fetching rules:', error);
      toast.error('Erreur lors du chargement des règles');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (rule: AvailabilityRule) => {
    const newStatus = rule.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    try {
      const token = localStorage.getItem('token');
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

      await toast.promise(
        fetch(`${apiBase}/availability-rules/${rule.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
          body: JSON.stringify({ status: newStatus }),
        }).then(async (res) => {
          if (!res.ok) {
            const errorText = await res.text().catch(() => '');
            throw new Error(errorText || `HTTP ${res.status}`);
          }
          return res.json();
        }),
        {
          loading: `${newStatus === 'ACTIVE' ? 'Activation' : 'Désactivation'} de la règle...`,
          success: `Règle ${newStatus === 'ACTIVE' ? 'activée' : 'désactivée'} !`,
          error: (err) => `Erreur: ${err.message}`,
        }
      );

      await fetchRules();
      onRuleUpdated();
    } catch (error) {
      console.error('Error toggling rule status:', error);
    }
  };

  const handleDeleteRule = (rule: AvailabilityRule) => {
    setConfirmModal({
      isOpen: true,
      title: 'Supprimer la règle',
      message: `Êtes-vous sûr de vouloir supprimer cette règle de disponibilité ? Cette action est irréversible et supprimera tous les créneaux associés.`,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

          await toast.promise(
            fetch(`${apiBase}/availability-rules/${rule.id}`, {
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
              loading: 'Suppression de la règle...',
              success: 'Règle supprimée !',
              error: (err) => `Erreur: ${err.message}`,
            }
          );

          await fetchRules();
          onRuleUpdated();
        } catch (error) {
          console.error('Error deleting rule:', error);
        }
      },
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getDaysLabel = (days: number[]) => {
    return days.map(d => DAY_NAMES[d]).join(', ');
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
          className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Gestion des règles de disponibilité
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Fermer"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {rules.length} règle{rules.length !== 1 ? 's' : ''} de disponibilité
            </p>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
              </div>
            ) : rules.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Aucune règle de disponibilité créée</p>
                <p className="text-sm text-gray-500 mt-1">
                  Créez votre première règle pour générer des créneaux
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className={`border-2 rounded-lg p-4 transition-all ${
                      rule.status === 'ACTIVE'
                        ? 'border-teal-200 bg-teal-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Status Badge */}
                        <div className="flex items-center gap-2 mb-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                              rule.status === 'ACTIVE'
                                ? 'bg-teal-600 text-white'
                                : 'bg-gray-600 text-white'
                            }`}
                          >
                            {rule.status === 'ACTIVE' ? (
                              <ToggleRight className="w-3.5 h-3.5" />
                            ) : (
                              <ToggleLeft className="w-3.5 h-3.5" />
                            )}
                            {rule.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Période */}
                          <div className="flex items-start gap-2">
                            <Calendar className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="text-xs font-medium text-gray-700">Période</div>
                              <div className="text-sm text-gray-900">
                                {formatDate(rule.startDate)} - {formatDate(rule.endDate)}
                              </div>
                            </div>
                          </div>

                          {/* Jours */}
                          <div className="flex items-start gap-2">
                            <Calendar className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="text-xs font-medium text-gray-700">Jours</div>
                              <div className="text-sm text-gray-900">{getDaysLabel(rule.daysOfWeek)}</div>
                            </div>
                          </div>

                          {/* Horaires */}
                          <div className="flex items-start gap-2">
                            <Clock className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="text-xs font-medium text-gray-700">Horaires</div>
                              <div className="text-sm text-gray-900">
                                {rule.startHour}h00 - {rule.endHour}h00 ({rule.slotDurationMins} min)
                              </div>
                            </div>
                          </div>

                          {/* Capacité */}
                          <div className="flex items-start gap-2">
                            <Users className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="text-xs font-medium text-gray-700">Capacité</div>
                              <div className="text-sm text-gray-900">
                                {rule.capacity} patient{rule.capacity > 1 ? 's' : ''} par créneau
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Additional Info */}
                        {rule.excludedTimes.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="text-xs font-medium text-gray-700 mb-1">
                              Périodes exclues
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {rule.excludedTimes.map((time, idx) => (
                                <span
                                  key={idx}
                                  className="inline-block px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs"
                                >
                                  {time}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleToggleStatus(rule)}
                          className={`p-2 rounded-lg transition-colors ${
                            rule.status === 'ACTIVE'
                              ? 'hover:bg-gray-200 text-gray-700'
                              : 'hover:bg-teal-100 text-teal-600'
                          }`}
                          title={rule.status === 'ACTIVE' ? 'Désactiver' : 'Activer'}
                        >
                          {rule.status === 'ACTIVE' ? (
                            <ToggleLeft className="w-5 h-5" />
                          ) : (
                            <ToggleRight className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule)}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                          title="Supprimer"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
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
