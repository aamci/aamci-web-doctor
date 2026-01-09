'use client';

import { useState, useEffect } from 'react';
import { Settings, Calendar, Check } from 'lucide-react';

interface Preference {
  id: string;
  ownerId: string;
  ownerType: string;
  name: string;
  description?: string;
  isDefault: boolean;
  daysOfWeek: number[];
  startHour: number;
  endHour: number;
  slotDurationMins: number;
  capacity: number;
  excludedTimes: string[];
}

interface Props {
  doctorId: string;
}

export default function DoctorPreferences({ doctorId }: Props) {
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

  useEffect(() => {
    fetchPreferences();
  }, [doctorId]);

  const fetchPreferences = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/availability-preferences`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Filter preferences for this doctor
        const doctorPreferences = data.filter((p: Preference) => p.ownerId === doctorId);
        setPreferences(doctorPreferences);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDayNames = (days: number[]) => {
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return days.sort().map((d) => dayNames[d]).join(', ');
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-900 mb-1">Préférences du médecin</h4>
            <p className="text-sm text-blue-700">
              Vous consultez les préférences de disponibilité configurées par ce médecin.
              Ces templates peuvent être appliqués pour générer rapidement des règles de disponibilité.
            </p>
          </div>
        </div>
      </div>

      {/* Preferences List */}
      {preferences.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <Settings className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">Ce médecin n'a pas encore configuré de préférences</p>
          <p className="text-sm text-gray-500 mt-1">
            Les préférences permettent de sauvegarder des configurations réutilisables
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {preferences.map((preference) => (
            <div
              key={preference.id}
              className={`bg-white border-2 rounded-lg p-6 ${
                preference.isDefault ? 'border-teal-500' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{preference.name}</h3>
                    {preference.isDefault && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-teal-100 text-teal-700 text-sm font-medium rounded-full">
                        <Check className="w-4 h-4" />
                        Par défaut
                      </span>
                    )}
                  </div>
                  {preference.description && (
                    <p className="text-gray-600">{preference.description}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Jours:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {getDayNames(preference.daysOfWeek)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Horaires:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {preference.startHour}h - {preference.endHour}h
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Durée créneau:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {preference.slotDurationMins} min
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Capacité:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {preference.capacity} patient{preference.capacity > 1 ? 's' : ''}
                  </span>
                </div>
                {preference.excludedTimes.length > 0 && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Exclusions:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {preference.excludedTimes.join(', ')}
                    </span>
                  </div>
                )}
              </div>

              {preference.ownerType === 'DOCTOR' && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Créée par le médecin • Template réutilisable
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info about managing preferences */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-amber-900 mb-1">Note</h4>
            <p className="text-sm text-amber-700">
              Seul le médecin peut créer, modifier ou supprimer ses préférences.
              En tant que gestionnaire, vous pouvez uniquement les consulter.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
