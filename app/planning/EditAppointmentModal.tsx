'use client';

import { X, Video } from 'lucide-react';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface Patient {
  id: string;
  fullName?: string;
  email?: string;
}

interface AppointmentKind {
  id: string;
  name: string;
  durationMins?: number;
  isTelemedicine?: boolean;
}

interface Appointment {
  id: string;
  start: string;
  end: string;
  patient?: Patient;
  kind?: AppointmentKind;
  notes?: string;
}

interface EditAppointmentModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointmentId: string, data: any) => Promise<void>;
  appointmentKinds: AppointmentKind[];
  authedFetch: (path: string, init?: RequestInit) => Promise<any>;
}

export default function EditAppointmentModal({
  appointment,
  isOpen,
  onClose,
  onSave,
  appointmentKinds,
  authedFetch,
}: EditAppointmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [searching, setSearching] = useState(false);

  // Form state
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedKindId, setSelectedKindId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');

  // Initialize form with appointment data
  useEffect(() => {
    if (appointment && isOpen) {
      setSelectedPatient(appointment.patient || null);
      setSelectedKindId(appointment.kind?.id || '');

      const startDate = new Date(appointment.start);
      const endDate = new Date(appointment.end);

      setDate(format(startDate, 'yyyy-MM-dd'));
      setStartTime(format(startDate, 'HH:mm'));
      setEndTime(format(endDate, 'HH:mm'));
      setNotes(appointment.notes || '');
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [appointment, isOpen]);

  const searchPatients = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await authedFetch(`/users/search?q=${encodeURIComponent(query)}&role=PATIENT`);
      setSearchResults(results || []);
    } catch (error) {
      console.error('Error searching patients:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      searchPatients(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointment) return;

    setLoading(true);
    try {
      const startDateTime = new Date(`${date}T${startTime}`);
      const endDateTime = new Date(`${date}T${endTime}`);

      const data: any = {
        notes,
      };

      // Vérifier si des changements ont été faits
      const patientChanged = selectedPatient?.id !== appointment.patient?.id;
      const kindChanged = selectedKindId !== appointment.kind?.id;
      const timeChanged =
        format(new Date(appointment.start), 'yyyy-MM-dd HH:mm') !== format(startDateTime, 'yyyy-MM-dd HH:mm') ||
        format(new Date(appointment.end), 'yyyy-MM-dd HH:mm') !== format(endDateTime, 'yyyy-MM-dd HH:mm');

      if (patientChanged && selectedPatient) {
        data.patientId = selectedPatient.id;
      }

      if (kindChanged && selectedKindId) {
        data.kindId = selectedKindId;
      }

      if (timeChanged) {
        data.slotStart = startDateTime.toISOString();
        data.slotEnd = endDateTime.toISOString();
      }

      await onSave(appointment.id, data);
      onClose();
    } catch (error) {
      console.error('Error saving appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !appointment) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl z-50 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Modifier le rendez-vous</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {/* Patient Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Patient
            </label>
            {selectedPatient ? (
              <div className="flex items-center justify-between p-2 bg-teal-50 border border-teal-200 rounded text-sm">
                <span className="font-medium text-teal-900">
                  {selectedPatient.fullName || selectedPatient.email}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPatient(null);
                    setSearchQuery('');
                  }}
                  className="text-xs text-teal-600 hover:text-teal-700"
                >
                  Changer
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un patient..."
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
                {searching && (
                  <div className="absolute right-3 top-2">
                    <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-48 overflow-y-auto">
                    {searchResults.map((patient) => (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() => {
                          setSelectedPatient(patient);
                          setSearchQuery('');
                          setSearchResults([]);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                      >
                        <div className="font-medium text-gray-900">
                          {patient.fullName || 'Sans nom'}
                        </div>
                        <div className="text-xs text-gray-500">{patient.email}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Appointment Type */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Type de consultation
            </label>
            <div className="space-y-1.5">
              <div className="grid grid-cols-1 gap-1.5">
                {appointmentKinds.map((kind) => (
                  <button
                    key={kind.id}
                    type="button"
                    onClick={() => setSelectedKindId(kind.id)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-colors text-left ${
                      selectedKindId === kind.id
                        ? kind.isTelemedicine
                          ? 'border-purple-400 bg-purple-50 text-purple-900'
                          : 'border-teal-400 bg-teal-50 text-teal-900'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {kind.isTelemedicine && (
                        <Video className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                      )}
                      <span className="font-medium">{kind.name}</span>
                      {kind.isTelemedicine && (
                        <span className="text-[10px] font-semibold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">Visio</span>
                      )}
                    </span>
                    {kind.durationMins && (
                      <span className="text-xs text-gray-400 shrink-0">{kind.durationMins}min</span>
                    )}
                  </button>
                ))}
              </div>
              {selectedKindId === '' && (
                <p className="text-xs text-gray-400 mt-1">Aucun type sélectionné — la consultation restera inchangée</p>
              )}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Heure de début
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Heure de fin
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Ajouter des notes..."
              className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 px-4 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
