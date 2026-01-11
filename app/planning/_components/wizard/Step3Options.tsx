'use client';

import { CheckCircle } from 'lucide-react';
import { Step3Props } from './types';

export default function Step3Options({
  formData,
  onChange,
  appointmentKinds,
  saveAsTemplate,
  onSaveAsTemplateChange,
  templateName,
  onTemplateNameChange,
  templateDescription,
  onTemplateDescriptionChange,
  templateCount,
}: Step3Props) {
  const toggleKindId = (kindId: string) => {
    const newKindIds = formData.allowedKindIds.includes(kindId)
      ? formData.allowedKindIds.filter(id => id !== kindId)
      : [...formData.allowedKindIds, kindId];
    onChange({ allowedKindIds: newKindIds });
  };

  return (
    <div className="space-y-6">
      {/* Save as Template Section */}
      <div className="border-b pb-4">
        <div className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            id="saveAsTemplate"
            checked={saveAsTemplate}
            onChange={e => onSaveAsTemplateChange(e.target.checked)}
            className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
          />
          <label htmlFor="saveAsTemplate" className="font-medium text-gray-900 text-sm">
            Enregistrer comme modèle réutilisable
          </label>
        </div>

        {saveAsTemplate && (
          <div className="ml-6 space-y-3">
            <div>
              <label
                htmlFor="templateName"
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                Nom du modèle *
              </label>
              <input
                id="templateName"
                type="text"
                placeholder="Ex: Semaine standard"
                value={templateName}
                onChange={e => onTemplateNameChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            <div>
              <label
                htmlFor="templateDescription"
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                Description (optionnel)
              </label>
              <textarea
                id="templateDescription"
                placeholder="Ex: Horaires du lundi au vendredi"
                value={templateDescription}
                onChange={e => onTemplateDescriptionChange(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
              />
            </div>

            {templateCount >= 3 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  ⚠️ Vous avez atteint la limite de 3 modèles. Le nouveau modèle ne pourra
                  pas être sauvegardé.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Appointment Types Multi-Select */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 text-sm">
            Types de consultation autorisés
          </h3>
          {formData.allowedKindIds.length > 0 && (
            <button
              type="button"
              onClick={() => onChange({ allowedKindIds: [] })}
              className="text-xs text-teal-600 hover:text-teal-700 underline"
            >
              Tout désélectionner
            </button>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
          <p className="text-sm text-blue-800">
            {formData.allowedKindIds.length === 0 ? (
              <>
                ✓ <strong>Tous les types de consultation sont autorisés</strong> pour ces
                créneaux
              </>
            ) : (
              <>
                <strong>
                  {formData.allowedKindIds.length} type
                  {formData.allowedKindIds.length > 1 ? 's' : ''} sélectionné
                  {formData.allowedKindIds.length > 1 ? 's' : ''}
                </strong>{' '}
                — Seuls ces types pourront réserver
              </>
            )}
          </p>
        </div>

        {appointmentKinds.length === 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              Aucun type de consultation n'est configuré. Les patients pourront réserver
              sans spécifier de type.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {appointmentKinds.map(kind => (
              <label
                key={kind.id}
                className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  formData.allowedKindIds.includes(kind.id)
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.allowedKindIds.includes(kind.id)}
                  onChange={() => toggleKindId(kind.id)}
                  className="w-4 h-4 mt-0.5 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 text-sm">{kind.name}</div>
                  {kind.description && (
                    <div className="text-xs text-gray-600 mt-0.5">{kind.description}</div>
                  )}
                  {kind.duration && (
                    <div className="text-xs text-teal-600 mt-1">{kind.duration} minutes</div>
                  )}
                </div>
                {formData.allowedKindIds.includes(kind.id) && (
                  <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                )}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Advanced Settings (Collapsible) */}
      <details className="border rounded-lg">
        <summary className="px-4 py-3 cursor-pointer font-medium text-gray-900 text-sm hover:bg-gray-50">
          Paramètres avancés (optionnel)
        </summary>
        <div className="px-4 pb-4 space-y-4 border-t">
          {/* Booking Notice */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label
                htmlFor="minBookingNotice"
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                Délai min. de réservation (heures)
              </label>
              <input
                id="minBookingNotice"
                type="number"
                min="0"
                placeholder="Ex: 24"
                value={formData.minBookingNotice || ''}
                onChange={e =>
                  onChange({
                    minBookingNotice: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Ex: 24h avant le rendez-vous
              </p>
            </div>

            <div>
              <label
                htmlFor="maxBookingAdvance"
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                Délai max. de réservation (jours)
              </label>
              <input
                id="maxBookingAdvance"
                type="number"
                min="1"
                placeholder="Ex: 90"
                value={formData.maxBookingAdvance || ''}
                onChange={e =>
                  onChange({
                    maxBookingAdvance: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Ex: 90 jours à l'avance max
              </p>
            </div>
          </div>

          {/* Auto Confirm */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoConfirm"
              checked={formData.autoConfirm}
              onChange={e => onChange({ autoConfirm: e.target.checked })}
              className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
            />
            <label htmlFor="autoConfirm" className="text-sm text-gray-700">
              Confirmation automatique des rendez-vous
            </label>
          </div>

          {/* Allow Cancellation */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allowCancellation"
              checked={formData.allowCancellation}
              onChange={e => onChange({ allowCancellation: e.target.checked })}
              className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
            />
            <label htmlFor="allowCancellation" className="text-sm text-gray-700">
              Autoriser l'annulation par le patient
            </label>
          </div>

          {/* Cancellation Deadline */}
          {formData.allowCancellation && (
            <div>
              <label
                htmlFor="cancellationDeadline"
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                Délai d'annulation (heures avant RDV)
              </label>
              <input
                id="cancellationDeadline"
                type="number"
                min="0"
                placeholder="Ex: 24"
                value={formData.cancellationDeadline || ''}
                onChange={e =>
                  onChange({
                    cancellationDeadline: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Le patient ne pourra plus annuler X heures avant
              </p>
            </div>
          )}
        </div>
      </details>
    </div>
  );
}
