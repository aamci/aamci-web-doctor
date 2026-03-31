'use client';

import { useState, useEffect } from 'react';
import {
  Monitor, Moon, Sun, Laptop, Rocket, MinusCircle, EyeOff,
  RefreshCw, Download, Trash2, HardDrive, Info, Globe, Palette,
  Database, Wifi, WifiOff, Check, AlertCircle, Loader2,
} from 'lucide-react';
import { useElectron } from '../../../hooks/useElectron';

interface CacheStats {
  appointments: { count: number; isValid: boolean; lastUpdated: string | null };
  patients: { count: number; isValid: boolean; lastUpdated: string | null };
  prescriptions: { count: number; isValid: boolean; lastUpdated: string | null };
  templates: { count: number; isValid: boolean; lastUpdated: string | null };
  isOnline: boolean;
  lastSync: string | null;
  cacheSize: number;
}

type Theme = 'light' | 'dark' | 'system';

function Toggle({ checked, onChange, disabled = false }: { checked: boolean; onChange: (val: boolean) => void; disabled?: boolean }) {
  return (
    <button type="button" disabled={disabled} onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none ${
        checked ? 'bg-teal-600' : 'bg-slate-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  );
}

export default function ApplicationSettingsPage() {
  const {
    isElectron, platform, appVersion, isMac,
    getSettings, setSetting, setTheme: setElectronTheme,
    getCacheStats, cacheClear, isOnline,
    autoLaunchIsEnabled, autoLaunchToggle, onUpdateAvailable,
  } = useElectron();

  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<Theme>('system');
  const [language, setLanguage] = useState('fr');
  const [minimizeToTray, setMinimizeToTray] = useState(true);
  const [startMinimized, setStartMinimized] = useState(false);
  const [autoLaunch, setAutoLaunch] = useState(false);
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [online, setOnline] = useState(true);
  const [clearingCache, setClearingCache] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        if (isElectron) {
          const settings = await getSettings();
          if (settings) {
            setTheme(settings.theme || 'system');
            setLanguage(settings.language || 'fr');
            setMinimizeToTray(settings.minimizeToTray ?? true);
            setStartMinimized(settings.startMinimized ?? false);
            setAutoUpdate(settings.autoUpdate ?? true);
          }
          const al = await autoLaunchIsEnabled();
          if (al) setAutoLaunch(al.enabled ?? false);
          const stats = await getCacheStats();
          setCacheStats(stats);
          const isOnlineResult = await isOnline();
          setOnline(isOnlineResult);
        } else {
          const savedTheme = localStorage.getItem('theme') as Theme;
          if (savedTheme) setTheme(savedTheme);
          const savedLang = localStorage.getItem('language');
          if (savedLang) setLanguage(savedLang);
          setOnline(navigator.onLine);
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    load();
  }, [isElectron, getSettings, autoLaunchIsEnabled, getCacheStats, isOnline]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => document.documentElement.classList.toggle('dark', e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [theme]);

  useEffect(() => {
    if (!isElectron) {
      const handleOnline = () => setOnline(true);
      const handleOffline = () => setOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
    }
  }, [isElectron]);

  useEffect(() => {
    if (isElectron) {
      const cleanup = onUpdateAvailable((info) => setMessage({ type: 'success', text: `Mise à jour ${info.version} disponible` }));
      return cleanup;
    }
  }, [isElectron, onUpdateAvailable]);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleThemeChange = async (newTheme: Theme) => {
    setTheme(newTheme);
    if (isElectron) { await setElectronTheme(newTheme); await setSetting('theme', newTheme); }
    else { localStorage.setItem('theme', newTheme); }
    showFeedback('success', 'Thème mis à jour');
  };

  const handleLanguageChange = async (newLang: string) => {
    setLanguage(newLang);
    if (isElectron) { await setSetting('language', newLang); }
    else { localStorage.setItem('language', newLang); }
    document.documentElement.lang = newLang;
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    showFeedback('success', 'Langue mise à jour — rechargement en cours…');
    setTimeout(() => window.location.reload(), 1500);
  };

  const handleAutoLaunchToggle = async () => {
    if (!isElectron) return;
    const result = await autoLaunchToggle();
    if (result?.success) {
      setAutoLaunch(result.enabled ?? false);
      showFeedback('success', result.enabled ? 'Démarrage automatique activé' : 'Démarrage automatique désactivé');
    } else {
      showFeedback('error', result?.error || 'Erreur lors du changement');
    }
  };

  const handleClearCache = async (type?: string) => {
    if (!isElectron) return;
    setClearingCache(true);
    try {
      await cacheClear(type as any);
      const stats = await getCacheStats();
      setCacheStats(stats);
      showFeedback('success', type ? `Cache "${type}" vidé` : 'Tout le cache vidé');
    } catch { showFeedback('error', 'Erreur lors du vidage du cache'); }
    finally { setClearingCache(false); }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Jamais';
    return new Date(dateStr).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getPlatformLabel = () => {
    switch (platform) {
      case 'darwin': return 'macOS';
      case 'win32': return 'Windows';
      case 'linux': return 'Linux';
      default: return 'Navigateur web';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
      </div>
    );
  }

  const CACHE_LABELS: Record<string, string> = {
    appointments: 'Rendez-vous', patients: 'Patients',
    prescriptions: 'Ordonnances', templates: 'Templates',
  };

  return (
    <>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Application</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isElectron ? 'Configurez votre application desktop' : 'Configurez votre expérience'}
          </p>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
          online ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {online ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {online ? 'En ligne' : 'Hors ligne'}
        </div>
      </div>

      {/* Feedback */}
      {message && (
        <div className={`mb-5 p-3.5 rounded-xl flex items-center gap-3 text-sm border ${
          message.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {message.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {message.text}
        </div>
      )}

      {/* Apparence */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-4">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
          <Palette className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-800">Apparence</h2>
        </div>
        <div className="p-5 space-y-5">
          {/* Theme picker */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Thème</p>
            <div className="grid grid-cols-3 gap-3">
              {([
                { id: 'light' as Theme, label: 'Clair', icon: Sun },
                { id: 'dark' as Theme, label: 'Sombre', icon: Moon },
                { id: 'system' as Theme, label: 'Système', icon: Laptop },
              ]).map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => handleThemeChange(id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    theme === id
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}>
                  <Icon className={`w-5 h-5 ${theme === id ? 'text-teal-600' : 'text-slate-400'}`} />
                  <span className={`text-xs font-medium ${theme === id ? 'text-teal-700' : 'text-slate-600'}`}>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> Langue
            </label>
            <select value={language} onChange={e => handleLanguageChange(e.target.value)}
              className="w-full max-w-xs px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors">
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
          </div>
        </div>
      </div>

      {/* Desktop settings — Electron only */}
      {isElectron && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-4">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
            <Monitor className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-800">Application desktop</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {[
              { icon: Rocket, iconColor: 'text-blue-500', label: 'Démarrage automatique', desc: `Lancer au démarrage de ${isMac ? 'macOS' : platform === 'win32' ? 'Windows' : 'Linux'}`, checked: autoLaunch, onChange: handleAutoLaunchToggle },
              { icon: MinusCircle, iconColor: 'text-violet-500', label: 'Réduire dans la barre système', desc: "Reste actif en arrière-plan lors de la fermeture", checked: minimizeToTray, onChange: async (v: boolean) => { setMinimizeToTray(v); await setSetting('minimizeToTray', v); } },
              { icon: EyeOff, iconColor: 'text-slate-400', label: 'Démarrer en arrière-plan', desc: "Démarre minimisé dans la barre système", checked: startMinimized, onChange: async (v: boolean) => { setStartMinimized(v); await setSetting('startMinimized', v); } },
              { icon: Download, iconColor: 'text-emerald-500', label: 'Mises à jour automatiques', desc: "Télécharger et installer automatiquement", checked: autoUpdate, onChange: async (v: boolean) => { setAutoUpdate(v); await setSetting('autoUpdate', v); } },
            ].map(({ icon: Icon, iconColor, label, desc, checked, onChange }) => (
              <div key={label} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${iconColor} shrink-0`} />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                  </div>
                </div>
                <Toggle checked={checked} onChange={onChange} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cache — Electron only */}
      {isElectron && cacheStats && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-4">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-800">Cache local</h2>
            </div>
            <span className="text-xs text-slate-400">{formatBytes(cacheStats.cacheSize)} total</span>
          </div>
          <div className="px-5 py-3.5 bg-blue-50 border-b border-blue-100">
            <p className="text-xs text-blue-700 flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              Dernière sync : {formatDate(cacheStats.lastSync)}
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {(['appointments', 'patients', 'prescriptions', 'templates'] as const).map(type => {
              const stat = cacheStats[type];
              return (
                <div key={type} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <HardDrive className="w-4 h-4 text-slate-300" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{CACHE_LABELS[type]}</p>
                      <p className="text-xs text-slate-400">{stat.count} éléments{stat.lastUpdated && ` · ${formatDate(stat.lastUpdated)}`}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${stat.isValid ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    <button onClick={() => handleClearCache(type)} disabled={clearingCache}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title={`Vider "${CACHE_LABELS[type]}"`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="px-5 py-3.5 border-t border-slate-100 flex justify-end">
            <button onClick={() => handleClearCache()} disabled={clearingCache}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors">
              {clearingCache ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Vider tout le cache
            </button>
          </div>
        </div>
      )}

      {/* À propos */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-4">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
          <Info className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-800">À propos</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {[
            { label: 'Plateforme', value: getPlatformLabel() },
            ...(isElectron && appVersion ? [{ label: 'Version', value: `v${appVersion}` }] : []),
            { label: 'Environnement', value: isElectron ? 'Desktop' : 'Web' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between px-5 py-3">
              <span className="text-sm text-slate-500">{label}</span>
              <span className="text-sm font-medium text-slate-800">{value}</span>
            </div>
          ))}
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm text-slate-500">Réseau</span>
            <span className={`flex items-center gap-1.5 text-sm font-medium ${online ? 'text-emerald-600' : 'text-red-600'}`}>
              <span className={`w-2 h-2 rounded-full ${online ? 'bg-emerald-400' : 'bg-red-400'}`} />
              {online ? 'Connecté' : 'Hors ligne'}
            </span>
          </div>
        </div>
      </div>

      {/* Raccourcis clavier — Desktop only */}
      {isElectron && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
            <span className="w-4 h-4 text-slate-400 flex items-center justify-center text-xs font-bold border border-slate-300 rounded">⌘</span>
            <h2 className="text-sm font-semibold text-slate-800">Raccourcis clavier</h2>
          </div>
          <div className="px-5 py-4 grid grid-cols-2 gap-x-8 gap-y-1.5">
            {[
              { keys: `${isMac ? '⌘' : 'Ctrl'}+1 à 7`, label: 'Navigation rapide' },
              { keys: `${isMac ? '⌘' : 'Ctrl'}+N`, label: 'Nouveau rendez-vous' },
              { keys: `${isMac ? '⌘' : 'Ctrl'}+⇧+N`, label: 'Nouvelle ordonnance' },
              { keys: `${isMac ? '⌘' : 'Ctrl'}+P`, label: 'Imprimer' },
              { keys: `${isMac ? '⌘' : 'Ctrl'}+⇧+E`, label: 'Exporter en PDF' },
              { keys: `${isMac ? '⌘' : 'Ctrl'}+,`, label: 'Préférences' },
              { keys: `${isMac ? '⌘' : 'Ctrl'}+F`, label: 'Rechercher' },
              { keys: `${isMac ? '⌘' : 'Ctrl'}+⇧+H`, label: "Afficher l'app" },
            ].map(({ keys, label }) => (
              <div key={label} className="flex items-center justify-between py-1">
                <span className="text-xs text-slate-500">{label}</span>
                <kbd className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-mono rounded border border-slate-200">{keys}</kbd>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
