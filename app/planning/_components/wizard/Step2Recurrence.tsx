'use client';

import { X } from 'lucide-react';
import { toast } from '@/lib/toast';
import { Step2Props } from './types';

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lun', fullName: 'Lundi' },
  { value: 2, label: 'Mar', fullName: 'Mardi' },
  { value: 3, label: 'Mer', fullName: 'Mercredi' },
  { value: 4, label: 'Jeu', fullName: 'Jeudi' },
  { value: 5, label: 'Ven', fullName: 'Vendredi' },
  { value: 6, label: 'Sam', fullName: 'Samedi' },
  { value: 7, label: 'Dim', fullName: 'Dimanche' },
];

export default function Step2Recurrence({ formData, onChange }: Step2Props) {
  const today = new Date().toISOString().split('T')[0];
  const maxDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]; // +3 mois

  const toggleDay = (dayValue: number) => {
    const newDays = formData.daysOfWeek.includes(dayValue)
      ? formData.daysOfWeek.filter(d => d !== dayValue)
      : [...formData.daysOfWeek, dayValue].sort((a, b) => a - b);
    onChange({ daysOfWeek: newDays });
  };

  const handleAddExcludedTime = () => {
    const input = prompt('Période d\'exclusion (format HH:MM-HH:MM):', '12:00-13:00');
    if (!input) return;

    // Validation format HH:MM-HH:MM
    const regex = /^\d{2}:\d{2}-\d{2}:\d{2}$/;
    if (!regex.test(input)) {
      toast.warning('Format invalide. Utilisez HH:MM-HH:MM (ex: 12:00-13:00)');
      return;
    }

    onChange({
      excludedTimes: [...formData.excludedTimes, input],
    });
  };

  const handleRemoveExcludedTime = (time: string) => {
    onChange({
      excludedTimes: formData.excludedTimes.filter(t => t !== time),
    });
  };

  // Calcul estimation nombre de créneaux
  const estimateSlots = () => {
    if (!formData.startDate || !formData.endDate) return 0;

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    // Nombre de jours sélectionnés dans la semaine
    const daysPerWeek = formData.daysOfWeek.length;
    const weeks = Math.ceil(daysDiff / 7);

    // Créneaux par jour
    const hoursPerDay = formData.endHour - formData.startHour;
    const slotsPerDay = Math.floor((hoursPerDay * 60) / formData.slotDurationMins);

    // Exclusions (approximation: -1 créneau par exclusion par jour)
    const excludedSlotsPerDay = formData.excludedTimes.length;

    return Math.max(
      0,
      weeks * daysPerWeek * (slotsPerDay - excludedSlotsPerDay)
    );
  };

  return (
    <div className="space-y-6">
      {/* Jours de la semaine */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          Jours de la semaine *
        </label>
        <div className="grid grid-cols-7 gap-2">
          {DAYS_OF_WEEK.map(day => (
            <button
              key={day.value}
              type="button"
              onClick={() => toggleDay(day.value)}
              className={`px-2 py-2 text-xs font-medium rounded-lg transition-all ${
                formData.daysOfWeek.includes(day.value)
                  ? 'bg-teal-600 text-white ring-2 ring-teal-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={day.fullName}
            >
              {day.label}
            </button>
          ))}
        </div>
        {formData.daysOfWeek.length === 0 && (
          <p className="text-sm text-red-600 mt-2">
            Veuillez sélectionner au moins un jour
          </p>
        )}
      </div>

      {/* Période */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3 text-sm">
          Période de validité
        </h3>

        <div className="grid grid-cols-2 gap-4">
          {/* Date de début */}
          <div>
            <label
              htmlFor="startDate"
              className="block text-xs font-medium text-gray-700 mb-1"
            >
              Date de début *
            </label>
            <input
              id="startDate"
              type="date"
              min={today}
              max={formData.endDate || maxDate}
              value={formData.startDate}
              onChange={e => onChange({ startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {/* Date de fin */}
          <div>
            <label
              htmlFor="endDate"
              className="block text-xs font-medium text-gray-700 mb-1"
            >
              Date de fin (max 3 mois) *
            </label>
            <input
              id="endDate"
              type="date"
              min={formData.startDate || today}
              max={maxDate}
              value={formData.endDate}
              onChange={e => onChange({ endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Validation errors */}
        {formData.startDate &&
          formData.endDate &&
          new Date(formData.startDate) >= new Date(formData.endDate) && (
            <p className="text-sm text-red-600 mt-2">
              La date de fin doit être après la date de début
            </p>
          )}
      </div>

      {/* Périodes d'exclusion */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-semibold text-gray-900">
            Périodes d'exclusion (optionnel)
          </label>
          <button
            type="button"
            onClick={handleAddExcludedTime}
            className="px-3 py-1 text-xs font-medium text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
          >
            + Ajouter
          </button>
        </div>

        <p className="text-xs text-gray-600 mb-3">
          Périodes à bloquer chaque jour (ex: pause déjeuner)
        </p>

        {formData.excludedTimes.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {formData.excludedTimes.map((time, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm"
              >
                {time}
                <button
                  onClick={() => handleRemoveExcludedTime(time)}
                  className="hover:text-red-600 transition-colors"
                  title="Supprimer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500 italic">
            Aucune période d'exclusion
          </div>
        )}
      </div>

      {/* Aperçu estimation */}
      {formData.startDate && formData.endDate && formData.daysOfWeek.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Aperçu :</strong> Environ{' '}
            <span className="font-bold text-blue-900">{estimateSlots()}</span>{' '}
            créneaux seront générés
          </p>
          <p className="text-xs text-blue-700 mt-1">
            {formData.daysOfWeek.length} jour(s) par semaine •{' '}
            {Math.floor(
              ((formData.endHour - formData.startHour) * 60) /
                formData.slotDurationMins
            )}{' '}
            créneaux/jour
          </p>
        </div>
      )}
    </div>
  );
}
