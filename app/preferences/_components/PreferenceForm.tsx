'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Preference {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  daysOfWeek: number[];
  startHour: number;
  endHour: number;
  slotDurationMins: number;
  capacity: number;
  allowedKindIds: string[];
  excludedTimes: string[];
  minBookingNotice?: number;
  maxBookingAdvance?: number;
  autoConfirm: boolean;
  allowCancellation: boolean;
  cancellationDeadline?: number;
}

interface Props {
  preference: Preference | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PreferenceForm({ preference, onClose, onSuccess }: Props) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isDefault: false,
    daysOfWeek: [] as number[],
    startHour: 9,
    endHour: 18,
    slotDurationMins: 30,
    capacity: 1,
    excludedTimes: [] as string[],
    minBookingNotice: 24,
    maxBookingAdvance: 90,
    autoConfirm: true,
    allowCancellation: true,
    cancellationDeadline: 24,
  });

  const [excludedTimeInput, setExcludedTimeInput] = useState('');
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

  useEffect(() => {
    if (preference) {
      setFormData({
        name: preference.name,
        description: preference.description || '',
        isDefault: preference.isDefault,
        daysOfWeek: preference.daysOfWeek,
        startHour: preference.startHour,
        endHour: preference.endHour,
        slotDurationMins: preference.slotDurationMins,
        capacity: preference.capacity,
        excludedTimes: preference.excludedTimes,
        minBookingNotice: preference.minBookingNotice || 24,
        maxBookingAdvance: preference.maxBookingAdvance || 90,
        autoConfirm: preference.autoConfirm,
        allowCancellation: preference.allowCancellation,
        cancellationDeadline: preference.cancellationDeadline || 24,
      });
    }
  }, [preference]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const url = preference
        ? `${API_BASE_URL}/availability-preferences/${preference.id}`
        : `${API_BASE_URL}/availability-preferences`;

      const response = await fetch(url, {
        method: preference ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.message}`);
      }
    } catch (error) {
      console.error('Error saving preference:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day: number) => {
    if (formData.daysOfWeek.includes(day)) {
      setFormData({
        ...formData,
        daysOfWeek: formData.daysOfWeek.filter((d) => d !== day),
      });
    } else {
      setFormData({
        ...formData,
        daysOfWeek: [...formData.daysOfWeek, day].sort(),
      });
    }
  };

  const addExcludedTime = () => {
    if (excludedTimeInput && !formData.excludedTimes.includes(excludedTimeInput)) {
      setFormData({
        ...formData,
        excludedTimes: [...formData.excludedTimes, excludedTimeInput],
      });
      setExcludedTimeInput('');
    }
  };

  const removeExcludedTime = (time: string) => {
    setFormData({
      ...formData,
      excludedTimes: formData.excludedTimes.filter((t) => t !== time),
    });
  };

  const dayNames = [
    { value: 1, label: 'Lundi' },
    { value: 2, label: 'Mardi' },
    { value: 3, label: 'Mercredi' },
    { value: 4, label: 'Jeudi' },
    { value: 5, label: 'Vendredi' },
    { value: 6, label: 'Samedi' },
    { value: 0, label: 'Dimanche' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {preference ? 'Modifier la préférence' : 'Nouvelle préférence'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informations de base */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Informations de base</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de la préférence *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Ex: Semaine standard, Horaires d'été..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                rows={2}
                placeholder="Description de cette configuration..."
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
              />
              <label htmlFor="isDefault" className="text-sm font-medium text-gray-700">
                Définir comme préférence par défaut
              </label>
            </div>
          </div>

          {/* Jours et horaires */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Jours et horaires</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jours de la semaine *
              </label>
              <div className="grid grid-cols-7 gap-2">
                {dayNames.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      formData.daysOfWeek.includes(day.value)
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {day.label.substring(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heure de début *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="23"
                  value={formData.startHour}
                  onChange={(e) =>
                    setFormData({ ...formData, startHour: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heure de fin *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="23"
                  value={formData.endHour}
                  onChange={(e) =>
                    setFormData({ ...formData, endHour: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durée des créneaux (min) *
                </label>
                <select
                  value={formData.slotDurationMins}
                  onChange={(e) =>
                    setFormData({ ...formData, slotDurationMins: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="15">15 minutes</option>
                  <option value="20">20 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacité par créneau *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="10"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({ ...formData, capacity: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Périodes d'exclusion */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Périodes d'exclusion</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ajouter une période (format: HH:MM-HH:MM)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={excludedTimeInput}
                  onChange={(e) => setExcludedTimeInput(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Ex: 12:00-14:00"
                />
                <button
                  type="button"
                  onClick={addExcludedTime}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  Ajouter
                </button>
              </div>
            </div>

            {formData.excludedTimes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.excludedTimes.map((time) => (
                  <span
                    key={time}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {time}
                    <button
                      type="button"
                      onClick={() => removeExcludedTime(time)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Paramètres avancés */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Paramètres avancés</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Délai minimum de réservation (heures)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.minBookingNotice}
                  onChange={(e) =>
                    setFormData({ ...formData, minBookingNotice: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Délai maximum de réservation (jours)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxBookingAdvance}
                  onChange={(e) =>
                    setFormData({ ...formData, maxBookingAdvance: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoConfirm"
                  checked={formData.autoConfirm}
                  onChange={(e) =>
                    setFormData({ ...formData, autoConfirm: e.target.checked })
                  }
                  className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                />
                <label htmlFor="autoConfirm" className="text-sm text-gray-700">
                  Confirmation automatique des rendez-vous
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allowCancellation"
                  checked={formData.allowCancellation}
                  onChange={(e) =>
                    setFormData({ ...formData, allowCancellation: e.target.checked })
                  }
                  className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                />
                <label htmlFor="allowCancellation" className="text-sm text-gray-700">
                  Autoriser l'annulation
                </label>
              </div>
            </div>

            {formData.allowCancellation && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Délai d'annulation (heures avant le RDV)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.cancellationDeadline}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cancellationDeadline: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || formData.daysOfWeek.length === 0}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Enregistrement...' : preference ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
