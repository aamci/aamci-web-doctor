'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Monitor,
  Moon,
  Sun,
  Laptop,
  Rocket,
  MinusCircle,
  EyeOff,
  RefreshCw,
  Download,
  Trash2,
  HardDrive,
  Info,
  Globe,
  Palette,
  Database,
  Wifi,
  WifiOff,
  Check,
  AlertCircle,
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

export default function ApplicationSettingsPage() {
  const router = useRouter();
  const {
    isElectron,
    platform,
    appVersion,
    isMac,
    getSettings,
    setSetting,
    setTheme: setElectronTheme,
    getTheme,
    getCacheStats,
    cacheClear,
    isOnline,
    autoLaunchIsEnabled,
    autoLaunchToggle,
    showNotification,
    onUpdateAvailable,
  } = useElectron();

  // State
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

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        if (isElectron) {
          // Load from Electron store
          const settings = await getSettings();
          if (settings) {
            setTheme(settings.theme || 'system');
            setLanguage(settings.language || 'fr');
            setMinimizeToTray(settings.minimizeToTray ?? true);
            setStartMinimized(settings.startMinimized ?? false);
            setAutoUpdate(settings.autoUpdate ?? true);
          }

          // Check auto-launch
          const autoLaunchResult = await autoLaunchIsEnabled();
          if (autoLaunchResult) {
            setAutoLaunch(autoLaunchResult.enabled ?? false);
          }

          // Load cache stats
          const stats = await getCacheStats();
          setCacheStats(stats);

          // Check online status
          const isOnlineResult = await isOnline();
          setOnline(isOnlineResult);
        } else {
          // Browser fallback
          const savedTheme = localStorage.getItem('theme') as Theme;
          if (savedTheme) setTheme(savedTheme);
          const savedLang = localStorage.getItem('language');
          if (savedLang) setLanguage(savedLang);
          setOnline(navigator.onLine);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [isElectron, getSettings, autoLaunchIsEnabled, getCacheStats, isOnline]);

  // Online/offline listener for browser
  useEffect(() => {
    if (!isElectron) {
      const handleOnline = () => setOnline(true);
      const handleOffline = () => setOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [isElectron]);

  // Update available listener
  useEffect(() => {
    if (isElectron) {
      const cleanup = onUpdateAvailable((info) => {
        setMessage({ type: 'success', text: `Mise à jour ${info.version} disponible` });
      });
      return cleanup;
    }
  }, [isElectron, onUpdateAvailable]);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  // Handlers
  const handleThemeChange = async (newTheme: Theme) => {
    setTheme(newTheme);
    if (isElectron) {
      await setElectronTheme(newTheme);
      await setSetting('theme', newTheme);
    } else {
      localStorage.setItem('theme', newTheme);
      // Apply theme to document
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (newTheme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.toggle('dark', prefersDark);
      }
    }
    showFeedback('success', 'Thème mis à jour');
  };

  const handleLanguageChange = async (newLang: string) => {
    setLanguage(newLang);
    if (isElectron) {
      await setSetting('language', newLang);
    } else {
      localStorage.setItem('language', newLang);
    }
    showFeedback('success', 'Langue mise à jour');
  };

  const handleMinimizeToTrayChange = async (value: boolean) => {
    setMinimizeToTray(value);
    if (isElectron) {
      await setSetting('minimizeToTray', value);
    }
  };

  const handleStartMinimizedChange = async (value: boolean) => {
    setStartMinimized(value);
    if (isElectron) {
      await setSetting('startMinimized', value);
    }
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

  const handleAutoUpdateChange = async (value: boolean) => {
    setAutoUpdate(value);
    if (isElectron) {
      await setSetting('autoUpdate', value);
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
    } catch (error) {
      showFeedback('error', 'Erreur lors du vidage du cache');
    } finally {
      setClearingCache(false);
    }
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
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPlatformLabel = () => {
    switch (platform) {
      case 'darwin': return 'macOS';
      case 'win32': return 'Windows';
      case 'linux': return 'Linux';
      default: return 'Navigateur web';
    }
  };

  // Toggle component
  const Toggle = ({ checked, onChange, disabled = false }: { checked: boolean; onChange: (val: boolean) => void; disabled?: boolean }) => (
    <label className={`relative inline-flex items-center ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => !disabled && onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
    </label>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
          <p className="text-gray-600">Chargement des paramètres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Paramètres de l&apos;application</h1>
            <p className="text-gray-500">
              {isElectron ? 'Configurez votre application desktop' : 'Configurez votre expérience'}
            </p>
          </div>
          {/* Online status badge */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
            online ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {online ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {online ? 'En ligne' : 'Hors ligne'}
          </div>
        </div>

        {/* Feedback message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {message.text}
          </div>
        )}

        {/* ============================================ */}
        {/* APPARENCE */}
        {/* ============================================ */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5 text-teal-600" />
            Apparence
          </h2>

          {/* Theme */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Thème</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleThemeChange('light')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  theme === 'light'
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Sun className={`w-6 h-6 ${theme === 'light' ? 'text-teal-600' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${theme === 'light' ? 'text-teal-700' : 'text-gray-600'}`}>Clair</span>
              </button>
              <button
                onClick={() => handleThemeChange('dark')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  theme === 'dark'
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Moon className={`w-6 h-6 ${theme === 'dark' ? 'text-teal-600' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-teal-700' : 'text-gray-600'}`}>Sombre</span>
              </button>
              <button
                onClick={() => handleThemeChange('system')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  theme === 'system'
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Laptop className={`w-6 h-6 ${theme === 'system' ? 'text-teal-600' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${theme === 'system' ? 'text-teal-700' : 'text-gray-600'}`}>Système</span>
              </button>
            </div>
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Globe className="w-4 h-4 inline mr-2" />
              Langue
            </label>
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
          </div>
        </div>

        {/* ============================================ */}
        {/* DESKTOP - Only shown in Electron */}
        {/* ============================================ */}
        {isElectron && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Monitor className="w-5 h-5 text-teal-600" />
              Application desktop
            </h2>

            <div className="space-y-4">
              {/* Auto-launch */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Rocket className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-gray-900">Démarrage automatique</p>
                    <p className="text-sm text-gray-500">
                      Lancer l&apos;application au démarrage de {isMac ? 'macOS' : platform === 'win32' ? 'Windows' : 'Linux'}
                    </p>
                  </div>
                </div>
                <Toggle checked={autoLaunch} onChange={handleAutoLaunchToggle} />
              </div>

              {/* Minimize to tray */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <MinusCircle className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="font-medium text-gray-900">Réduire dans la barre système</p>
                    <p className="text-sm text-gray-500">
                      L&apos;application reste active en arrière-plan lors de la fermeture
                    </p>
                  </div>
                </div>
                <Toggle checked={minimizeToTray} onChange={handleMinimizeToTrayChange} />
              </div>

              {/* Start minimized */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <EyeOff className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">Démarrer en arrière-plan</p>
                    <p className="text-sm text-gray-500">
                      L&apos;application démarre minimisée dans la barre système
                    </p>
                  </div>
                </div>
                <Toggle checked={startMinimized} onChange={handleStartMinimizedChange} />
              </div>

              {/* Auto-update */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Download className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium text-gray-900">Mises à jour automatiques</p>
                    <p className="text-sm text-gray-500">
                      Télécharger et installer les mises à jour automatiquement
                    </p>
                  </div>
                </div>
                <Toggle checked={autoUpdate} onChange={handleAutoUpdateChange} />
              </div>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* CACHE - Only shown in Electron */}
        {/* ============================================ */}
        {isElectron && cacheStats && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-teal-600" />
                Cache local
              </h2>
              <span className="text-sm text-gray-500">
                Taille totale : {formatBytes(cacheStats.cacheSize)}
              </span>
            </div>

            {/* Last sync */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <RefreshCw className="w-4 h-4 inline mr-1" />
                Dernière synchronisation : {formatDate(cacheStats.lastSync)}
              </p>
            </div>

            {/* Cache items */}
            <div className="space-y-3">
              {(['appointments', 'patients', 'prescriptions', 'templates'] as const).map((type) => {
                const stat = cacheStats[type];
                const labels: Record<string, string> = {
                  appointments: 'Rendez-vous',
                  patients: 'Patients',
                  prescriptions: 'Ordonnances',
                  templates: 'Templates',
                };

                return (
                  <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <HardDrive className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{labels[type]}</p>
                        <p className="text-xs text-gray-500">
                          {stat.count} éléments
                          {stat.lastUpdated && ` · Mis à jour ${formatDate(stat.lastUpdated)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${stat.isValid ? 'bg-green-400' : 'bg-amber-400'}`} />
                      <button
                        onClick={() => handleClearCache(type)}
                        disabled={clearingCache}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        title={`Vider le cache "${labels[type]}"`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Clear all cache */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => handleClearCache()}
                disabled={clearingCache}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                {clearingCache ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Vider tout le cache
              </button>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* À PROPOS */}
        {/* ============================================ */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-teal-600" />
            À propos
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Plateforme</span>
              <span className="text-sm font-medium text-gray-900">{getPlatformLabel()}</span>
            </div>

            {isElectron && appVersion && (
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Version</span>
                <span className="text-sm font-medium text-gray-900">v{appVersion}</span>
              </div>
            )}

            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Environnement</span>
              <span className="text-sm font-medium text-gray-900">{isElectron ? 'Desktop' : 'Web'}</span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600">Statut réseau</span>
              <span className={`flex items-center gap-1.5 text-sm font-medium ${online ? 'text-green-600' : 'text-red-600'}`}>
                <span className={`w-2 h-2 rounded-full ${online ? 'bg-green-400' : 'bg-red-400'}`} />
                {online ? 'Connecté' : 'Hors ligne'}
              </span>
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* RACCOURCIS CLAVIER - Desktop only */}
        {/* ============================================ */}
        {isElectron && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-5 h-5 text-teal-600 flex items-center justify-center text-xs font-bold border border-teal-600 rounded">
                ⌘
              </span>
              Raccourcis clavier
            </h2>

            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              {[
                { keys: `${isMac ? '⌘' : 'Ctrl'}+1 à 7`, label: 'Navigation rapide' },
                { keys: `${isMac ? '⌘' : 'Ctrl'}+N`, label: 'Nouveau rendez-vous' },
                { keys: `${isMac ? '⌘' : 'Ctrl'}+⇧+N`, label: 'Nouvelle ordonnance' },
                { keys: `${isMac ? '⌘' : 'Ctrl'}+P`, label: 'Imprimer' },
                { keys: `${isMac ? '⌘' : 'Ctrl'}+⇧+E`, label: 'Exporter en PDF' },
                { keys: `${isMac ? '⌘' : 'Ctrl'}+,`, label: 'Préférences' },
                { keys: `${isMac ? '⌘' : 'Ctrl'}+F`, label: 'Rechercher' },
                { keys: `${isMac ? '⌘' : 'Ctrl'}+⇧+H`, label: 'Afficher l\'app' },
              ].map((shortcut) => (
                <div key={shortcut.label} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-gray-600">{shortcut.label}</span>
                  <kbd className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-mono rounded border border-gray-200">
                    {shortcut.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
