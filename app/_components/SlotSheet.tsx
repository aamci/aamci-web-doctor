'use client';

import { useState } from 'react';
import { X, Calendar, Clock, Trash2, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AppointmentKind {
  id: string;
  name: string;
  duration?: number;
}

interface Slot {
  id: string;
  start: string;
  end: string;
  capacity: number;
  status: string;
  ownerId: string;
}

interface SlotSheetProps {
  slot: Slot | null;
  isOpen: boolean;
  onClose: () => void;
  appointmentKinds: AppointmentKind[];
  onDelete: (slotId: string) => Promise<void>;
  onUpdate: (slotId: string, data: any) => Promise<void>;
}

export default function SlotSheet({
  slot,
  isOpen,
  onClose,
  appointmentKinds,
  onDelete,
  onUpdate
}: SlotSheetProps) {
  const [selectedKinds, setSelectedKinds] = useState<string[]>([]);
  const [capacity, setCapacity] = useState(slot?.capacity || 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !slot) return null;

  const handleToggleKind = (kindId: string) => {
    setSelectedKinds(prev =>
      prev.includes(kindId)
        ? prev.filter(id => id !== kindId)
        : [...prev, kindId]
    );
  };

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce créneau ?')) return;

    setLoading(true);
    setError(null);
    try {
      await onDelete(slot.id);
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    setError(null);
    try {
      await onUpdate(slot.id, {
        capacity,
        // On pourrait aussi sauvegarder les motifs autorisés si le backend le supporte
      });
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Erreur lors de la modification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto animate-slide-in">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Créneau disponible</h2>
            <p className="text-sm text-gray-600 mt-1">Gérer ce créneau</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Slot details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-gray-900 mb-3">Détails du créneau</h3>

            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-600">Date</div>
                  <div className="font-medium text-gray-900">
                    {format(new Date(slot.start), 'EEEE d MMMM yyyy', { locale: fr })}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-600">Horaire</div>
                  <div className="font-medium text-gray-900">
                    {format(new Date(slot.start), 'HH:mm', { locale: fr })} → {format(new Date(slot.end), 'HH:mm', { locale: fr })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Capacity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Capacité (nombre de patients)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={capacity}
              onChange={(e) => setCapacity(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {/* Appointment kinds */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Motifs de consultation autorisés</h3>
            <p className="text-sm text-gray-600 mb-3">
              Sélectionnez les types de consultations autorisés pour ce créneau
            </p>
            <div className="space-y-2">
              {appointmentKinds.map((kind) => (
                <label
                  key={kind.id}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedKinds.includes(kind.id)}
                    onChange={() => handleToggleKind(kind.id)}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{kind.name}</div>
                    {kind.duration && (
                      <div className="text-sm text-gray-500">{kind.duration} minutes</div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Statut</h3>
            <div className="flex flex-wrap gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                slot.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {slot.status === 'ACTIVE' ? 'Actif' : 'Inactif'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex gap-3">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 py-3 px-4 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Supprimer
          </button>
          <button
            onClick={handleUpdate}
            disabled={loading}
            className="flex-1 py-3 px-4 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Edit className="w-4 h-4" />
            {loading ? 'Modification...' : 'Modifier'}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
