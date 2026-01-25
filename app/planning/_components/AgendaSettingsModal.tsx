'use client';

import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

interface AgendaSettings {
  zoomLevel: number;
  timeFormat: string;
  firstDayOfWeek: string;
  showWeekend: boolean;
  weeksToShow: number;
  slotHeight: string;
  displayStartHour: string;
  displayEndHour: string;
  hideNonWorkingHours: boolean;
  mousePrecision: string;
}

const DEFAULT_SETTINGS: AgendaSettings = {
  zoomLevel: 50,
  timeFormat: '24h',
  firstDayOfWeek: 'monday',
  showWeekend: true,
  weeksToShow: 1,
  slotHeight: 'auto',
  displayStartHour: '07:00',
  displayEndHour: '19:00',
  hideNonWorkingHours: false,
  mousePrecision: '15',
};

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return { value: `${hour}:00`, label: `${hour}:00` };
});

const PRECISION_OPTIONS = [
  { value: '5', label: '5 minutes' },
  { value: '10', label: '10 minutes' },
  { value: '15', label: '15 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '60', label: '60 minutes' },
];

interface AgendaSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AgendaSettingsModal({ isOpen, onClose }: AgendaSettingsModalProps) {
  const [settings, setSettings] = useState<AgendaSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (isOpen) {
      const savedSettings = localStorage.getItem('agendaSettings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        } catch (e) {
          console.error('Error parsing saved settings:', e);
        }
      }
    }
  }, [isOpen]);

  const saveSettings = useCallback((newSettings: AgendaSettings) => {
    try {
      localStorage.setItem('agendaSettings', JSON.stringify(newSettings));
      window.dispatchEvent(new CustomEvent('agendaSettingsChanged', { detail: newSettings }));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }, []);

  const updateSettings = (updates: Partial<AgendaSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[85vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Apparence & affichage</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(85vh-130px)] px-5 py-4">
            {/* Info notice */}
            <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-md mb-5 text-xs text-gray-600">
              <span className="text-gray-400">ℹ</span>
              <span>Ces paramètres ne concernent que l'agenda de ce compte.</span>
            </div>

            {/* Densité de l'information */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Densité de l'information</h3>
              <p className="text-xs text-gray-500 mb-3">
                Sélectionnez comment les heures sont affichées dans la vue jour/semaine.
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Zoom</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.zoomLevel}
                  onChange={(e) => updateSettings({ zoomLevel: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-teal-600"
                />
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span className={settings.zoomLevel <= 33 ? 'text-teal-600 font-medium' : ''}>Minimum</span>
                  <span className={settings.zoomLevel > 33 && settings.zoomLevel <= 66 ? 'text-teal-600 font-medium' : ''}>Standard</span>
                  <span className={settings.zoomLevel > 66 ? 'text-teal-600 font-medium' : ''}>Maximum</span>
                </div>
              </div>
            </div>

            {/* Format & affichage */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Format & affichage</h3>

              {/* Format d'heure */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="text-xs font-medium text-gray-700">Format d'heure</div>
                  <div className="text-[10px] text-gray-400">Choisissez le format d'affichage des heures</div>
                </div>
                <select
                  value={settings.timeFormat}
                  onChange={(e) => updateSettings({ timeFormat: e.target.value })}
                  className="text-xs border border-gray-200 rounded px-2 py-1.5 bg-white focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="24h">24 heures (14:00)</option>
                  <option value="12h">12 heures (2:00 PM)</option>
                </select>
              </div>

              {/* Premier jour de la semaine */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="text-xs font-medium text-gray-700">Premier jour de la semaine</div>
                  <div className="text-[10px] text-gray-400">Définissez le premier jour affiché</div>
                </div>
                <select
                  value={settings.firstDayOfWeek}
                  onChange={(e) => updateSettings({ firstDayOfWeek: e.target.value })}
                  className="text-xs border border-gray-200 rounded px-2 py-1.5 bg-white focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="monday">Lundi</option>
                  <option value="sunday">Dimanche</option>
                  <option value="saturday">Samedi</option>
                </select>
              </div>

              {/* Afficher le week-end */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="text-xs font-medium text-gray-700">Afficher le week-end</div>
                  <div className="text-[10px] text-gray-400">Afficher samedi et dimanche dans la vue semaine</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showWeekend}
                    onChange={(e) => updateSettings({ showWeekend: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>

              {/* Nombre de semaines */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="text-xs font-medium text-gray-700">Nombre de semaines</div>
                  <div className="text-[10px] text-gray-400">Affiche les numéros de semaine (ex: S01)</div>
                </div>
                <select
                  value={settings.weeksToShow}
                  onChange={(e) => updateSettings({ weeksToShow: parseInt(e.target.value) })}
                  className="text-xs border border-gray-200 rounded px-2 py-1.5 bg-white focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value={1}>1 semaine</option>
                  <option value={2}>2 semaines</option>
                  <option value={4}>4 semaines</option>
                </select>
              </div>

              {/* Hauteur des créneaux */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="text-xs font-medium text-gray-700">Hauteur des créneaux</div>
                  <div className="text-[10px] text-gray-400">Choisir automatiquement l'hauteur fixe</div>
                </div>
                <select
                  value={settings.slotHeight}
                  onChange={(e) => updateSettings({ slotHeight: e.target.value })}
                  className="text-xs border border-gray-200 rounded px-2 py-1.5 bg-white focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="auto">Automatique (built-in)</option>
                  <option value="small">Petit</option>
                  <option value="medium">Moyen</option>
                  <option value="large">Grand</option>
                </select>
              </div>
            </div>

            {/* Plage horaire affichée */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Plage horaire affichée</h3>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-500">de</span>
                <select
                  value={settings.displayStartHour}
                  onChange={(e) => updateSettings({ displayStartHour: e.target.value })}
                  className="text-xs border border-gray-200 rounded px-2 py-1.5 bg-white focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                >
                  {HOURS.map((hour) => (
                    <option key={hour.value} value={hour.value}>{hour.label}</option>
                  ))}
                </select>
                <span className="text-xs text-gray-500">à</span>
                <select
                  value={settings.displayEndHour}
                  onChange={(e) => updateSettings({ displayEndHour: e.target.value })}
                  className="text-xs border border-gray-200 rounded px-2 py-1.5 bg-white focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                >
                  {HOURS.map((hour) => (
                    <option key={hour.value} value={hour.value}>{hour.label}</option>
                  ))}
                </select>
              </div>
              <p className="text-[10px] text-gray-400">
                Les rendez-vous pris en dehors de cette plage ne seront pas affichés
              </p>
            </div>

            {/* Masquer les heures non ouvrées */}
            <div className="flex items-center justify-between py-2 mb-4">
              <div>
                <div className="text-xs font-medium text-gray-700">Masquer les heures non ouvrées</div>
                <div className="text-[10px] text-gray-400">Grise automatiquement hors plage de travail</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.hideNonWorkingHours}
                  onChange={(e) => updateSettings({ hideNonWorkingHours: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
              </label>
            </div>

            {/* Précision de la souris */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Précision de la souris</h3>
              <p className="text-xs text-gray-500 mb-3">
                Personnalisez la taille des créneaux horaires surlignés quand vous passez la souris sur l'agenda.
              </p>
              <div className="mb-2">
                <span className="text-xs text-gray-600">Durée</span>
              </div>
              <select
                value={settings.mousePrecision}
                onChange={(e) => updateSettings({ mousePrecision: e.target.value })}
                className="w-full text-xs border border-gray-200 rounded px-3 py-2 bg-white focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
              >
                {PRECISION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <p className="text-[10px] text-gray-400 mt-2">
                Par exemple, si vous sélectionnez 5 minutes, vous pouvez faire commencer un rendez-vous à 09h05, 09h10, 09h15 etc. La valeur par défaut est la durée du motif de consultation concerné.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-teal-600 text-white rounded-md text-xs font-medium hover:bg-teal-700 transition-colors"
            >
              REVENIR À L'AGENDA
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
