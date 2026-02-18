'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../_providers/AuthProvider';
import {
  Bell,
  BellOff,
  Mail,
  Smartphone,
  Monitor,
  Calendar,
  CreditCard,
  User,
  AlertTriangle,
  Settings,
  Save,
  ArrowLeft,
  RefreshCw,
  Check,
  Volume2,
  VolumeX,
  Clock,
  MessageSquare,
  Pill,
  FileText,
} from 'lucide-react';

interface NotificationChannel {
  email: boolean;
  push: boolean;
  inApp: boolean;
}

interface NotificationPreferences {
  // Global settings
  globalEnabled: boolean;
  soundEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;

  // By category
  appointments: NotificationChannel & {
    reminders: boolean;
    reminderTiming: number; // hours before
  };
  payments: NotificationChannel;
  patients: NotificationChannel;
  prescriptions: NotificationChannel;
  messages: NotificationChannel;
  system: NotificationChannel;
}

const defaultPreferences: NotificationPreferences = {
  globalEnabled: true,
  soundEnabled: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',

  appointments: {
    email: true,
    push: true,
    inApp: true,
    reminders: true,
    reminderTiming: 24,
  },
  payments: {
    email: true,
    push: false,
    inApp: true,
  },
  patients: {
    email: false,
    push: true,
    inApp: true,
  },
  prescriptions: {
    email: true,
    push: true,
    inApp: true,
  },
  messages: {
    email: false,
    push: true,
    inApp: true,
  },
  system: {
    email: false,
    push: false,
    inApp: true,
  },
};

