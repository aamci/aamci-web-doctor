'use client';

import { useState, useEffect } from 'react';
import { Plus, Settings, Check, Calendar, Trash2, Edit } from 'lucide-react';
import { toast } from '@/lib/toast';
import PreferenceForm from './_components/PreferenceForm';
import ApplyPreferenceModal from './_components/ApplyPreferenceModal';

interface Preference {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  daysOfWeek: number[];
  startHour: number;
  endHour: number;
  slotDurationMins: number;
  capacity: number;
  allowedKindIds: string[];
  excludedTimes: string[];
  minBookingNotice?: number;
  maxBookingAdvance?: number;
  autoConfirm: boolean;
  allowCancellation: boolean;
  cancellationDeadline?: number;
  createdAt: string;
  updatedAt: string;
}

export default function PreferencesPage() {
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPreference, setEditingPreference] = useState<Preference | null>(null);
  const [applyingPreference, setApplyingPreference] = useState<Preference | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

  useEffect(() => {
    fetchPreferences();
  }, []);

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
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = () => {
    setShowForm(false);
    setEditingPreference(null);
    fetchPreferences();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette préférence ?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/availability-preferences/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchPreferences();
      }
    } catch (error) {
      console.error('Error deleting preference:', error);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/availability-preferences/${id}/set-default`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchPreferences();
      }
    } catch (error) {
      console.error('Error setting default:', error);
    }
  };

  const getDayNames = (days: number[]) => {
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return days.sort().map(d => dayNames[d]).join(', ');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-40 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Settings className="w-8 h-8 text-teal-600" />
                Préférences de disponibilité
              </h1>
              <p className="text-gray-600 mt-2">
                Créez jusqu'à 3 configurations réutilisables pour vos horaires de consultation
              </p>
            </div>
            {preferences.length < 3 && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Nouvelle préférence
              </button>
            )}
          </div>
        </div>

        {/* Liste des préférences */}
        {preferences.length === 0 ? (
          <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Aucune préférence configurée
            </h3>
            <p className="text-gray-600 mb-6">
              Créez votre première configuration pour gagner du temps lors de la gestion de vos disponibilités
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Créer une préférence
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {preferences.map((preference) => (
              <div
                key={preference.id}
                className={`bg-white rounded-lg shadow-sm border-2 ${
                  preference.isDefault ? 'border-teal-500' : 'border-gray-200'
                } p-6 hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {preference.name}
                      </h3>
                      {preference.isDefault && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-teal-100 text-teal-700 text-sm font-medium rounded-full">
                          <Check className="w-4 h-4" />
                          Par défaut
                        </span>
                      )}
                    </div>
                    {preference.description && (
                      <p className="text-gray-600 mb-4">{preference.description}</p>
                    )}

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
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => setApplyingPreference(preference)}
                      className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm"
                    >
                      <Calendar className="w-4 h-4" />
                      Appliquer
                    </button>
                    <button
                      onClick={() => {
                        setEditingPreference(preference);
                        setShowForm(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      Modifier
                    </button>
                    {!preference.isDefault && (
                      <button
                        onClick={() => handleSetDefault(preference.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                      >
                        <Check className="w-4 h-4" />
                        Défaut
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(preference.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Limite atteinte */}
        {preferences.length >= 3 && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              ℹ️ Vous avez atteint la limite de 3 préférences. Supprimez-en une pour en créer une nouvelle.
            </p>
          </div>
        )}
      </div>

      {/* Modal formulaire */}
      {showForm && (
        <PreferenceForm
          preference={editingPreference}
          onClose={() => {
            setShowForm(false);
            setEditingPreference(null);
          }}
          onSuccess={handleCreateOrUpdate}
        />
      )}

      {/* Modal appliquer préférence */}
      {applyingPreference && (
        <ApplyPreferenceModal
          preference={applyingPreference}
          onClose={() => setApplyingPreference(null)}
          onSuccess={() => {
            setApplyingPreference(null);
            toast.success('Disponibilités générées avec succès!');
          }}
        />
      )}
    </div>
  );
}
