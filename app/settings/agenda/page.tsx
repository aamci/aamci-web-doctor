'use client';

import { useState, useEffect, useCallback } from 'react';
import { Info, Check, Loader2 } from 'lucide-react';

interface AgendaSettings {
  zoomLevel: number;
  displayStartHour: string;
  displayEndHour: string;
  mousePrecision: string;
  showSchoolHolidays: boolean;
}

const DEFAULT: AgendaSettings = {
  zoomLevel: 0, displayStartHour: '07:00', displayEndHour: '19:00',
  mousePrecision: 'default', showSchoolHolidays: false,
};

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i.toString().padStart(2, '0');
  return { value: `${h}:00`, label: `${h}:00` };
});

const PRECISION = [
  { value: 'default', label: 'Valeur par défaut' },
  { value: '5', label: '5 minutes' },
  { value: '10', label: '10 minutes' },
  { value: '15', label: '15 minutes' },
  { value: '30', label: '30 minutes' },
];

const SELECT = `w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors`;

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none ${checked ? 'bg-teal-600' : 'bg-slate-200'}`}>
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  );
}

export default function AgendaConfigPage() {
  const [loaded, setLoaded] = useState(false);
  const [feedback, setFeedback] = useState(false);
  const [settings, setSettings] = useState<AgendaSettings>(DEFAULT);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('agendaSettings');
      if (saved) setSettings({ ...DEFAULT, ...JSON.parse(saved) });
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);

  const save = useCallback((next: AgendaSettings) => {
    try {
      localStorage.setItem('agendaSettings', JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('agendaSettingsChanged', { detail: next }));
      setFeedback(true);
      setTimeout(() => setFeedback(false), 1500);
    } catch { /* ignore */ }
  }, []);

  const update = (patch: Partial<AgendaSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    save(next);
  };

  if (!loaded) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-teal-500 animate-spin" /></div>;

  return (
    <>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Affichage de l'agenda</h1>
          <p className="text-sm text-slate-500 mt-0.5">Personnalisez l'affichage de votre planning</p>
        </div>
        {feedback && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
            <Check className="w-4 h-4" /> Enregistré
          </span>
        )}
      </div>

      <div className="flex items-start gap-2.5 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800 mb-5">
        <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-400" />
        Ces paramètres s'appliquent uniquement à ce compte. Les modifications sont enregistrées automatiquement.
      </div>

      {/* Zoom */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-4">
        <h2 className="text-sm font-semibold text-slate-800 mb-1">Densité d'affichage</h2>
        <p className="text-xs text-slate-400 mb-4">Ajustez le zoom de la vue jour / semaine</p>
        <input type="range" min="0" max="100" value={settings.zoomLevel}
          onChange={e => update({ zoomLevel: +e.target.value })}
          className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-teal-600" />
        <div className="flex justify-between text-xs text-slate-400 mt-2">
          <span className={settings.zoomLevel <= 33 ? 'text-teal-600 font-medium' : ''}>Compact</span>
          <span className={settings.zoomLevel > 33 && settings.zoomLevel <= 66 ? 'text-teal-600 font-medium' : ''}>Standard</span>
          <span className={settings.zoomLevel > 66 ? 'text-teal-600 font-medium' : ''}>Étendu</span>
        </div>
      </div>

      {/* Time range */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-4">
        <h2 className="text-sm font-semibold text-slate-800 mb-1">Plage horaire affichée</h2>
        <p className="text-xs text-slate-400 mb-4">Les rendez-vous hors de cette plage n'apparaîtront pas</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Début</label>
            <select value={settings.displayStartHour} onChange={e => update({ displayStartHour: e.target.value })} className={SELECT}>
              {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Fin</label>
            <select value={settings.displayEndHour} onChange={e => update({ displayEndHour: e.target.value })} className={SELECT}>
              {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Mouse precision */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-4">
        <h2 className="text-sm font-semibold text-slate-800 mb-1">Précision de la souris</h2>
        <p className="text-xs text-slate-400 mb-4">
          Taille des créneaux surlignés au survol. La valeur par défaut correspond à la durée du motif sélectionné.
        </p>
        <select value={settings.mousePrecision} onChange={e => update({ mousePrecision: e.target.value })} className={SELECT}>
          {PRECISION.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* School holidays */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Vacances scolaires</h2>
            <p className="text-xs text-slate-400 mt-0.5">Afficher les vacances scolaires sur l'agenda</p>
          </div>
          <Toggle checked={settings.showSchoolHolidays} onChange={v => update({ showSchoolHolidays: v })} />
        </div>
      </div>
    </>
  );
}
