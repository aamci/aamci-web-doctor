'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Info, CheckCircle, Loader2 } from 'lucide-react';

interface AgendaSettings {
  zoomLevel: number;
  displayStartHour: string;
  displayEndHour: string;
  mousePrecision: string;
  showSchoolHolidays: boolean;
}

const DEFAULT_SETTINGS: AgendaSettings = {
  zoomLevel: 0,
  displayStartHour: '07:00',
  displayEndHour: '19:00',
  mousePrecision: 'default',
  showSchoolHolidays: false,
};

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return { value: `${hour}:00`, label: `${hour}:00` };
});

const PRECISION_OPTIONS = [
  { value: 'default', label: 'Valeur par défaut' },
  { value: '5', label: '5 minutes' },
  { value: '10', label: '10 minutes' },
  { value: '15', label: '15 minutes' },
  { value: '30', label: '30 minutes' },
];

export default function AgendaConfigPage() {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [settings, setSettings] = useState<AgendaSettings>(DEFAULT_SETTINGS);

  // Load settings on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('agendaSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (e) {
        console.error('Error parsing saved settings:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Auto-save settings when they change
  const saveSettings = useCallback((newSettings: AgendaSettings) => {
    try {
      localStorage.setItem('agendaSettings', JSON.stringify(newSettings));
      // Dispatch custom event so other components can react to settings change
      window.dispatchEvent(new CustomEvent('agendaSettingsChanged', { detail: newSettings }));
      setMessage({ type: 'success', text: 'Enregistré' });
      setTimeout(() => setMessage(null), 1500);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
    }
  }, []);

  const updateSettings = (updates: Partial<AgendaSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">Affichage de l'agenda</h1>
            <div className="flex items-center gap-3">
              {message && (
                <span className={`text-sm flex items-center gap-1 ${
                  message.type === 'success' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {message.type === 'success' && <CheckCircle className="w-4 h-4" />}
                  {message.text}
                </span>
              )}
              <button
                onClick={() => router.back()}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Info notice */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg mb-6">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            Ces paramètres ne concernent que l'agenda de ce compte. Les modifications sont enregistrées automatiquement.
          </p>
        </div>

        {/* Densité de l'information */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <h2 className="font-semibold text-gray-900 mb-2">Densité de l'information</h2>
          <p className="text-sm text-gray-500 mb-4">
            Sélectionnez comment les heures sont affichées dans la vue jour/semaine.
          </p>

          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">Zoom</label>
            <div className="relative">
              <input
                type="range"
                min="0"
                max="100"
                value={settings.zoomLevel}
                onChange={(e) => updateSettings({ zoomLevel: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span className={settings.zoomLevel <= 33 ? 'text-teal-600 font-medium' : ''}>
                  Minimum
                </span>
                <span className={settings.zoomLevel > 33 && settings.zoomLevel <= 66 ? 'text-teal-600 font-medium' : ''}>
                  Standard
                </span>
                <span className={settings.zoomLevel > 66 ? 'text-teal-600 font-medium' : ''}>
                  Maximum
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Plage horaire affichée */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <h2 className="font-semibold text-gray-900 mb-2">Plage horaire affichée</h2>

          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label className="text-sm text-gray-500 mb-1 block">de</label>
              <select
                value={settings.displayStartHour}
                onChange={(e) => updateSettings({ displayStartHour: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
              >
                {HOURS.map((hour) => (
                  <option key={hour.value} value={hour.value}>
                    {hour.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-500 mb-1 block">à</label>
              <select
                value={settings.displayEndHour}
                onChange={(e) => updateSettings({ displayEndHour: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
              >
                {HOURS.map((hour) => (
                  <option key={hour.value} value={hour.value}>
                    {hour.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-sm text-blue-600">
            Les rendez-vous pris en dehors de cette plage ne seront pas affichés
          </p>
        </div>

        {/* Précision de la souris */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <h2 className="font-semibold text-gray-900 mb-2">Précision de la souris</h2>
          <p className="text-sm text-gray-500 mb-4">
            Personnalisez la taille des créneaux horaires surlignés quand vous passez la souris sur l'agenda.
          </p>

          <div className="mb-4">
            <label className="text-sm text-gray-500 mb-1 block">Durée</label>
            <select
              value={settings.mousePrecision}
              onChange={(e) => updateSettings({ mousePrecision: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
            >
              {PRECISION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <p className="text-sm text-gray-500">
            Par exemple, si vous sélectionnez 5 minutes, vous pouvez faire commencer un rendez-vous à 11h05, 11h10, 11h15 etc. La valeur par défaut est la durée du motif de consultation concerné.
          </p>
        </div>

        {/* Vacances scolaires */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900 mb-1">Vacances scolaires</h2>
              <p className="text-sm text-gray-500">
                Affichez ces vacances scolaires sur votre agenda
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showSchoolHolidays}
                onChange={(e) => updateSettings({ showSchoolHolidays: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => router.push('/planning')}
            className="px-6 py-2.5 bg-teal-600 text-white rounded-full text-sm font-medium hover:bg-teal-700 transition-colors"
          >
            REVENIR À L'AGENDA
          </button>
        </div>
      </div>
    </div>
  );
}
