'use client';

import { useState } from 'react';
import { X, Calendar, Clock, Users } from 'lucide-react';
import { toast } from '@/lib/toast';

interface Preference {
  id: string;
  name: string;
  description?: string;
  daysOfWeek: number[];
  startHour: number;
  endHour: number;
  slotDurationMins: number;
  capacity: number;
  excludedTimes: string[];
}

interface Props {
  preference: Preference;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ApplyPreferenceModal({ preference, onClose, onSuccess }: Props) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

  const handleApply = async () => {
    if (!startDate || !endDate) {
      toast.warning('Veuillez sélectionner une période');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast.warning('La date de début doit être avant la date de fin');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/availability-preferences/${preference.id}/apply`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            startDate,
            endDate,
          }),
        }
      );

      if (response.ok) {
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(`Erreur: ${error.message}`);
      }
    } catch (error) {
      console.error('Error applying preference:', error);
      toast.error('Erreur lors de l\'application de la préférence');
    } finally {
      setLoading(false);
    }
  };

  const getDayNames = (days: number[]) => {
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return days.sort().map(d => dayNames[d]).join(', ');
  };

  const estimateSlots = () => {
    if (!startDate || !endDate) return 0;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Estimer le nombre de jours concernés (approximatif)
    const workDays = Math.floor((daysDiff / 7) * preference.daysOfWeek.length);

    // Calculer les créneaux par jour
    const hoursPerDay = preference.endHour - preference.startHour;
    const minutesPerDay = hoursPerDay * 60;

    // Soustraire les exclusions
    let excludedMinutes = 0;
    preference.excludedTimes.forEach((time) => {
      const [start, end] = time.split('-');
      const [startH, startM] = start.split(':').map(Number);
      const [endH, endM] = end.split(':').map(Number);
      excludedMinutes += (endH * 60 + endM) - (startH * 60 + startM);
    });

    const effectiveMinutesPerDay = minutesPerDay - excludedMinutes;
    const slotsPerDay = Math.floor(effectiveMinutesPerDay / preference.slotDurationMins);

    return workDays * slotsPerDay;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-teal-600" />
            Appliquer la préférence
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Résumé de la préférence */}
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
            <h3 className="font-semibold text-teal-900 mb-2">{preference.name}</h3>
            {preference.description && (
              <p className="text-sm text-teal-700 mb-3">{preference.description}</p>
            )}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-teal-800">
                <Calendar className="w-4 h-4" />
                <span>{getDayNames(preference.daysOfWeek)}</span>
              </div>
              <div className="flex items-center gap-2 text-teal-800">
                <Clock className="w-4 h-4" />
                <span>{preference.startHour}h - {preference.endHour}h</span>
              </div>
              <div className="flex items-center gap-2 text-teal-800">
                <Clock className="w-4 h-4" />
                <span>Créneaux de {preference.slotDurationMins} min</span>
              </div>
              <div className="flex items-center gap-2 text-teal-800">
                <Users className="w-4 h-4" />
                <span>Capacité: {preference.capacity}</span>
              </div>
            </div>
            {preference.excludedTimes.length > 0 && (
              <div className="mt-3 text-sm text-teal-700">
                <span className="font-medium">Exclusions:</span> {preference.excludedTimes.join(', ')}
              </div>
            )}
          </div>

          {/* Sélection de la période */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Période d'application</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de début *
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de fin *
                </label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>

            {startDate && endDate && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-blue-900 mb-1">
                      Aperçu des créneaux
                    </h4>
                    <p className="text-sm text-blue-700">
                      Cette configuration générera environ <strong>{estimateSlots()}</strong> créneaux
                      de consultation sur la période sélectionnée.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Avertissement */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-amber-900 mb-1">
                  Information importante
                </h4>
                <p className="text-sm text-amber-700">
                  Cette action va créer une règle de disponibilité basée sur cette préférence.
                  Les créneaux seront générés automatiquement selon les paramètres définis.
                </p>
              </div>
            </div>
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
              onClick={handleApply}
              disabled={loading || !startDate || !endDate}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Génération...' : 'Générer les disponibilités'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
