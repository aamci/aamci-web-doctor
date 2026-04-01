'use client';

import { useState, useEffect } from 'react';
import { X, Search, User, Calendar, Clock, UserPlus, ChevronLeft, Video } from 'lucide-react';
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
  durationMins?: number;
  isTelemedicine?: boolean;
  color?: string | null;
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

// Nouveau patient form data
interface NewPatientForm {
  gender: 'male' | 'female';
  lastName: string;
  firstName: string;
  birthName: string;
  birthDate: string;
  birthPlace: 'france' | 'abroad';
  birthCity: string;
  phone: string;
  email: string;
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

  // Mode création de patient
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [isCreatingPatient, setIsCreatingPatient] = useState(false);
  const [newPatient, setNewPatient] = useState<NewPatientForm>({
    gender: 'male',
    lastName: '',
    firstName: '',
    birthName: '',
    birthDate: '',
    birthPlace: 'france',
    birthCity: '',
    phone: '',
    email: '',
  });

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
        const kinds = Array.isArray(data) ? data : (data?.data || []);
        setAppointmentKinds(kinds);
      } else {
        console.error('Failed to fetch appointment kinds:', response.status);
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

  const handleCreatePatient = async () => {
    // Validation
    if (!newPatient.lastName.trim() || !newPatient.firstName.trim()) {
      toast.error('Veuillez renseigner le nom et le prénom du patient');
      return;
    }

    if (!newPatient.email.trim()) {
      toast.error('Veuillez renseigner l\'email du patient');
      return;
    }

    setIsCreatingPatient(true);

    try {
      const token = localStorage.getItem('token');
      const url = apiBase ? `${apiBase}/users/create-patient` : '/api/users/create-patient';

      const fullName = `${newPatient.firstName.trim()} ${newPatient.lastName.trim()}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          fullName,
          email: newPatient.email.trim(),
          phone: newPatient.phone.trim() || undefined,
          gender: newPatient.gender,
          birthDate: newPatient.birthDate || undefined,
          birthPlace: newPatient.birthPlace === 'france' ? newPatient.birthCity : `Étranger - ${newPatient.birthCity}`,
          birthName: newPatient.birthName.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Erreur lors de la création du patient');
      }

      const createdPatient = await response.json();

      toast.success('Patient créé avec succès !');

      // Sélectionner le patient créé
      setSelectedPatient({
        id: createdPatient.id,
        fullName: createdPatient.fullName,
        email: createdPatient.email,
        phone: createdPatient.phone,
      });

      // Fermer le formulaire de création
      setShowNewPatientForm(false);
      resetNewPatientForm();

    } catch (error: any) {
      console.error('Error creating patient:', error);
      toast.error(error.message || 'Erreur lors de la création du patient');
    } finally {
      setIsCreatingPatient(false);
    }
  };

  const resetNewPatientForm = () => {
    setNewPatient({
      gender: 'male',
      lastName: '',
      firstName: '',
      birthName: '',
      birthDate: '',
      birthPlace: 'france',
      birthCity: '',
      phone: '',
      email: '',
    });
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
    setShowNewPatientForm(false);
    resetNewPatientForm();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const startDate = new Date(slotStart);
  const endDate = new Date(slotEnd);

  // Formulaire de création de patient
  if (showNewPatientForm) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b">
            <button
              onClick={() => setShowNewPatientForm(false)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-teal-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Ajouter un nouveau patient
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="ml-auto text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <div className="p-5 space-y-5">
            {/* Genre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Genre
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    checked={newPatient.gender === 'male'}
                    onChange={() => setNewPatient({ ...newPatient, gender: 'male' })}
                    className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                  />
                  <span className="text-sm text-gray-700">Homme</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    checked={newPatient.gender === 'female'}
                    onChange={() => setNewPatient({ ...newPatient, gender: 'female' })}
                    className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                  />
                  <span className="text-sm text-gray-700">Femme</span>
                </label>
              </div>
            </div>

            {/* Nom et Prénom */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nom utilisé *
                </label>
                <input
                  type="text"
                  value={newPatient.lastName}
                  onChange={(e) => setNewPatient({ ...newPatient, lastName: e.target.value })}
                  placeholder="Nom"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  1er prénom de naissance *
                </label>
                <input
                  type="text"
                  value={newPatient.firstName}
                  onChange={(e) => setNewPatient({ ...newPatient, firstName: e.target.value })}
                  placeholder="Prénom"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-gray-50"
                />
              </div>
            </div>

            {/* Nom de naissance et Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nom de naissance
                </label>
                <input
                  type="text"
                  value={newPatient.birthName}
                  onChange={(e) => setNewPatient({ ...newPatient, birthName: e.target.value })}
                  placeholder="Nom de naissance"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Date de naissance
                </label>
                <input
                  type="date"
                  value={newPatient.birthDate}
                  onChange={(e) => setNewPatient({ ...newPatient, birthDate: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-gray-50"
                />
              </div>
            </div>

            {/* Lieu et Ville de naissance */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Lieu de naissance
                </label>
                <select
                  value={newPatient.birthPlace}
                  onChange={(e) => setNewPatient({ ...newPatient, birthPlace: e.target.value as 'france' | 'abroad' })}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-gray-50"
                >
                  <option value="france">Né(e) en France</option>
                  <option value="abroad">Né(e) à l'étranger</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Ville de naissance
                </label>
                <input
                  type="text"
                  value={newPatient.birthCity}
                  onChange={(e) => setNewPatient({ ...newPatient, birthCity: e.target.value })}
                  placeholder="Ville"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-gray-50"
                />
              </div>
            </div>

            {/* Téléphone et Email */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={newPatient.phone}
                  onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                  placeholder="06 12 34 56 78"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Adresse e-mail *
                </label>
                <input
                  type="email"
                  value={newPatient.email}
                  onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                  placeholder="email@exemple.fr"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-gray-50"
                />
              </div>
            </div>

            {/* Séparateur et Actions */}
            <div className="pt-4 border-t flex items-center justify-between">
              <button
                type="button"
                className="text-sm text-teal-600 hover:text-teal-700 font-medium"
              >
                Plus d'options
              </button>
              <button
                type="button"
                onClick={handleCreatePatient}
                disabled={isCreatingPatient || !newPatient.lastName || !newPatient.firstName || !newPatient.email}
                className="px-5 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isCreatingPatient ? 'Création...' : 'Ajouter le patient'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Modal principal de création de RDV
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
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Type de consultation *
            </label>
            {appointmentKinds.length === 0 ? (
              <p className="text-xs text-orange-600 py-1">Chargement des types…</p>
            ) : (
              <div className="space-y-1">
                {/* Présentiel */}
                {appointmentKinds.filter(k => !k.isTelemedicine).length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Présentiel</p>
                    <div className="grid grid-cols-1 gap-1">
                      {appointmentKinds.filter(k => !k.isTelemedicine).map((kind) => (
                        <button
                          key={kind.id}
                          type="button"
                          onClick={() => setSelectedKindId(kind.id)}
                          className={`flex items-center justify-between px-2.5 py-2 rounded-lg border text-xs transition-colors text-left ${
                            selectedKindId === kind.id
                              ? 'border-teal-400 bg-teal-50 text-teal-900'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          <span className="font-medium">{kind.name}</span>
                          {kind.durationMins && <span className="text-gray-400">{kind.durationMins}min</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {/* Téléconsultation */}
                {appointmentKinds.filter(k => k.isTelemedicine).length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-purple-400 uppercase tracking-wide mb-1 mt-2 flex items-center gap-1">
                      <Video className="w-3 h-3" /> Téléconsultation
                    </p>
                    <div className="grid grid-cols-1 gap-1">
                      {appointmentKinds.filter(k => k.isTelemedicine).map((kind) => (
                        <button
                          key={kind.id}
                          type="button"
                          onClick={() => setSelectedKindId(kind.id)}
                          className={`flex items-center justify-between px-2.5 py-2 rounded-lg border text-xs transition-colors text-left ${
                            selectedKindId === kind.id
                              ? 'border-purple-400 bg-purple-50 text-purple-900'
                              : 'border-purple-100 bg-purple-50/40 hover:border-purple-300 text-gray-700'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <Video className="w-3 h-3 text-purple-400 shrink-0" />
                            <span className="font-medium">{kind.name}</span>
                          </span>
                          {kind.durationMins && <span className="text-gray-400">{kind.durationMins}min</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recherche patient */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-gray-700">
                Patient *
              </label>
              {!selectedPatient && (
                <button
                  type="button"
                  onClick={() => setShowNewPatientForm(true)}
                  className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Nouveau patient
                </button>
              )}
            </div>

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
                {(isSearching || searchResults.length > 0 || (searchQuery.length >= 2 && !isSearching)) && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-48 overflow-y-auto">
                    {isSearching ? (
                      <div className="px-3 py-2 text-center text-xs text-gray-500">
                        Recherche...
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="px-3 py-3 text-center">
                        <p className="text-xs text-gray-500 mb-2">Aucun patient trouvé</p>
                        <button
                          type="button"
                          onClick={() => setShowNewPatientForm(true)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-50 text-teal-700 text-xs font-medium rounded-lg hover:bg-teal-100 transition-colors"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          Créer ce patient
                        </button>
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
