'use client';

import { useCallback, useEffect, useState } from 'react';

// Types for the Electron API
interface CacheResult<T = unknown> {
  data: T | null;
  isValid: boolean;
  isOnline: boolean;
}

interface CacheStats {
  appointments: { count: number; isValid: boolean; lastUpdated: string | null };
  patients: { count: number; isValid: boolean; lastUpdated: string | null };
  prescriptions: { count: number; isValid: boolean; lastUpdated: string | null };
  templates: { count: number; isValid: boolean; lastUpdated: string | null };
  isOnline: boolean;
  lastSync: string | null;
  cacheSize: number;
}

interface AutoLaunchResult {
  success: boolean;
  error?: string;
  enabled?: boolean;
}

interface UpdateInfo {
  version: string;
  releaseDate?: string;
  releaseNotes?: string;
}

interface AppSettings {
  windowBounds: { width: number; height: number };
  windowPosition: { x: number; y: number } | null;
  apiUrl: string;
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  autoUpdate: boolean;
  language: string;
  minimizeToTray: boolean;
  startMinimized: boolean;
  autoLaunch: boolean;
  lastSync: string | null;
  cachedUser: unknown;
}

type CacheType = 'appointments' | 'patients' | 'prescriptions' | 'templates';
type Theme = 'light' | 'dark' | 'system';

interface ElectronAPI {
  isElectron: true;
  getAppVersion: () => Promise<string>;
  getPlatform: () => Promise<'darwin' | 'win32' | 'linux'>;
  getSettings: () => Promise<AppSettings>;
  setSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<boolean>;
  getTheme: () => Promise<'light' | 'dark'>;
  setTheme: (theme: Theme) => Promise<boolean>;
  showNotification: (title: string, body: string, options?: { silent?: boolean }) => Promise<boolean>;
  openExternal: (url: string) => Promise<void>;
  printPage: () => Promise<void>;
  exportPDF: () => Promise<void>;
  setBadgeCount: (count: number) => Promise<boolean>;
  flashFrame: () => Promise<void>;
  onUpdateAvailable: (callback: (info: UpdateInfo) => void) => void;
  onUpdateDownloaded: (callback: (info: UpdateInfo) => void) => void;
  onThemeChanged: (callback: (theme: Theme) => void) => void;
  onTriggerSearch: (callback: () => void) => void;
  onSystemResumed: (callback: () => void) => void;
  removeAllListeners: (channel: string) => void;
  isMac: () => boolean;
  isWindows: () => boolean;
  isLinux: () => boolean;
  cacheGet: <T = unknown>(type: CacheType) => Promise<CacheResult<T>>;
  cacheSet: (type: CacheType, data: unknown) => Promise<boolean>;
  cacheClear: (type?: CacheType) => Promise<boolean>;
  getCacheStats: () => Promise<CacheStats>;
  isOnline: () => Promise<boolean>;
  getPendingChanges: () => Promise<unknown>;
  saveOffline: <T>(type: CacheType, item: T) => Promise<T>;
  removeOffline: (type: CacheType, itemId: string) => Promise<boolean>;
  syncComplete: <T>(type: CacheType, serverData: T[]) => Promise<T[]>;
  getLastSync: () => Promise<string | null>;
  autoLaunchEnable: () => Promise<AutoLaunchResult>;
  autoLaunchDisable: () => Promise<AutoLaunchResult>;
  autoLaunchIsEnabled: () => Promise<AutoLaunchResult>;
  autoLaunchToggle: () => Promise<AutoLaunchResult>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

/**
 * Hook to safely interact with Electron API
 * Returns null for all functions when running in browser
 */
export function useElectron() {
  const [isElectron, setIsElectron] = useState(false);
  const [platform, setPlatform] = useState<'darwin' | 'win32' | 'linux' | 'web'>('web');
  const [appVersion, setAppVersion] = useState<string | null>(null);

  useEffect(() => {
    const checkElectron = async () => {
      if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
        setIsElectron(true);

        try {
          const [platformResult, version] = await Promise.all([
            window.electronAPI.getPlatform(),
            window.electronAPI.getAppVersion(),
          ]);
          setPlatform(platformResult);
          setAppVersion(version);
        } catch (error) {
          console.error('Failed to get Electron info:', error);
        }
      }
    };

    checkElectron();
  }, []);

  const api = typeof window !== 'undefined' ? window.electronAPI : undefined;

  // ============================================
  // NOTIFICATIONS
  // ============================================

