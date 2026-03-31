'use client';

import { useState, useEffect } from 'react';
import {
  Calendar, Settings, Link2, Unlink, RefreshCw, Check,
  AlertCircle, Clock, CalendarDays, Loader2, Zap, Copy,
  CheckCircle2, Info,
} from 'lucide-react';

interface CalendarProvider {
  id: string; name: string; icon: string; color: string; connected: boolean;
  email?: string; lastSyncAt?: string; calendars?: CalendarInfo[];
}

interface CalendarInfo {
  id: string; name: string; color: string; primary: boolean;
  syncEnabled: boolean; direction: 'import' | 'export' | 'both';
}

interface SyncSettings {
  autoSync: boolean; syncInterval: number;
  importAppointments: boolean; exportAppointments: boolean;
  showBusyOnly: boolean; conflictResolution: 'local' | 'remote' | 'manual';
}

function getApiBase() {
  const b = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').trim().replace(/\/+$/, '');
  return b || 'http://localhost:3000';
}

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none ${checked ? 'bg-teal-600' : 'bg-slate-200'}`}>
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  );
}

export default function CalendarSyncPage() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [providers, setProviders] = useState<CalendarProvider[]>([]);
  const [settings, setSettings] = useState<SyncSettings>({
    autoSync: true, syncInterval: 15,
    importAppointments: true, exportAppointments: true,
    showBusyOnly: false, conflictResolution: 'manual',
  });
  const [showCalendarSelector, setShowCalendarSelector] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [icalUrl, setIcalUrl] = useState('');

  useEffect(() => { loadCalendarData(); }, []);

  const loadCalendarData = async () => {
    setLoading(true);
    try {
      const base = getApiBase();
      const headers = getAuthHeaders();
      const [connRes, settingsRes, icalRes] = await Promise.all([
        fetch(`${base}/calendar-sync`, { headers }),
        fetch(`${base}/calendar-sync/settings`, { headers }),
        fetch(`${base}/calendar-sync/ical-url`, { headers }),
      ]);
      if (connRes.ok) { const d = await connRes.json(); setProviders(Array.isArray(d) ? d : []); }
      if (settingsRes.ok) { const d = await settingsRes.json(); setSettings(p => ({ ...p, ...d })); }
      if (icalRes.ok) { const d = await icalRes.json(); setIcalUrl(d.url || d.icalUrl || ''); }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const handleConnect = async (providerId: string) => {
    setConnecting(providerId);
    try {
      const res = await fetch(`${getApiBase()}/calendar-sync/connect`, {
        method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ provider: providerId }),
      });
      if (res.ok) {
        const data = await res.json();
        setProviders(prev => prev.map(p => p.id !== providerId ? p : {
          ...p, connected: true,
          email: data.email || p.email,
          lastSyncAt: data.lastSyncAt || new Date().toISOString(),
          calendars: data.calendars || [{ id: 'default', name: 'Calendrier', color: p.color, primary: true, syncEnabled: true, direction: 'both' as const }],
        }));
      }
    } catch { /* ignore */ }
    finally { setConnecting(null); }
  };

  const handleDisconnect = async (providerId: string) => {
    if (!confirm('Déconnecter ce calendrier ?')) return;
    try {
      await fetch(`${getApiBase()}/calendar-sync/${providerId}`, { method: 'DELETE', headers: getAuthHeaders() });
    } catch { /* ignore */ }
    setProviders(prev => prev.map(p => p.id !== providerId ? p : { ...p, connected: false, email: undefined, lastSyncAt: undefined, calendars: undefined }));
  };

  const handleSync = async (providerId?: string) => {
    setSyncing(true);
    try {
      const base = getApiBase();
      const toSync = providerId ? providers.filter(p => p.id === providerId && p.connected) : providers.filter(p => p.connected);
      await Promise.all(toSync.map(p => fetch(`${base}/calendar-sync/${p.id}/sync`, { method: 'POST', headers: getAuthHeaders() })));
      setProviders(prev => prev.map(p => (!providerId || p.id === providerId) ? { ...p, lastSyncAt: new Date().toISOString() } : p));
    } catch { /* ignore */ }
    finally { setSyncing(false); }
  };

  const handleCalendarToggle = (providerId: string, calendarId: string) => {
    setProviders(prev => prev.map(p => p.id !== providerId || !p.calendars ? p : {
      ...p, calendars: p.calendars.map(c => c.id !== calendarId ? c : { ...c, syncEnabled: !c.syncEnabled }),
    }));
  };

  const handleCopyIcalUrl = () => {
    navigator.clipboard.writeText(icalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatLastSync = (dateString?: string) => {
    if (!dateString) return 'Jamais';
    const diffMins = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffMins < 1440) return `Il y a ${Math.floor(diffMins / 60)} h`;
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const SELECT = `px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Calendrier externe</h1>
          <p className="text-sm text-slate-500 mt-0.5">Connectez et synchronisez vos calendriers</p>
        </div>
        <button onClick={() => handleSync()} disabled={syncing || !providers.some(p => p.connected)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Synchro…' : 'Synchroniser tout'}
        </button>
      </div>

      {/* Status banner */}
      <div className="flex items-center gap-2 p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm mb-5">
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${providers.some(p => p.connected) ? 'bg-emerald-400' : 'bg-slate-300'}`} />
        <span className="text-sm text-slate-600">
          {providers.filter(p => p.connected).length} calendrier(s) connecté(s)
        </span>
      </div>

      {/* Providers */}
      {providers.length > 0 && (
        <div className="space-y-3 mb-5">
          {providers.map(provider => (
            <div key={provider.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ backgroundColor: `${provider.color}18` }}>
                    {provider.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{provider.name}</p>
                    {provider.connected ? (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-emerald-600 flex items-center gap-1"><Check className="w-3 h-3" />Connecté</span>
                        {provider.email && <><span className="text-slate-300">·</span><span className="text-slate-400">{provider.email}</span></>}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">Non connecté</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {provider.connected ? (
                    <>
                      <button onClick={() => setShowCalendarSelector(showCalendarSelector === provider.id ? null : provider.id)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors" title="Gérer les calendriers">
                        <Settings className="w-4 h-4 text-slate-400" />
                      </button>
                      <button onClick={() => handleSync(provider.id)} disabled={syncing}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors" title="Synchroniser">
                        <RefreshCw className={`w-4 h-4 text-slate-400 ${syncing ? 'animate-spin' : ''}`} />
                      </button>
                      <button onClick={() => handleDisconnect(provider.id)}
                        className="p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="Déconnecter">
                        <Unlink className="w-4 h-4 text-red-400" />
                      </button>
                    </>
                  ) : (
                    <button onClick={() => handleConnect(provider.id)} disabled={connecting !== null}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 text-white rounded-lg hover:bg-slate-900 disabled:opacity-50 transition-colors">
                      {connecting === provider.id ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Connexion…</> : <><Link2 className="w-3.5 h-3.5" />Connecter</>}
                    </button>
                  )}
                </div>
              </div>

              {provider.connected && provider.lastSyncAt && (
                <div className="px-5 pb-3 flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Sync : {formatLastSync(provider.lastSyncAt)}</span>
                  {provider.calendars && (
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      {provider.calendars.filter(c => c.syncEnabled).length}/{provider.calendars.length} actifs
                    </span>
                  )}
                </div>
              )}

              {/* Calendar selector */}
              {showCalendarSelector === provider.id && provider.calendars && (
                <div className="border-t border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Calendriers à synchroniser</p>
                  <div className="space-y-2">
                    {provider.calendars.map(cal => (
                      <label key={cal.id}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-slate-300 transition-colors">
                        <div className="flex items-center gap-3">
                          <input type="checkbox" checked={cal.syncEnabled}
                            onChange={() => handleCalendarToggle(provider.id, cal.id)}
                            className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500" />
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cal.color }} />
                          <span className="text-sm text-slate-800">{cal.name}</span>
                          {cal.primary && <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">Principal</span>}
                        </div>
                        <select value={cal.direction} disabled={!cal.syncEnabled}
                          onChange={e => setProviders(prev => prev.map(p => p.id !== provider.id || !p.calendars ? p : {
                            ...p, calendars: p.calendars.map(c => c.id !== cal.id ? c : { ...c, direction: e.target.value as 'import' | 'export' | 'both' }),
                          }))}
                          className="text-xs px-2 py-1 border border-slate-200 rounded-lg bg-white disabled:opacity-50">
                          <option value="both">↔ Bidirectionnel</option>
                          <option value="import">← Import seulement</option>
                          <option value="export">→ Export seulement</option>
                        </select>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* iCal URL */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-5">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
          <Zap className="w-4 h-4 text-slate-400" />
          <div>
            <h2 className="text-sm font-semibold text-slate-800">URL iCal (lecture seule)</h2>
            <p className="text-xs text-slate-400">Ajoutez votre planning à n'importe quelle app calendrier</p>
          </div>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 font-mono text-xs text-slate-500 overflow-x-auto whitespace-nowrap">
              {icalUrl || 'Chargement de l\'URL…'}
            </div>
            <button onClick={handleCopyIcalUrl} disabled={!icalUrl}
              className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium bg-slate-800 text-white rounded-lg hover:bg-slate-900 disabled:opacity-40 transition-colors shrink-0">
              {copied ? <><CheckCircle2 className="w-3.5 h-3.5" />Copié</> : <><Copy className="w-3.5 h-3.5" />Copier</>}
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 px-3 py-2 rounded-lg">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            Cette URL est privée — ne la partagez pas.
          </div>
        </div>
      </div>

      {/* Sync settings */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-5">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
          <Calendar className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-800">Paramètres de synchronisation</h2>
        </div>
        <div className="divide-y divide-slate-100">
          <div className="flex items-center justify-between px-5 py-3.5">
            <div>
              <p className="text-sm font-medium text-slate-800">Synchronisation automatique</p>
              <p className="text-xs text-slate-400 mt-0.5">Synchroniser en arrière-plan</p>
            </div>
            <Toggle checked={settings.autoSync} onChange={v => setSettings(p => ({ ...p, autoSync: v }))} />
          </div>
          {settings.autoSync && (
            <div className="flex items-center justify-between px-5 py-3.5">
              <div>
                <p className="text-sm font-medium text-slate-800">Intervalle</p>
                <p className="text-xs text-slate-400 mt-0.5">Fréquence de mise à jour</p>
              </div>
              <select value={settings.syncInterval} onChange={e => setSettings(p => ({ ...p, syncInterval: parseInt(e.target.value) }))} className={SELECT}>
                <option value={5}>5 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 heure</option>
              </select>
            </div>
          )}
          <div className="flex items-center justify-between px-5 py-3.5">
            <div>
              <p className="text-sm font-medium text-slate-800">Importer les événements externes</p>
              <p className="text-xs text-slate-400 mt-0.5">Afficher dans votre planning</p>
            </div>
            <Toggle checked={settings.importAppointments} onChange={v => setSettings(p => ({ ...p, importAppointments: v }))} />
          </div>
          <div className="flex items-center justify-between px-5 py-3.5">
            <div>
              <p className="text-sm font-medium text-slate-800">Exporter les rendez-vous</p>
              <p className="text-xs text-slate-400 mt-0.5">Ajouter vos RDV aux calendriers liés</p>
            </div>
            <Toggle checked={settings.exportAppointments} onChange={v => setSettings(p => ({ ...p, exportAppointments: v }))} />
          </div>
          <div className="flex items-center justify-between px-5 py-3.5">
            <div>
              <p className="text-sm font-medium text-slate-800">Afficher "Occupé" uniquement</p>
              <p className="text-xs text-slate-400 mt-0.5">Masquer les détails dans les exports</p>
            </div>
            <Toggle checked={settings.showBusyOnly} onChange={v => setSettings(p => ({ ...p, showBusyOnly: v }))} />
          </div>
          <div className="flex items-center justify-between px-5 py-3.5">
            <div>
              <p className="text-sm font-medium text-slate-800">Résolution des conflits</p>
              <p className="text-xs text-slate-400 mt-0.5">Comment gérer les doublons</p>
            </div>
            <select value={settings.conflictResolution}
              onChange={e => setSettings(p => ({ ...p, conflictResolution: e.target.value as 'local' | 'remote' | 'manual' }))}
              className={SELECT}>
              <option value="manual">Demander</option>
              <option value="local">Priorité locale</option>
              <option value="remote">Priorité externe</option>
            </select>
          </div>
        </div>
      </div>

      {/* Help */}
      <div className="flex items-start gap-2.5 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800">
        <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-400" />
        Connectez Google Calendar, Outlook ou Apple Calendar via les boutons ci-dessus, ou utilisez l'URL iCal pour une intégration en lecture seule.
      </div>
    </>
  );
}
