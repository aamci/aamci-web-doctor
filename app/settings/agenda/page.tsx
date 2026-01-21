'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Info, ArrowLeft, CheckCircle } from 'lucide-react';

interface AgendaSettings {
  zoomLevel: number; // 0-100, where 0 is minimum and 100 is maximum
  displayStartHour: string;
  displayEndHour: string;
  mousePrecision: string; // 'default' | '5' | '10' | '15' | '30'
  showSchoolHolidays: boolean;
}

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
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [settings, setSettings] = useState<AgendaSettings>({
    zoomLevel: 0, // Minimum by default
    displayStartHour: '07:00',
    displayEndHour: '19:00',
    mousePrecision: 'default',
    showSchoolHolidays: false,
  });

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

  useEffect(() => {
    // Load settings from localStorage or API
    const savedSettings = localStorage.getItem('agendaSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
      } catch (e) {
        console.error('Error parsing saved settings:', e);
      }
    }
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    setMessage(null);

    try {
      // Save to localStorage for now (can be extended to API)
      localStorage.setItem('agendaSettings', JSON.stringify(settings));
      setMessage({ type: 'success', text: 'Paramètres enregistrés avec succès' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
    } finally {
      setSaving(false);
    }
  };

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({ ...settings, zoomLevel: parseInt(e.target.value) });
  };

  const getZoomLabel = (value: number) => {
    if (value <= 33) return 'Minimum';
    if (value <= 66) return 'Standard';
    return 'Maximum';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">Affichage de l'agenda</h1>
            <button
              onClick={() => router.back()}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">Fermer</span>
              &times;
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Info notice */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg mb-6">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            Ces paramètres ne concernent que l'agenda de ce compte.
          </p>
        </div>

        {/* Message de feedback */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.type === 'success' && <CheckCircle className="w-5 h-5" />}
            {message.text}
          </div>
        )}

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
                onChange={handleZoomChange}
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
                onChange={(e) => setSettings({ ...settings, displayStartHour: e.target.value })}
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
                onChange={(e) => setSettings({ ...settings, displayEndHour: e.target.value })}
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
              onChange={(e) => setSettings({ ...settings, mousePrecision: e.target.value })}
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
                onChange={(e) => setSettings({ ...settings, showSchoolHolidays: e.target.checked })}
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