export default function NotificationPreferencesPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

  const authedFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${apiBaseUrl}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }, [apiBaseUrl]);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const data = await authedFetch('/users/notification-preferences');
        setPreferences({ ...defaultPreferences, ...data });
      } catch (error) {
        console.error('Error loading preferences:', error);
        // Load from localStorage as fallback
        const saved = localStorage.getItem('notification_preferences');
        if (saved) {
          setPreferences({ ...defaultPreferences, ...JSON.parse(saved) });
        }
      } finally {
        setLoading(false);
      }
    };
    loadPreferences();
  }, [authedFetch]);

  const updatePreference = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
    setSaved(false);
  };

  const updateChannelPreference = (
    category: 'appointments' | 'payments' | 'patients' | 'prescriptions' | 'messages' | 'system',
    channel: keyof NotificationChannel,
    value: boolean
  ) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [channel]: value,
      },
    }));
    setHasChanges(true);
    setSaved(false);
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      await authedFetch('/users/notification-preferences', {
        method: 'PATCH',
        body: JSON.stringify(preferences),
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
    // Always save to localStorage as backup
    localStorage.setItem('notification_preferences', JSON.stringify(preferences));
    setSaving(false);
    setSaved(true);
    setHasChanges(false);
  };

  const resetToDefaults = () => {
    setPreferences(defaultPreferences);
    setHasChanges(true);
    setSaved(false);
  };

  const categories = [
    {
      id: 'appointments' as const,
      label: 'Rendez-vous',
      description: 'Confirmations, rappels, annulations',
      icon: <Calendar className="w-5 h-5 text-blue-500" />,
      hasReminders: true,
    },
    {
      id: 'payments' as const,
      label: 'Paiements',
      description: 'Paiements reçus, remboursements',
      icon: <CreditCard className="w-5 h-5 text-green-500" />,
    },
    {
      id: 'patients' as const,
      label: 'Patients',
      description: 'Nouveaux patients, mises à jour profil',
      icon: <User className="w-5 h-5 text-purple-500" />,
    },
    {
      id: 'prescriptions' as const,
      label: 'Ordonnances',
      description: 'Expirations, renouvellements',
      icon: <Pill className="w-5 h-5 text-orange-500" />,
    },
    {
      id: 'messages' as const,
      label: 'Messages',
      description: 'Nouveaux messages, réponses',
      icon: <MessageSquare className="w-5 h-5 text-teal-500" />,
    },
    {
      id: 'system' as const,
      label: 'Système',
      description: 'Mises à jour, maintenance',
      icon: <Settings className="w-5 h-5 text-gray-500" />,
    },
  ];

  const reminderOptions = [
    { value: 1, label: '1 heure avant' },
    { value: 2, label: '2 heures avant' },
    { value: 4, label: '4 heures avant' },
    { value: 12, label: '12 heures avant' },
    { value: 24, label: '24 heures avant' },
    { value: 48, label: '48 heures avant' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
          <p className="text-gray-600">Chargement des préférences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Préférences de notification</h1>
              <p className="text-gray-500">Gérez comment et quand vous recevez des notifications</p>
            </div>
          </div>
          <button
            onClick={savePreferences}
            disabled={!hasChanges || saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              hasChanges && !saving
                ? 'bg-teal-600 text-white hover:bg-teal-700'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <Check className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Enregistrement...' : saved ? 'Enregistré' : 'Enregistrer'}
          </button>
        </div>

        {/* Global Settings */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-teal-600" />
            Paramètres généraux
          </h2>

          <div className="space-y-4">
            {/* Global Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {preferences.globalEnabled ? (
                  <Bell className="w-5 h-5 text-teal-600" />
                ) : (
                  <BellOff className="w-5 h-5 text-gray-400" />
                )}
                <div>
                  <p className="font-medium text-gray-900">Notifications activées</p>
                  <p className="text-sm text-gray-500">Recevoir toutes les notifications</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.globalEnabled}
                  onChange={e => updatePreference('globalEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
              </label>
            </div>

            {preferences.globalEnabled && (
              <>
                {/* Sound Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {preferences.soundEnabled ? (
                      <Volume2 className="w-5 h-5 text-blue-500" />
                    ) : (
                      <VolumeX className="w-5 h-5 text-gray-400" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">Sons de notification</p>
                      <p className="text-sm text-gray-500">Jouer un son à la réception</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.soundEnabled}
                      onChange={e => updatePreference('soundEnabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                  </label>
                </div>

                {/* Quiet Hours */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-purple-500" />
                      <div>
                        <p className="font-medium text-gray-900">Heures calmes</p>
                        <p className="text-sm text-gray-500">Désactiver les notifications pendant certaines heures</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.quietHoursEnabled}
                        onChange={e => updatePreference('quietHoursEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                    </label>
                  </div>

                  {preferences.quietHoursEnabled && (
                    <div className="flex items-center gap-4 mt-3 pl-8">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">De</label>
                        <input
                          type="time"
                          value={preferences.quietHoursStart}
                          onChange={e => updatePreference('quietHoursStart', e.target.value)}
                          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <span className="text-gray-400 mt-5">→</span>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">À</label>
                        <input
                          type="time"
                          value={preferences.quietHoursEnd}
                          onChange={e => updatePreference('quietHoursEnd', e.target.value)}
                          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Category Settings */}
        {preferences.globalEnabled && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                Notifications par catégorie
              </h2>
              <p className="text-sm text-gray-500 mt-1">Choisissez les canaux pour chaque type de notification</p>
            </div>

            {/* Channel Headers */}
            <div className="grid grid-cols-[1fr_80px_80px_80px] gap-2 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500">
              <div>Catégorie</div>
              <div className="text-center flex items-center justify-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                Email
              </div>
              <div className="text-center flex items-center justify-center gap-1">
                <Smartphone className="w-3.5 h-3.5" />
                Push
              </div>
              <div className="text-center flex items-center justify-center gap-1">
                <Monitor className="w-3.5 h-3.5" />
                App
              </div>
            </div>

            {/* Categories */}
            <div className="divide-y divide-gray-100">
              {categories.map(category => (
                <div key={category.id} className="p-4">
                  <div className="grid grid-cols-[1fr_80px_80px_80px] gap-2 items-center">
                    <div className="flex items-center gap-3">
                      {category.icon}
                      <div>
                        <p className="font-medium text-gray-900">{category.label}</p>
                        <p className="text-xs text-gray-500">{category.description}</p>
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <input
                        type="checkbox"
                        checked={preferences[category.id].email}
                        onChange={e => updateChannelPreference(category.id, 'email', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                    </div>
                    <div className="flex justify-center">
                      <input
                        type="checkbox"
                        checked={preferences[category.id].push}
                        onChange={e => updateChannelPreference(category.id, 'push', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                    </div>
                    <div className="flex justify-center">
                      <input
                        type="checkbox"
                        checked={preferences[category.id].inApp}
                        onChange={e => updateChannelPreference(category.id, 'inApp', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  {/* Appointment Reminders */}
                  {category.hasReminders && category.id === 'appointments' && (
                    <div className="mt-4 ml-8 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-medium text-gray-700">Rappels automatiques</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferences.appointments.reminders}
                            onChange={e => setPreferences(prev => ({
                              ...prev,
                              appointments: { ...prev.appointments, reminders: e.target.checked }
                            }))}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                        </label>
                      </div>
                      {preferences.appointments.reminders && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Envoyer</span>
                          <select
                            value={preferences.appointments.reminderTiming}
                            onChange={e => {
                              setPreferences(prev => ({
                                ...prev,
                                appointments: { ...prev.appointments, reminderTiming: Number(e.target.value) }
                              }));
                              setHasChanges(true);
                            }}
                            className="px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {reminderOptions.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reset Button */}
        <div className="flex justify-end">
          <button
            onClick={resetToDefaults}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Réinitialiser par défaut
          </button>
        </div>
      </div>
    </div>
  );
}
