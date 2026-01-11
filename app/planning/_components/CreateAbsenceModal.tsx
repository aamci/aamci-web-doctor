'use client';

import { useState } from 'react';
import { X, Calendar, FileText } from 'lucide-react';
import { toast } from '../../_components/Toaster';

interface CreateAbsenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ABSENCE_TYPES = [
  { value: 'VACATION', label: 'Vacances', color: 'bg-blue-500' },
  { value: 'SICK_LEAVE', label: 'Congé maladie', color: 'bg-red-500' },
  { value: 'TRAINING', label: 'Formation', color: 'bg-purple-500' },
  { value: 'PERSONAL', label: 'Personnel', color: 'bg-amber-500' },
  { value: 'OTHER', label: 'Autre', color: 'bg-gray-500' },
];

export default function CreateAbsenceModal({ isOpen, onClose, onSuccess }: CreateAbsenceModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    type: 'VACATION',
    reason: '',
    blockSlots: true,
    cancelAppointments: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.startDate || !formData.endDate) {
      toast.error('Les dates sont requises');
      return;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);

    if (start >= end) {
      toast.error('La date de fin doit être après la date de début');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

      await toast.promise(
        fetch(`${apiBase}/doctor-absences`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
          body: JSON.stringify(formData),
        }).then(async (res) => {
          if (!res.ok) {
            const errorText = await res.text().catch(() => '');
            throw new Error(errorText || `HTTP ${res.status}`);
          }
          return res.json();
        }),
        {
          loading: 'Création de l\'absence...',
          success: 'Absence créée avec succès !',
          error: (err) => `Erreur: ${err.message}`,
        }
      );

      // Reset form
      setFormData({
        startDate: '',
        endDate: '',
        type: 'VACATION',
        reason: '',
        blockSlots: true,
        cancelAppointments: false,
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating absence:', error);
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
          className="bg-white rounded-lg shadow-xl w-full max-w-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Nouvelle période d'absence
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Fermer"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-6 space-y-4">
              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de début *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de fin *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type d'absence *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ABSENCE_TYPES.map((type) => (
                    <label
                      key={type.value}
                      className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.type === type.value
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="type"
                        value={type.value}
                        checked={formData.type === type.value}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                      />
                      <span className={`w-3 h-3 rounded-full ${type.color}`}></span>
                      <span className="text-sm font-medium text-gray-900">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motif (optionnel)
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Ex: Vacances d'été en famille"
                  />
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3 pt-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.blockSlots}
                    onChange={(e) => setFormData({ ...formData, blockSlots: e.target.checked })}
                    className="w-4 h-4 mt-0.5 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      Bloquer les créneaux
                    </div>
                    <div className="text-xs text-gray-600">
                      Les patients ne pourront pas réserver pendant cette période
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.cancelAppointments}
                    onChange={(e) => setFormData({ ...formData, cancelAppointments: e.target.checked })}
                    className="w-4 h-4 mt-0.5 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      Annuler les rendez-vous existants
                    </div>
                    <div className="text-xs text-red-600">
                      ⚠️ Tous les RDV de cette période seront annulés
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {loading ? 'Création...' : 'Créer l\'absence'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
