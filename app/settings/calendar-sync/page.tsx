'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Settings,
  Link2,
  Unlink,
  RefreshCw,
  Check,
  X,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Clock,
  CalendarDays,
  Loader2,
  Shield,
  Eye,
  EyeOff,
  Copy,
  CheckCircle2,
  Info,
  Zap,
  ArrowLeft,
} from 'lucide-react';

interface CalendarProvider {
  id: string;
  name: string;
  icon: string;
  color: string;
  connected: boolean;
  email?: string;
  lastSyncAt?: string;
  calendars?: CalendarInfo[];
}

interface CalendarInfo {
  id: string;
  name: string;
  color: string;
  primary: boolean;
  syncEnabled: boolean;
  direction: 'import' | 'export' | 'both';
}

interface SyncSettings {
  autoSync: boolean;
  syncInterval: number; // minutes
  importAppointments: boolean;
  exportAppointments: boolean;
  showBusyOnly: boolean;
  conflictResolution: 'local' | 'remote' | 'manual';
}

export default function CalendarSyncPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [providers, setProviders] = useState<CalendarProvider[]>([]);
  const [settings, setSettings] = useState<SyncSettings>({
    autoSync: true,
    syncInterval: 15,
    importAppointments: true,
    exportAppointments: true,
    showBusyOnly: false,
    conflictResolution: 'manual',
  });
  const [showCalendarSelector, setShowCalendarSelector] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // iCal URL for sharing
  const icalUrl = 'https://api.healthplatform.com/calendar/ical/abc123xyz';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/auth/login');
      return;
    }
    loadCalendarData();
  }, [router]);

  const loadCalendarData = async () => {
    setLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 600));

    setProviders([
      {
        id: 'google',
        name: 'Google Calendar',
        icon: '📅',
        color: '#4285F4',
        connected: true,
        email: 'dr.dupont@gmail.com',
        lastSyncAt: '2026-02-05T10:30:00',
        calendars: [
          { id: 'primary', name: 'Calendrier principal', color: '#4285F4', primary: true, syncEnabled: true, direction: 'both' },
          { id: 'work', name: 'Travail', color: '#0B8043', primary: false, syncEnabled: true, direction: 'export' },
          { id: 'personal', name: 'Personnel', color: '#D50000', primary: false, syncEnabled: false, direction: 'import' },
        ],
      },
      {
        id: 'outlook',
        name: 'Microsoft Outlook',
        icon: '📧',
        color: '#0078D4',
        connected: false,
      },
      {
        id: 'apple',
        name: 'Apple Calendar (iCal)',
        icon: '🍎',
        color: '#000000',
        connected: false,
      },
    ]);

    setLoading(false);
  };

  const handleConnect = async (providerId: string) => {
    setConnecting(providerId);

    // Simulate OAuth flow
    await new Promise(resolve => setTimeout(resolve, 1500));

    setProviders(prev => prev.map(p => {
      if (p.id === providerId) {
        return {
          ...p,
          connected: true,
          email: providerId === 'outlook' ? 'dr.dupont@outlook.com' : 'dr.dupont@icloud.com',
          lastSyncAt: new Date().toISOString(),
          calendars: [
            { id: 'default', name: 'Calendrier', color: p.color, primary: true, syncEnabled: true, direction: 'both' as const },
          ],
        };
      }
      return p;
    }));

    setConnecting(null);
  };

  const handleDisconnect = async (providerId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir déconnecter ce calendrier ?')) return;

    setProviders(prev => prev.map(p => {
      if (p.id === providerId) {
        return {
          ...p,
          connected: false,
          email: undefined,
          lastSyncAt: undefined,
          calendars: undefined,
        };
      }
      return p;
    }));
  };

  const handleSync = async (providerId?: string) => {
    setSyncing(true);

    // Simulate sync
    await new Promise(resolve => setTimeout(resolve, 2000));

    setProviders(prev => prev.map(p => {
      if (!providerId || p.id === providerId) {
        return {
          ...p,
          lastSyncAt: new Date().toISOString(),
        };
      }
      return p;
    }));

    setSyncing(false);
  };

  const handleCalendarToggle = (providerId: string, calendarId: string) => {
    setProviders(prev => prev.map(p => {
      if (p.id === providerId && p.calendars) {
        return {
          ...p,
          calendars: p.calendars.map(c => {
            if (c.id === calendarId) {
              return { ...c, syncEnabled: !c.syncEnabled };
            }
            return c;
          }),
        };
      }
      return p;
    }));
  };

  const handleCopyIcalUrl = () => {
    navigator.clipboard.writeText(icalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatLastSync = (dateString?: string) => {
    if (!dateString) return 'Jamais';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffMins < 1440) return `Il y a ${Math.floor(diffMins / 60)} h`;
    return date.toLocaleDateString('fr-FR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
          <p className="mt-3 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Synchronisation calendrier</h1>
              <p className="text-sm text-gray-500">Connectez vos calendriers externes</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${providers.some(p => p.connected) ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-sm text-gray-600">
                {providers.filter(p => p.connected).length} calendrier(s) connecté(s)
              </span>
            </div>
            <button
              onClick={() => handleSync()}
              disabled={syncing || !providers.some(p => p.connected)}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Synchronisation...' : 'Synchroniser tout'}
            </button>
          </div>
        </div>

        {/* Calendar Providers */}
        <div className="space-y-4 mb-8">
          <h2 className="text-lg font-semibold text-gray-900">Calendriers</h2>

          {providers.map((provider) => (
            <div key={provider.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${provider.color}15` }}
                    >
                      {provider.icon}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{provider.name}</h3>
                      {provider.connected ? (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-green-600 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Connecté
                          </span>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-500">{provider.email}</span>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Non connecté</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {provider.connected ? (
                      <>
                        <button
                          onClick={() => setShowCalendarSelector(
                            showCalendarSelector === provider.id ? null : provider.id
                          )}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Gérer les calendriers"
                        >
                          <Settings className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleSync(provider.id)}
                          disabled={syncing}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Synchroniser"
                        >
                          <RefreshCw className={`w-4 h-4 text-gray-500 ${syncing ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                          onClick={() => handleDisconnect(provider.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Déconnecter"
                        >
                          <Unlink className="w-4 h-4 text-red-500" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleConnect(provider.id)}
                        disabled={connecting !== null}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                      >
                        {connecting === provider.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Connexion...
                          </>
                        ) : (
                          <>
                            <Link2 className="w-4 h-4" />
                            Connecter
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {provider.connected && provider.lastSyncAt && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Dernière sync: {formatLastSync(provider.lastSyncAt)}
                    </span>
                    {provider.calendars && (
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {provider.calendars.filter(c => c.syncEnabled).length}/{provider.calendars.length} calendriers actifs
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Calendar selector dropdown */}
              {showCalendarSelector === provider.id && provider.calendars && (
                <div className="border-t border-gray-100 bg-gray-50 p-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">Sélectionnez les calendriers à synchroniser</p>
                  <div className="space-y-2">
                    {provider.calendars.map((cal) => (
                      <label
                        key={cal.id}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={cal.syncEnabled}
                            onChange={() => handleCalendarToggle(provider.id, cal.id)}
                            className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
                          />
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: cal.color }}
                          />
                          <span className="text-sm text-gray-900">{cal.name}</span>
                          {cal.primary && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              Principal
                            </span>
                          )}
                        </div>
                        <select
                          value={cal.direction}
                          onChange={(e) => {
                            setProviders(prev => prev.map(p => {
                              if (p.id === provider.id && p.calendars) {
                                return {
                                  ...p,
                                  calendars: p.calendars.map(c => {
                                    if (c.id === cal.id) {
                                      return { ...c, direction: e.target.value as 'import' | 'export' | 'both' };
                                    }
                                    return c;
                                  }),
                                };
                              }
                              return p;
                            }));
                          }}
                          className="text-xs px-2 py-1 border border-gray-200 rounded bg-white"
                          disabled={!cal.syncEnabled}
                        >
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

        {/* iCal URL Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">URL iCal (lecture seule)</h3>
              <p className="text-sm text-gray-500 mb-4">
                Utilisez cette URL pour ajouter votre planning à n'importe quelle application de calendrier.
              </p>

              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 font-mono text-sm text-gray-600 overflow-x-auto">
                  {icalUrl}
                </div>
                <button
                  onClick={handleCopyIcalUrl}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Copié !
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copier
                    </>
                  )}
                </button>
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Cette URL est privée. Ne la partagez pas.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sync Settings */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Paramètres de synchronisation</h2>

          <div className="space-y-4">
            {/* Auto sync */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Synchronisation automatique</p>
                <p className="text-sm text-gray-500">Synchroniser automatiquement en arrière-plan</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoSync}
                  onChange={(e) => setSettings(prev => ({ ...prev, autoSync: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
              </label>
            </div>

            {/* Sync interval */}
            {settings.autoSync && (
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">Intervalle de synchronisation</p>
                  <p className="text-sm text-gray-500">Fréquence de mise à jour automatique</p>
                </div>
                <select
                  value={settings.syncInterval}
                  onChange={(e) => setSettings(prev => ({ ...prev, syncInterval: parseInt(e.target.value) }))}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                >
                  <option value={5}>Toutes les 5 minutes</option>
                  <option value={15}>Toutes les 15 minutes</option>
                  <option value={30}>Toutes les 30 minutes</option>
                  <option value={60}>Toutes les heures</option>
                </select>
              </div>
            )}

            {/* Import appointments */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Importer les événements</p>
                <p className="text-sm text-gray-500">Afficher les événements externes dans votre planning</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.importAppointments}
                  onChange={(e) => setSettings(prev => ({ ...prev, importAppointments: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
              </label>
            </div>

            {/* Export appointments */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Exporter les rendez-vous</p>
                <p className="text-sm text-gray-500">Ajouter vos RDV aux calendriers connectés</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.exportAppointments}
                  onChange={(e) => setSettings(prev => ({ ...prev, exportAppointments: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
              </label>
            </div>

            {/* Show busy only */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Afficher "Occupé" uniquement</p>
                <p className="text-sm text-gray-500">Masquer les détails des RDV dans les exports</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showBusyOnly}
                  onChange={(e) => setSettings(prev => ({ ...prev, showBusyOnly: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
              </label>
            </div>

            {/* Conflict resolution */}
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-gray-900">Résolution des conflits</p>
                <p className="text-sm text-gray-500">Comment gérer les événements en doublon</p>
              </div>
              <select
                value={settings.conflictResolution}
                onChange={(e) => setSettings(prev => ({ ...prev, conflictResolution: e.target.value as 'local' | 'remote' | 'manual' }))}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              >
                <option value="manual">Demander</option>
                <option value="local">Priorité locale</option>
                <option value="remote">Priorité externe</option>
              </select>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-6 p-4 bg-blue-50 rounded-xl">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">Besoin d'aide ?</p>
              <p className="text-sm text-blue-700 mt-1">
                Consultez notre <a href="#" className="underline">guide de configuration</a> pour synchroniser vos calendriers Google, Outlook ou Apple.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
