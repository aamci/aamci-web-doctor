'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Settings, User, Bell, CheckCircle, Monitor, Calendar, BellRing, Clock, Stethoscope, ChevronRight, Laptop, CalendarClock } from 'lucide-react';

interface DoctorProfile {
  id: string;
  specialty: string | null;
  hospitalType: string | null;
  address: string | null;
  city: string | null;
  presentation: string | null;
  formations: string | null;
  experiences: string | null;
  autoConfirmPatientBookings: boolean;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/doctor-profiles/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      } else if (response.status === 404) {
        // Profil n'existe pas encore, créer un profil vide
        setProfile({
          id: '',
          specialty: null,
          hospitalType: null,
          address: null,
          city: null,
          presentation: null,
          formations: null,
          experiences: null,
          autoConfirmPatientBookings: true,
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<DoctorProfile>) => {
    setSaving(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/doctor-profiles/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        setMessage({ type: 'success', text: 'Paramètres enregistrés avec succès' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
    } finally {
      setSaving(false);
    }
  };

  const handleAutoConfirmChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    if (profile) {
      setProfile({ ...profile, autoConfirmPatientBookings: newValue });
      await updateProfile({ autoConfirmPatientBookings: newValue });
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-3xl">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gérez les paramètres de votre compte et de vos rendez-vous
        </p>
      </div>

        {/* Navigation sous-pages */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
          {[
            { href: '/settings/notifications', label: 'Notifications', icon: <BellRing className="w-5 h-5" />, color: 'text-blue-500' },
            { href: '/settings/consultation-types', label: 'Types de consultation', icon: <Stethoscope className="w-5 h-5" />, color: 'text-purple-500' },
            { href: '/settings/agenda', label: 'Agenda', icon: <Calendar className="w-5 h-5" />, color: 'text-green-500' },
            { href: '/settings/absences', label: 'Absences', icon: <Clock className="w-5 h-5" />, color: 'text-orange-500' },
            { href: '/settings/calendar-sync', label: 'Calendrier externe', icon: <Monitor className="w-5 h-5" />, color: 'text-indigo-500' },
            { href: '/settings/application', label: 'Application', icon: <Laptop className="w-5 h-5" />, color: 'text-teal-500' },
            { href: '/availability', label: 'Disponibilités', icon: <CalendarClock className="w-5 h-5" />, color: 'text-teal-600' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href as any}
              className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-teal-300 hover:shadow-sm transition-all group"
            >
              <span className={item.color}>{item.icon}</span>
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 flex-1">{item.label}</span>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-teal-500 transition-colors" />
            </Link>
          ))}
        </div>

        {/* Message de feedback */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.type === 'success' && <CheckCircle className="w-5 h-5" />}
            {message.text}
          </div>
        )}

        {/* Section Rendez-vous */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-6 h-6 text-teal-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Paramètres des rendez-vous
            </h2>
          </div>

          <div className="space-y-6">
            {/* Confirmation automatique */}
            <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1 pr-4">
                <h3 className="font-medium text-gray-900 mb-1">
                  Confirmation automatique des rendez-vous patients
                </h3>
                <p className="text-sm text-gray-600">
                  Lorsque cette option est activée, les rendez-vous pris par les patients sont
                  automatiquement confirmés. Sinon, ils restent en attente de votre validation.
                </p>
                <div className="mt-3 text-sm">
                  <div className="flex items-center gap-2 text-green-700">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>
                      <strong>Activé :</strong> Les patients reçoivent une confirmation immédiate
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-amber-700 mt-1">
                    <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                    <span>
                      <strong>Désactivé :</strong> Vous devez valider chaque demande manuellement
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile?.autoConfirmPatientBookings ?? true}
                    onChange={handleAutoConfirmChange}
                    disabled={saving}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>
            </div>

            {/* Statut actuel */}
            <div
              className={`p-4 rounded-lg border ${
                profile?.autoConfirmPatientBookings
                  ? 'bg-green-50 border-green-200'
                  : 'bg-amber-50 border-amber-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-medium ${
                    profile?.autoConfirmPatientBookings ? 'text-green-800' : 'text-amber-800'
                  }`}
                >
                  Statut actuel :
                </span>
                <span
                  className={`text-sm ${
                    profile?.autoConfirmPatientBookings ? 'text-green-700' : 'text-amber-700'
                  }`}
                >
                  {profile?.autoConfirmPatientBookings
                    ? 'Les rendez-vous patients sont confirmés automatiquement'
                    : 'Les rendez-vous patients nécessitent votre validation'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section Profil (informations de base) */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-6 h-6 text-teal-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Informations du profil
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Spécialité
              </label>
              <input
                type="text"
                value={profile?.specialty || ''}
                onChange={(e) =>
                  setProfile(profile ? { ...profile, specialty: e.target.value } : null)
                }
                onBlur={() => profile && updateProfile({ specialty: profile.specialty })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="Ex: Médecine générale"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type d'établissement
              </label>
              <select
                value={profile?.hospitalType || ''}
                onChange={(e) => {
                  const newValue = e.target.value || null;
                  setProfile(profile ? { ...profile, hospitalType: newValue } : null);
                  if (profile) updateProfile({ hospitalType: newValue });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="">Sélectionner...</option>
                <option value="Cabinet privé">Cabinet privé</option>
                <option value="Clinique">Clinique</option>
                <option value="CHU">CHU</option>
                <option value="Hôpital">Hôpital</option>
                <option value="Centre de santé">Centre de santé</option>
                <option value="Polyclinique">Polyclinique</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ville
              </label>
              <input
                type="text"
                value={profile?.city || ''}
                onChange={(e) =>
                  setProfile(profile ? { ...profile, city: e.target.value } : null)
                }
                onBlur={() => profile && updateProfile({ city: profile.city })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="Ex: Paris"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresse
              </label>
              <input
                type="text"
                value={profile?.address || ''}
                onChange={(e) =>
                  setProfile(profile ? { ...profile, address: e.target.value } : null)
                }
                onBlur={() => profile && updateProfile({ address: profile.address })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="Ex: 123 Rue de la Santé"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Présentation
              </label>
              <textarea
                value={profile?.presentation || ''}
                onChange={(e) =>
                  setProfile(profile ? { ...profile, presentation: e.target.value } : null)
                }
                onBlur={() => profile && updateProfile({ presentation: profile.presentation })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                rows={3}
                placeholder="Décrivez brièvement votre pratique..."
              />
            </div>
          </div>
        </div>

        {/* Note informative */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note :</strong> Les rendez-vous que vous créez directement pour vos patients
            sont toujours confirmés automatiquement, indépendamment de ce paramètre.
          </p>
        </div>
      </div>
  );
}
