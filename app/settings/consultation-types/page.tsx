'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { required, minLen, maxLen, positiveNumber, hasErrors, type FormErrors } from '@/lib/validation';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Video,
  Clock,
  Palette,
  Check,
  X,
} from 'lucide-react';
import { useAuth } from '../../_providers/AuthProvider';

interface AppointmentKind {
  id: string;
  name: string;
  description: string | null;
  isTelemedicine: boolean;
  durationMins: number;
  color: string | null;
  doctorId: string | null;
}

const PRESET_COLORS = [
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#f97316', // Orange
  '#10b981', // Green
  '#06b6d4', // Cyan
  '#f59e0b', // Amber
  '#ef4444', // Red
];

export default function ConsultationTypesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [kinds, setKinds] = useState<AppointmentKind[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKind, setEditingKind] = useState<AppointmentKind | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FormErrors<'name' | 'description' | 'durationMins'>>({});

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isTelemedicine: false,
    durationMins: 30,
    color: PRESET_COLORS[0],
  });

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3002';

  useEffect(() => {
    fetchKinds();
  }, []);

  const fetchKinds = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/appointment-kinds`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setKinds(data);
      }
    } catch (error) {
      console.error('Error fetching kinds:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingKind(null);
    setFieldErrors({});
    setFormData({
      name: '',
      description: '',
      isTelemedicine: false,
      durationMins: 30,
      color: PRESET_COLORS[0],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (kind: AppointmentKind) => {
    setEditingKind(kind);
    setFieldErrors({});
    setFormData({
      name: kind.name,
      description: kind.description || '',
      isTelemedicine: kind.isTelemedicine,
      durationMins: kind.durationMins,
      color: kind.color || PRESET_COLORS[0],
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: typeof fieldErrors = {
      name: required(formData.name, 'Nom') ?? minLen(formData.name, 2, 'Nom') ?? maxLen(formData.name, 100, 'Nom'),
      description: formData.description ? maxLen(formData.description, 300, 'Description') : null,
      durationMins: positiveNumber(formData.durationMins, 'Durée'),
    };
    setFieldErrors(errors);
    if (hasErrors(errors)) return;
    const token = localStorage.getItem('token');

    try {
      if (editingKind) {
        // Update
        await fetch(`${API_BASE_URL}/appointment-kinds/${editingKind.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });
      } else {
        // Create
        await fetch(`${API_BASE_URL}/appointment-kinds`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });
      }

      setIsModalOpen(false);
      fetchKinds();
    } catch (error) {
      console.error('Error saving kind:', error);
    }
  };

  const handleDelete = async (kindId: string) => {
    if (!confirm('Supprimer ce type de consultation ?')) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/appointment-kinds/${kindId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchKinds();
    } catch (error) {
      console.error('Error deleting kind:', error);
    }
  };

  // Separate global and personal kinds
  const globalKinds = kinds.filter((k) => !k.doctorId);
  const personalKinds = kinds.filter((k) => k.doctorId);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Types de consultations</h1>
            <p className="text-gray-600 text-sm">
              Gérez vos types de rendez-vous et téléconsultations
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Nouveau type
          </button>
        </div>

        {/* Personal Kinds */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Mes types de consultations</h2>
            <p className="text-sm text-gray-500">Types personnalisés pour votre pratique</p>
          </div>

          {personalKinds.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>Aucun type personnalisé</p>
              <button
                onClick={openCreateModal}
                className="mt-2 text-teal-600 hover:text-teal-700 text-sm font-medium"
              >
                + Créer votre premier type
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {personalKinds.map((kind) => (
                <div key={kind.id} className="p-4 flex items-center gap-4">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: kind.color || '#3b82f6' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{kind.name}</span>
                      {kind.isTelemedicine && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                          <Video className="w-3 h-3" />
                          Visio
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {kind.durationMins} min
                      </span>
                      {kind.description && (
                        <span className="truncate">{kind.description}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(kind)}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(kind.id)}
                      className="p-2 hover:bg-red-50 rounded-lg text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Global Kinds */}
        {globalKinds.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Types standards</h2>
              <p className="text-sm text-gray-500">Types disponibles pour tous les praticiens</p>
            </div>
            <div className="divide-y divide-gray-100">
              {globalKinds.map((kind) => (
                <div key={kind.id} className="p-4 flex items-center gap-4">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: kind.color || '#6b7280' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{kind.name}</span>
                      {kind.isTelemedicine && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                          <Video className="w-3 h-3" />
                          Visio
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {kind.durationMins} min
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">Standard</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">
                {editingKind ? 'Modifier le type' : 'Nouveau type de consultation'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du type *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setFieldErrors(fe => ({ ...fe, name: null })); }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${fieldErrors.name ? 'border-red-400' : ''}`}
                  placeholder="Ex: Consultation de suivi"
                  required
                  minLength={2}
                  maxLength={100}
                />
                {fieldErrors.name && <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optionnel)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => { setFormData({ ...formData, description: e.target.value }); setFieldErrors(fe => ({ ...fe, description: null })); }}
                  rows={2}
                  maxLength={300}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none ${fieldErrors.description ? 'border-red-400' : ''}`}
                  placeholder="Description du type de consultation..."
                />
                {fieldErrors.description && <p className="text-xs text-red-500 mt-1">{fieldErrors.description}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Durée (minutes)
                </label>
                <select
                  value={formData.durationMins}
                  onChange={(e) =>
                    setFormData({ ...formData, durationMins: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value={15}>15 minutes</option>
                  <option value={20}>20 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 heure</option>
                  <option value={90}>1h30</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Couleur</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${
                        formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {formData.color === color && <Check className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={formData.isTelemedicine}
                    onChange={(e) =>
                      setFormData({ ...formData, isTelemedicine: e.target.checked })
                    }
                    className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-purple-600" />
                      <span className="font-medium text-purple-900">Téléconsultation</span>
                    </div>
                    <p className="text-xs text-purple-700 mt-0.5">
                      Permet de démarrer une visioconférence
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  {editingKind ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
