'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../_providers/AuthProvider';
import {
  Bell, BellOff, Mail, Smartphone, Monitor, Calendar, CreditCard,
  User, Save, RefreshCw, Check, Volume2, VolumeX, Clock,
  MessageSquare, Pill, Settings, Loader2,
} from 'lucide-react';

interface NotificationChannel { email: boolean; push: boolean; inApp: boolean; }

interface NotificationPreferences {
  globalEnabled: boolean; soundEnabled: boolean;
  quietHoursEnabled: boolean; quietHoursStart: string; quietHoursEnd: string;
  appointments: NotificationChannel & { reminders: boolean; reminderTiming: number };
  payments: NotificationChannel; patients: NotificationChannel;
  prescriptions: NotificationChannel; messages: NotificationChannel; system: NotificationChannel;
}

const DEFAULT: NotificationPreferences = {
  globalEnabled: true, soundEnabled: true, quietHoursEnabled: false,
  quietHoursStart: '22:00', quietHoursEnd: '08:00',
  appointments: { email: true, push: true, inApp: true, reminders: true, reminderTiming: 24 },
  payments: { email: true, push: false, inApp: true },
  patients: { email: false, push: true, inApp: true },
  prescriptions: { email: true, push: true, inApp: true },
  messages: { email: false, push: true, inApp: true },
  system: { email: false, push: false, inApp: true },
};

const TOGGLE = `relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none`;
const INPUT_BASE = `px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors`;

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`${TOGGLE} ${checked ? 'bg-teal-600' : 'bg-slate-200'}`}>
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  );
}

