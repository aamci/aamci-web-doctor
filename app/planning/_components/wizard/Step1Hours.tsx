'use client';

import { Star, Trash2 } from 'lucide-react';
import { Step1Props } from './types';

const HOUR_OPTIONS = Array.from({ length: 17 }, (_, i) => i + 6); // 6h-22h
const DURATION_OPTIONS = [15, 30, 45, 60];

export default function Step1Hours({
  formData,
  onChange,
  templates,
  selectedTemplate,
  onTemplateSelect,
  onSetDefaultTemplate,
  onDeleteTemplate,
}: Step1Props) {
  const getDayNames = (days: number[]) => {
    const dayMap: Record<number, string> = {
      1: 'Lun',
      2: 'Mar',
      3: 'Mer',
      4: 'Jeu',
      5: 'Ven',
      6: 'Sam',
      7: 'Dim',
    };
    return days.map(d => dayMap[d]).join(', ');
  };

  const handleSetDefault = (e: React.MouseEvent, templateId: string) => {
    e.preventDefault();
    e.stopPropagation();
    onSetDefaultTemplate?.(templateId);
  };

  const handleDelete = (e: React.MouseEvent, templateId: string) => {
    e.preventDefault();
    e.stopPropagation();
    onDeleteTemplate?.(templateId);
  };

  return (
    <div className="space-y-6">
      {/* Template Selector */}
      {templates.length > 0 && (
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
          <h3 className="font-semibold text-teal-900 mb-3 text-sm">
            Démarrer avec un modèle
          </h3>

          <div className="space-y-2">
            {/* Option: Partir de zéro */}
            <label className="flex items-start gap-3 p-3 bg-white border-2 rounded-lg cursor-pointer transition-all hover:border-teal-300">
              <input
                type="radio"
                name="template"
                value="scratch"
                checked={selectedTemplate === null}
                onChange={() => onTemplateSelect(null)}
                className="w-4 h-4 mt-0.5 text-teal-600 border-gray-300 focus:ring-teal-500"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900 text-sm">
                  Partir de zéro
                </div>
                <div className="text-xs text-gray-600">
                  Configuration manuelle complète
                </div>
              </div>
            </label>

            {/* Options: Templates existants */}
            {templates.map(template => (
              <label
                key={template.id}
                className={`flex items-start gap-3 p-3 bg-white border-2 rounded-lg cursor-pointer transition-all hover:border-teal-300 ${
                  selectedTemplate === template.id
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-gray-200'
                }`}
              >
                <input
                  type="radio"
                  name="template"
                  value={template.id}
                  checked={selectedTemplate === template.id}
                  onChange={() => onTemplateSelect(template.id)}
                  className="w-4 h-4 mt-0.5 text-teal-600 border-gray-300 focus:ring-teal-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-gray-900 text-sm flex items-center gap-2">
                      {template.name}
                      {template.isDefault && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-600 text-white text-xs rounded-full">
                          <Star className="w-3 h-3 fill-white" />
                          Défaut
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      {!template.isDefault && (
                        <button
                          type="button"
                          onClick={(e) => handleSetDefault(e, template.id)}
                          className="p-1.5 hover:bg-teal-100 rounded transition-colors"
                          title="Définir par défaut"
                        >
                          <Star className="w-4 h-4 text-teal-600" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, template.id)}
                        className="p-1.5 hover:bg-red-100 rounded transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                  {template.description && (
                    <div className="text-xs text-gray-600 mt-0.5">
                      {template.description}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    {getDayNames(template.daysOfWeek)} • {template.startHour}h-
                    {template.endHour}h • {template.slotDurationMins} min
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Horaires */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3 text-sm">
          Horaires de consultation
        </h3>

        <div className="grid grid-cols-2 gap-4">
          {/* Heure de début */}
          <div>
            <label
              htmlFor="startHour"
              className="block text-xs font-medium text-gray-700 mb-1"
            >
              Heure de début *
            </label>
            <select
              id="startHour"
              value={formData.startHour}
              onChange={e =>
                onChange({ startHour: parseInt(e.target.value) })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              {HOUR_OPTIONS.map(hour => (
                <option key={hour} value={hour}>
                  {hour.toString().padStart(2, '0')}:00
                </option>
              ))}
            </select>
          </div>

          {/* Heure de fin */}
          <div>
            <label
              htmlFor="endHour"
              className="block text-xs font-medium text-gray-700 mb-1"
            >
              Heure de fin *
            </label>
            <select
              id="endHour"
              value={formData.endHour}
              onChange={e => onChange({ endHour: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              {HOUR_OPTIONS.map(hour => (
                <option key={hour} value={hour}>
                  {hour.toString().padStart(2, '0')}:00
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Validation error */}
        {formData.endHour <= formData.startHour && (
          <p className="text-sm text-red-600 mt-2">
            L'heure de fin doit être après l'heure de début
          </p>
        )}
      </div>

      {/* Durée et Capacité */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3 text-sm">
          Configuration des créneaux
        </h3>

        <div className="grid grid-cols-2 gap-4">
          {/* Durée des créneaux */}
          <div>
            <label
              htmlFor="slotDuration"
              className="block text-xs font-medium text-gray-700 mb-1"
            >
              Durée des créneaux *
            </label>
            <select
              id="slotDuration"
              value={formData.slotDurationMins}
              onChange={e =>
                onChange({ slotDurationMins: parseInt(e.target.value) })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              {DURATION_OPTIONS.map(duration => (
                <option key={duration} value={duration}>
                  {duration} minutes
                </option>
              ))}
            </select>
          </div>

          {/* Capacité */}
          <div>
            <label
              htmlFor="capacity"
              className="block text-xs font-medium text-gray-700 mb-1"
            >
              Capacité par créneau *
            </label>
            <input
              id="capacity"
              type="number"
              min="1"
              max="10"
              value={formData.capacity}
              onChange={e =>
                onChange({ capacity: parseInt(e.target.value) || 1 })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Nombre de patients par créneau (1-10)
            </p>
          </div>
        </div>

        {/* Validation errors */}
        {(formData.capacity < 1 || formData.capacity > 10) && (
          <p className="text-sm text-red-600 mt-2">
            La capacité doit être entre 1 et 10 patients
          </p>
        )}
      </div>
    </div>
  );
}
