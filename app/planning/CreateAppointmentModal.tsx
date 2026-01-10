'use client';

import { useState, useEffect } from 'react';
import { X, Search, User, Calendar, Clock } from 'lucide-react';
import { toast } from '../_components/Toaster';

interface Patient {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
}

interface AppointmentKind {
  id: string;
  name: string;
  description?: string;
  duration?: number;
}

interface CreateAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  slotStart: string; // ISO string
  slotEnd: string; // ISO string
  onAppointmentCreated: () => void;
  apiBase: string;
  copiedAppointment?: {
    patientId: string;
    kindId: string;
    notes?: string;
    patient?: Patient;
    kind?: AppointmentKind;
  } | null;
}

export default function CreateAppointmentModal({
  isOpen,
  onClose,
  slotStart,
  slotEnd,
  onAppointmentCreated,
  apiBase,
  copiedAppointment = null,
}: CreateAppointmentModalProps) {
  const [appointmentKinds, setAppointmentKinds] = useState<AppointmentKind[]>([]);
  const [selectedKindId, setSelectedKindId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [notes, setNotes] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch appointment kinds
  useEffect(() => {
    if (isOpen) {
      fetchAppointmentKinds();
    }
  }, [isOpen]);

  // Pre-fill form with copied appointment data
  useEffect(() => {
    if (isOpen && copiedAppointment) {
      setSelectedKindId(copiedAppointment.kindId || '');
      setSelectedPatient(copiedAppointment.patient || null);
      setNotes(copiedAppointment.notes || '');
    }
  }, [isOpen, copiedAppointment]);

  // Search patients
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      searchPatients(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchAppointmentKinds = async () => {
    try {
      const token = localStorage.getItem('token');
      // Utiliser la même logique que authedFetch: si apiBase est vide, utiliser /api prefix
      const url = apiBase ? `${apiBase}/appointment-kinds` : '/api/appointment-kinds';

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Appointment kinds data:', data); // Debug
        // L'API peut retourner un tableau directement ou un objet avec une clé 'data'
        const kinds = Array.isArray(data) ? data : (data?.data || []);
        console.log('Parsed appointment kinds:', kinds); // Debug
        setAppointmentKinds(kinds);
      } else {
        console.error('Failed to fetch appointment kinds:', response.status, await response.text());
        toast.error('Erreur lors du chargement des types de consultation');
      }
    } catch (error) {
      console.error('Error fetching appointment kinds:', error);
      toast.error('Erreur lors du chargement des types de consultation');
    }
  };

  const searchPatients = async (query: string) => {
    setIsSearching(true);
    try {
      const token = localStorage.getItem('token');
      const url = apiBase
        ? `${apiBase}/users/search?q=${encodeURIComponent(query)}&role=PATIENT`
        : `/api/users/search?q=${encodeURIComponent(query)}&role=PATIENT`;

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error('Error searching patients:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPatient) {
      toast.error('Veuillez sélectionner un patient');
      return;
    }

    if (!selectedKindId) {
      toast.error('Veuillez sélectionner un type de consultation');
      return;
    }

    // Vérifier que la date n'est pas dans le passé
    const targetDate = new Date(slotStart);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (targetDate < today) {
      toast.error('Date invalide', {
        description: 'Vous ne pouvez pas créer un rendez-vous à une date passée'
      });
      return;
    }

    setIsCreating(true);

    try {
      const token = localStorage.getItem('token');
      const url = apiBase ? `${apiBase}/appointments` : '/api/appointments';

      await toast.promise(
        fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
          body: JSON.stringify({
            patientId: selectedPatient.id,
            kindId: selectedKindId,
            slotStart,
            slotEnd,
            notes: notes || undefined,
          }),
        }).then(async (response) => {
          if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'Erreur lors de la création');
          }
          return response.json();
        }),
        {
          loading: 'Création du rendez-vous...',
          success: 'Rendez-vous créé avec succès !',
          error: (err) => `Erreur: ${err.message}`,
        }
      );

      onAppointmentCreated();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating appointment:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setSelectedKindId('');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedPatient(null);
    setNotes('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const startDate = new Date(slotStart);
  const endDate = new Date(slotEnd);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header - Compact */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-gray-900 truncate">
              {copiedAppointment ? 'Copier le rendez-vous' : 'Nouveau rendez-vous'}
            </h2>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>{startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>{startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - {endDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 flex-shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form - Compact */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {/* Type de consultation */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Type de consultation *
            </label>
            <select
              value={selectedKindId}
              onChange={(e) => setSelectedKindId(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={appointmentKinds.length === 0}
            >
              <option value="">
                {appointmentKinds.length === 0
                  ? 'Chargement...'
                  : 'Sélectionner'}
              </option>
              {appointmentKinds.map((kind) => (
                <option key={kind.id} value={kind.id}>
                  {kind.name} {kind.duration ? `(${kind.duration}min)` : ''}
                </option>
              ))}
            </select>
            {appointmentKinds.length === 0 && (
              <p className="mt-1 text-xs text-orange-600">
                Aucun type disponible
              </p>
            )}
          </div>

          {/* Recherche patient */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Patient *
            </label>

            {selectedPatient ? (
              <div className="flex items-center justify-between px-2 py-2 bg-blue-50 border border-blue-200 rounded">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <User className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{selectedPatient.fullName}</p>
                    {selectedPatient.email && (
                      <p className="text-xs text-gray-600 truncate">{selectedPatient.email}</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPatient(null)}
                  className="text-blue-600 hover:text-blue-800 text-xs font-medium flex-shrink-0 ml-2"
                >
                  Changer
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher un patient..."
                    className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Search results */}
                {(isSearching || searchResults.length > 0) && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-48 overflow-y-auto">
                    {isSearching ? (
                      <div className="px-3 py-2 text-center text-xs text-gray-500">
                        Recherche...
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="px-3 py-2 text-center text-xs text-gray-500">
                        Aucun patient trouvé
                      </div>
                    ) : (
                      searchResults.map((patient) => (
                        <button
                          key={patient.id}
                          type="button"
                          onClick={() => {
                            setSelectedPatient(patient);
                            setSearchQuery('');
                            setSearchResults([]);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{patient.fullName}</p>
                              {patient.email && (
                                <p className="text-xs text-gray-600 truncate">{patient.email}</p>
                              )}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Notes (optionnel)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Détails supplémentaires..."
              rows={2}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
              disabled={isCreating}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isCreating || !selectedPatient || !selectedKindId}
              className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isCreating ? 'Création...' : 'Créer le rendez-vous'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