export default function NotificationPreferencesPage() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').trim().replace(/\/+$/, '') || 'http://localhost:3000';

  const authedFetch = useCallback((url: string, init?: RequestInit) => {
    const token = localStorage.getItem('token');
    return fetch(`${apiBase}${url}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(init?.headers as any) },
    });
  }, [apiBase]);

  useEffect(() => {
    authedFetch('/users/notification-preferences')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setPrefs({ ...DEFAULT, ...d }); })
      .catch(() => {
        const saved = localStorage.getItem('notif_prefs_pro');
        if (saved) { try { setPrefs({ ...DEFAULT, ...JSON.parse(saved) }); } catch { /* ignore */ } }
      })
      .finally(() => setLoading(false));
  }, []);

  const update = <K extends keyof NotificationPreferences>(key: K, value: NotificationPreferences[K]) => {
    setPrefs(p => ({ ...p, [key]: value }));
    setDirty(true); setSaved(false);
  };

  const updateChannel = (
    cat: 'appointments' | 'payments' | 'patients' | 'prescriptions' | 'messages' | 'system',
    ch: keyof NotificationChannel, value: boolean
  ) => { setPrefs(p => ({ ...p, [cat]: { ...p[cat], [ch]: value } })); setDirty(true); setSaved(false); };

  const save = async () => {
    setSaving(true);
    try { await authedFetch('/users/notification-preferences', { method: 'PATCH', body: JSON.stringify(prefs) }); } catch { /* ignore */ }
    localStorage.setItem('notif_prefs_pro', JSON.stringify(prefs));
    setSaving(false); setSaved(true); setDirty(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const categories = [
    { id: 'appointments' as const, label: 'Rendez-vous', desc: 'Confirmations, rappels, annulations', icon: <Calendar className="w-4 h-4 text-blue-500" />, hasReminders: true },
    { id: 'payments' as const, label: 'Paiements', desc: 'Paiements reçus, remboursements', icon: <CreditCard className="w-4 h-4 text-emerald-500" /> },
    { id: 'patients' as const, label: 'Patients', desc: 'Nouveaux patients, mises à jour', icon: <User className="w-4 h-4 text-violet-500" /> },
    { id: 'prescriptions' as const, label: 'Ordonnances', desc: 'Expirations, renouvellements', icon: <Pill className="w-4 h-4 text-orange-500" /> },
    { id: 'messages' as const, label: 'Messages', desc: 'Nouveaux messages, réponses', icon: <MessageSquare className="w-4 h-4 text-teal-500" /> },
    { id: 'system' as const, label: 'Système', desc: 'Mises à jour, maintenance', icon: <Settings className="w-4 h-4 text-slate-400" /> },
  ];

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-teal-500 animate-spin" /></div>;

  return (
    <>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gérez comment et quand vous recevez des alertes</p>
        </div>
        <button onClick={save} disabled={!dirty || saving}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${dirty && !saving ? 'bg-teal-600 text-white hover:bg-teal-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? 'Enregistrement…' : saved ? 'Enregistré' : 'Enregistrer'}
        </button>
      </div>

      {/* Global */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-4">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-800">Paramètres généraux</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {/* Global on/off */}
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              {prefs.globalEnabled ? <Bell className="w-4 h-4 text-teal-600" /> : <BellOff className="w-4 h-4 text-slate-400" />}
              <div>
                <p className="text-sm font-medium text-slate-800">Notifications activées</p>
                <p className="text-xs text-slate-400">Recevoir toutes les notifications</p>
              </div>
            </div>
            <Toggle checked={prefs.globalEnabled} onChange={v => update('globalEnabled', v)} />
          </div>

          {prefs.globalEnabled && <>
            {/* Sound */}
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                {prefs.soundEnabled ? <Volume2 className="w-4 h-4 text-blue-500" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                <div>
                  <p className="text-sm font-medium text-slate-800">Sons</p>
                  <p className="text-xs text-slate-400">Jouer un son à la réception</p>
                </div>
              </div>
              <Toggle checked={prefs.soundEnabled} onChange={v => update('soundEnabled', v)} />
            </div>

            {/* Quiet hours */}
            <div className="px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-violet-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">Heures calmes</p>
                    <p className="text-xs text-slate-400">Suspendre les notifications de nuit</p>
                  </div>
                </div>
                <Toggle checked={prefs.quietHoursEnabled} onChange={v => update('quietHoursEnabled', v)} />
              </div>
              {prefs.quietHoursEnabled && (
                <div className="flex items-center gap-3 ml-7 mt-2">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">De</p>
                    <input type="time" value={prefs.quietHoursStart} onChange={e => update('quietHoursStart', e.target.value)} className={INPUT_BASE} />
                  </div>
                  <span className="text-slate-300 mt-5">→</span>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">À</p>
                    <input type="time" value={prefs.quietHoursEnd} onChange={e => update('quietHoursEnd', e.target.value)} className={INPUT_BASE} />
                  </div>
                </div>
              )}
            </div>
          </>}
        </div>
      </div>

      {/* Per-category */}
      {prefs.globalEnabled && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">Par catégorie</h2>
            <p className="text-xs text-slate-400 mt-0.5">Choisissez les canaux pour chaque type</p>
          </div>
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_72px_72px_72px] px-5 py-2.5 bg-slate-50 border-b border-slate-100 text-xs font-medium text-slate-400">
            <div>Catégorie</div>
            <div className="text-center flex items-center justify-center gap-1"><Mail className="w-3 h-3" /> Email</div>
            <div className="text-center flex items-center justify-center gap-1"><Smartphone className="w-3 h-3" /> Push</div>
            <div className="text-center flex items-center justify-center gap-1"><Monitor className="w-3 h-3" /> App</div>
          </div>
          <div className="divide-y divide-slate-100">
            {categories.map(cat => (
              <div key={cat.id} className="px-5 py-3.5">
                <div className="grid grid-cols-[1fr_72px_72px_72px] items-center">
                  <div className="flex items-center gap-3">
                    {cat.icon}
                    <div>
                      <p className="text-sm font-medium text-slate-800">{cat.label}</p>
                      <p className="text-xs text-slate-400">{cat.desc}</p>
                    </div>
                  </div>
                  {(['email', 'push', 'inApp'] as const).map(ch => (
                    <div key={ch} className="flex justify-center">
                      <input type="checkbox" checked={prefs[cat.id][ch]} onChange={e => updateChannel(cat.id, ch, e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer" />
                    </div>
                  ))}
                </div>
                {cat.hasReminders && cat.id === 'appointments' && (
                  <div className="mt-3 ml-7 flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <input type="checkbox" checked={prefs.appointments.reminders}
                      onChange={e => setPrefs(p => ({ ...p, appointments: { ...p.appointments, reminders: e.target.checked } }))}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                    <span className="text-xs text-slate-700 font-medium">Rappels automatiques</span>
                    {prefs.appointments.reminders && (
                      <select value={prefs.appointments.reminderTiming}
                        onChange={e => { setPrefs(p => ({ ...p, appointments: { ...p.appointments, reminderTiming: +e.target.value } })); setDirty(true); }}
                        className="ml-auto px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                        {[1,2,4,12,24,48].map(h => <option key={h} value={h}>{h < 24 ? `${h}h avant` : `${h/24}j avant`}</option>)}
                      </select>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end mt-4">
        <button onClick={() => { setPrefs(DEFAULT); setDirty(true); setSaved(false); }}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Réinitialiser par défaut
        </button>
      </div>
    </>
  );
}
