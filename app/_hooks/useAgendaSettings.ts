'use client';

import { useState, useEffect } from 'react';

export interface AgendaSettings {
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

export function useAgendaSettings() {
  const [settings, setSettings] = useState<AgendaSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load initial settings
    const loadSettings = () => {
      const savedSettings = localStorage.getItem('agendaSettings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        } catch (e) {
          console.error('Error parsing agenda settings:', e);
        }
      }
      setIsLoaded(true);
    };

    loadSettings();

    // Listen for settings changes from other components/tabs
    const handleSettingsChange = (event: CustomEvent<AgendaSettings>) => {
      setSettings(event.detail);
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'agendaSettings' && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue);
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        } catch (e) {
          console.error('Error parsing agenda settings from storage:', e);
        }
      }
    };

    window.addEventListener('agendaSettingsChanged', handleSettingsChange as EventListener);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('agendaSettingsChanged', handleSettingsChange as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Helper to get start hour as number
  const getStartHour = () => {
    return parseInt(settings.displayStartHour.split(':')[0]) || 7;
  };

  // Helper to get end hour as number
  const getEndHour = () => {
    return parseInt(settings.displayEndHour.split(':')[0]) || 19;
  };

  // Helper to get hours array based on settings
  const getDisplayHours = () => {
    const start = getStartHour();
    const end = getEndHour();
    return Array.from({ length: end - start }, (_, i) => start + i);
  };

  // Helper to get cell height based on zoom level
  const getCellHeight = () => {
    // Minimum: 40px, Maximum: 100px
    const minHeight = 40;
    const maxHeight = 100;
    return minHeight + (settings.zoomLevel / 100) * (maxHeight - minHeight);
  };

  // Helper to get mouse precision in minutes
  const getMousePrecisionMinutes = () => {
    if (settings.mousePrecision === 'default') return null;
    return parseInt(settings.mousePrecision) || null;
  };

  return {
    settings,
    isLoaded,
    getStartHour,
    getEndHour,
    getDisplayHours,
    getCellHeight,
    getMousePrecisionMinutes,
  };
}

export default useAgendaSettings;