  const showNotification = useCallback(
    async (title: string, body: string, options?: { silent?: boolean }) => {
      if (!api) {
        // Fallback to browser notifications
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(title, { body, silent: options?.silent });
          return true;
        }
        return false;
      }
      return api.showNotification(title, body, options);
    },
    [api]
  );

  // ============================================
  // THEME
  // ============================================

  const getTheme = useCallback(async (): Promise<'light' | 'dark'> => {
    if (!api) {
      // Fallback to browser preference
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return api.getTheme();
  }, [api]);

  const setTheme = useCallback(
    async (theme: Theme) => {
      if (!api) {
        // Store in localStorage as fallback
        localStorage.setItem('theme', theme);
        return true;
      }
      return api.setTheme(theme);
    },
    [api]
  );

  // ============================================
  // PRINTING
  // ============================================

  const printPage = useCallback(async () => {
    if (!api) {
      // Fallback to browser print
      window.print();
      return;
    }
    return api.printPage();
  }, [api]);

  const exportPDF = useCallback(async () => {
    if (!api) {
      // No browser fallback for PDF export
      console.warn('PDF export is only available in the desktop app');
      return;
    }
    return api.exportPDF();
  }, [api]);

  // ============================================
  // EXTERNAL LINKS
  // ============================================

  const openExternal = useCallback(
    async (url: string) => {
      if (!api) {
        // Fallback to window.open
        window.open(url, '_blank', 'noopener,noreferrer');
        return;
      }
      return api.openExternal(url);
    },
    [api]
  );

  // ============================================
  // CACHE (Desktop only)
  // ============================================

  const cacheGet = useCallback(
    async <T = unknown>(type: CacheType): Promise<CacheResult<T> | null> => {
      if (!api) return null;
      return api.cacheGet<T>(type);
    },
    [api]
  );

  const cacheSet = useCallback(
    async (type: CacheType, data: unknown) => {
      if (!api) return false;
      return api.cacheSet(type, data);
    },
    [api]
  );

  const cacheClear = useCallback(
    async (type?: CacheType) => {
      if (!api) return false;
      return api.cacheClear(type);
    },
    [api]
  );

  const getCacheStats = useCallback(async (): Promise<CacheStats | null> => {
    if (!api) return null;
    return api.getCacheStats();
  }, [api]);

  const isOnline = useCallback(async (): Promise<boolean> => {
    if (!api) {
      return navigator.onLine;
    }
    return api.isOnline();
  }, [api]);

  // ============================================
  // AUTO-LAUNCH (Desktop only)
  // ============================================

  const autoLaunchEnable = useCallback(async (): Promise<AutoLaunchResult | null> => {
    if (!api) return null;
    return api.autoLaunchEnable();
  }, [api]);

  const autoLaunchDisable = useCallback(async (): Promise<AutoLaunchResult | null> => {
    if (!api) return null;
    return api.autoLaunchDisable();
  }, [api]);

  const autoLaunchIsEnabled = useCallback(async (): Promise<AutoLaunchResult | null> => {
    if (!api) return null;
    return api.autoLaunchIsEnabled();
  }, [api]);

  const autoLaunchToggle = useCallback(async (): Promise<AutoLaunchResult | null> => {
    if (!api) return null;
    return api.autoLaunchToggle();
  }, [api]);

  // ============================================
  // SETTINGS (Desktop only)
  // ============================================

  const getSettings = useCallback(async (): Promise<AppSettings | null> => {
    if (!api) return null;
    return api.getSettings();
  }, [api]);

  const setSetting = useCallback(
    async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      if (!api) return false;
      return api.setSetting(key, value);
    },
    [api]
  );

  // ============================================
  // WINDOW CONTROLS (Desktop only)
  // ============================================

  const setBadgeCount = useCallback(
    async (count: number) => {
      if (!api) return false;
      return api.setBadgeCount(count);
    },
    [api]
  );

  const flashFrame = useCallback(async () => {
    if (!api) return;
    return api.flashFrame();
  }, [api]);

  // ============================================
  // EVENT LISTENERS
  // ============================================

  const onThemeChanged = useCallback(
    (callback: (theme: Theme) => void) => {
      if (!api) return () => {};
      api.onThemeChanged(callback);
      return () => api.removeAllListeners('theme-changed');
    },
    [api]
  );

  const onTriggerSearch = useCallback(
    (callback: () => void) => {
      if (!api) return () => {};
      api.onTriggerSearch(callback);
      return () => api.removeAllListeners('trigger-search');
    },
    [api]
  );

  const onSystemResumed = useCallback(
    (callback: () => void) => {
      if (!api) return () => {};
      api.onSystemResumed(callback);
      return () => api.removeAllListeners('system-resumed');
    },
    [api]
  );

  const onUpdateAvailable = useCallback(
    (callback: (info: UpdateInfo) => void) => {
      if (!api) return () => {};
      api.onUpdateAvailable(callback);
      return () => api.removeAllListeners('update-available');
    },
    [api]
  );

  const onUpdateDownloaded = useCallback(
    (callback: (info: UpdateInfo) => void) => {
      if (!api) return () => {};
      api.onUpdateDownloaded(callback);
      return () => api.removeAllListeners('update-downloaded');
    },
    [api]
  );

  return {
    // State
    isElectron,
    platform,
    appVersion,
    isMac: platform === 'darwin',
    isWindows: platform === 'win32',
    isLinux: platform === 'linux',

    // Notifications
    showNotification,

    // Theme
    getTheme,
    setTheme,

    // Printing
    printPage,
    exportPDF,

    // External links
    openExternal,

    // Cache
    cacheGet,
    cacheSet,
    cacheClear,
    getCacheStats,
    isOnline,

    // Auto-launch
    autoLaunchEnable,
    autoLaunchDisable,
    autoLaunchIsEnabled,
    autoLaunchToggle,

    // Settings
    getSettings,
    setSetting,

    // Window controls
    setBadgeCount,
    flashFrame,

    // Event listeners (return cleanup functions)
    onThemeChanged,
    onTriggerSearch,
    onSystemResumed,
    onUpdateAvailable,
    onUpdateDownloaded,
  };
}

/**
 * Simple check to see if running in Electron
 */
export function isRunningInElectron(): boolean {
  return typeof window !== 'undefined' && !!window.electronAPI?.isElectron;
}

/**
 * Get the platform we're running on
 */
export function getRunningPlatform(): 'darwin' | 'win32' | 'linux' | 'web' {
  if (typeof window === 'undefined') return 'web';
  if (!window.electronAPI?.isElectron) return 'web';

  if (window.electronAPI.isMac()) return 'darwin';
  if (window.electronAPI.isWindows()) return 'win32';
  if (window.electronAPI.isLinux()) return 'linux';

  return 'web';
}
