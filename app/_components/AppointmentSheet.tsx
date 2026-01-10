'use client';

import { X, User, Calendar, Clock, Phone, Mail, FileText, Edit, ChevronDown, ChevronUp, History, Paperclip, Pill, CreditCard, Bell, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useState } from 'react';

interface Patient {
  id: string;
  fullName?: string;
  email?: string;
  phone?: string;
  gender?: 'MALE' | 'FEMALE';
  birthDate?: string;
}

interface AppointmentKind {
  id: string;
  name: string;
  duration?: number;
}

interface Appointment {
  id: string;
  start: string;
  end: string;
  status: string;
  patient?: Patient;
  kind?: AppointmentKind;
  notes?: string;
}

interface AppointmentSheetProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onCopy?: (appointment: Appointment) => void;
  onCancel?: (appointmentId: string) => void;
  onUpdate?: (appointmentId: string, data: any) => void;
  onMove?: (appointment: Appointment) => void;
}

export default function AppointmentSheet({
  appointment,
  isOpen,
  onClose,
  onCopy,
  onCancel,
  onUpdate,
  onMove
}: AppointmentSheetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');

  // Expanded sections state
  const [expandedSections, setExpandedSections] = useState({
    history: false,
    documents: false,
    prescriptions: false,
    billing: false,
    reminders: false,
    medical: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!isOpen || !appointment) return null;

  const patient = appointment.patient;
  const kind = appointment.kind;

  const handleEditClick = () => {
    setEditedNotes(appointment.notes || '');
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (onUpdate) {
      onUpdate(appointment.id, { notes: editedNotes });
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedNotes('');
  };

  // Calculate age from birthdate
  const getAge = (birthDate?: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Get initials for avatar
  const getInitials = (name?: string) => {
    if (!name) return 'PA';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const age = getAge(patient?.birthDate);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto animate-slide-in">
        {/* Header - Compact */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
              {getInitials(patient?.fullName)}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-gray-900 truncate">{patient?.fullName || 'Patient'}</h2>
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-xs ${patient?.gender === 'FEMALE' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>
                  {patient?.gender === 'FEMALE' ? 'F' : 'M'}
                </span>
                {age && <span>{age} ans</span>}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content - Compact */}
        <div className="p-4 space-y-3">
          {/* Cards Grid - Side by side */}
          <div className="grid grid-cols-2 gap-2">
            {/* Patient Info Card */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gradient-to-r from-teal-50 to-blue-50 px-2 py-1.5 border-b border-gray-200">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-teal-600" />
                  <h3 className="text-xs font-semibold text-gray-900">Patient</h3>
                </div>
              </div>
              <div className="p-2 space-y-1.5">
                <div className="text-xs">
                  <div className="text-gray-500 text-[10px]">Nom</div>
                  <div className="font-medium text-gray-900 truncate">{patient?.fullName || 'N/A'}</div>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <div>
                    <div className="text-gray-500 text-[10px]">Âge</div>
                    <div className="font-medium text-gray-900">{age ? `${age} ans` : 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-[10px]">Genre</div>
                    <div className="font-medium text-gray-900">
                      {patient?.gender === 'FEMALE' ? 'F' : patient?.gender === 'MALE' ? 'M' : 'N/A'}
                    </div>
                  </div>
                </div>
                {(patient?.phone || patient?.email) && (
                  <div className="pt-1.5 border-t border-gray-100 space-y-1">
                    {patient?.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <a href={`tel:${patient.phone}`} className="text-[10px] text-teal-600 hover:text-teal-700 truncate">
                          {patient.phone}
                        </a>
                      </div>
                    )}
                    {patient?.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <a href={`mailto:${patient.email}`} className="text-[10px] text-teal-600 hover:text-teal-700 truncate">
                          {patient.email}
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Appointment Details Card */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-2 py-1.5 border-b border-gray-200">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-purple-600" />
                  <h3 className="text-xs font-semibold text-gray-900">Rendez-vous</h3>
                </div>
              </div>
              <div className="p-2 space-y-1.5">
                <div className="text-xs">
                  <div className="text-gray-500 text-[10px]">Date</div>
                  <div className="font-medium text-gray-900">
                    {format(new Date(appointment.start), 'dd/MM/yyyy', { locale: fr })}
                  </div>
                </div>
                <div className="text-xs">
                  <div className="text-gray-500 text-[10px]">Horaire</div>
                  <div className="font-medium text-gray-900">
                    {format(new Date(appointment.start), 'HH:mm', { locale: fr })} - {format(new Date(appointment.end), 'HH:mm', { locale: fr })}
                  </div>
                </div>
                <div className="text-xs">
                  <div className="text-gray-500 text-[10px]">Type</div>
                  <div className="font-medium text-gray-900 truncate">
                    {kind?.name || 'Consultation'}
                    {kind?.duration && <span className="text-gray-500 ml-1">({kind.duration}min)</span>}
                  </div>
                </div>
                <div className="text-xs pt-1.5 border-t border-gray-100">
                  <div className="text-gray-500 text-[10px] mb-1">Statut</div>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    appointment.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                    appointment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                    appointment.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {appointment.status === 'CONFIRMED' ? 'Confirmé' :
                     appointment.status === 'PENDING' ? 'En attente' :
                     appointment.status === 'CANCELLED' ? 'Annulé' :
                     appointment.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions - Compact Grid */}
          <div className="grid grid-cols-4 gap-1.5">
            {onMove && (
              <button
                onClick={() => onMove(appointment)}
                className="px-2 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium text-gray-700 transition-colors"
              >
                Déplacer
              </button>
            )}
            {onCopy && (
              <button
                onClick={() => onCopy(appointment)}
                className="px-2 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium text-gray-700 transition-colors"
              >
                Copier
              </button>
            )}
            <button className="px-2 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium text-gray-700 transition-colors">
              Imprimer
            </button>
            <button
              onClick={handleEditClick}
              className="px-2 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium text-gray-700 transition-colors flex items-center justify-center gap-1"
            >
              <Edit className="w-3 h-3" />
              Notes
            </button>
          </div>

          {/* Notes - Compact */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-900">Notes</h3>
            </div>
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editedNotes}
                  onChange={(e) => setEditedNotes(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Ajouter des notes..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    className="px-3 py-1 bg-teal-600 text-white rounded text-xs font-medium hover:bg-teal-700 transition-colors"
                  >
                    Enregistrer
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs font-medium hover:bg-gray-300 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-700 text-xs leading-relaxed">{appointment.notes || 'Aucune note'}</p>
            )}
          </div>

          {/* Collapsible Sections */}
          <div className="space-y-2">
            {/* Historique */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('history')}
                className="w-full flex items-center justify-between px-3 py-2 bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-medium text-gray-700">Historique</span>
                  <span className="text-xs text-gray-500">(0)</span>
                </div>
                {expandedSections.history ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>
              {expandedSections.history && (
                <div className="px-3 py-2 bg-gray-50 border-t border-gray-200">
                  <p className="text-xs text-gray-500">Aucun historique disponible</p>
                </div>
              )}
            </div>

            {/* Documents */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('documents')}
                className="w-full flex items-center justify-between px-3 py-2 bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-medium text-gray-700">Documents</span>
                  <span className="text-xs text-gray-500">(0)</span>
                </div>
                {expandedSections.documents ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>
              {expandedSections.documents && (
                <div className="px-3 py-2 bg-gray-50 border-t border-gray-200">
                  <p className="text-xs text-gray-500">Aucun document attaché</p>
                </div>
              )}
            </div>

            {/* Prescriptions */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('prescriptions')}
                className="w-full flex items-center justify-between px-3 py-2 bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-medium text-gray-700">Prescriptions</span>
                  <span className="text-xs text-gray-500">(0)</span>
                </div>
                {expandedSections.prescriptions ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>
              {expandedSections.prescriptions && (
                <div className="px-3 py-2 bg-gray-50 border-t border-gray-200">
                  <p className="text-xs text-gray-500">Aucune prescription</p>
                </div>
              )}
            </div>

            {/* Facturation */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('billing')}
                className="w-full flex items-center justify-between px-3 py-2 bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-medium text-gray-700">Facturation</span>
                  <span className="text-xs text-green-600 font-medium">0 €</span>
                </div>
                {expandedSections.billing ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>
              {expandedSections.billing && (
                <div className="px-3 py-2 bg-gray-50 border-t border-gray-200">
                  <p className="text-xs text-gray-500">Aucune facturation</p>
                </div>
              )}
            </div>

            {/* Rappels */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('reminders')}
                className="w-full flex items-center justify-between px-3 py-2 bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-medium text-gray-700">Rappels</span>
                  <span className="text-xs text-gray-500">(0)</span>
                </div>
                {expandedSections.reminders ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>
              {expandedSections.reminders && (
                <div className="px-3 py-2 bg-gray-50 border-t border-gray-200">
                  <p className="text-xs text-gray-500">Aucun rappel configuré</p>
                </div>
              )}
            </div>

            {/* Informations médicales */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('medical')}
                className="w-full flex items-center justify-between px-3 py-2 bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-medium text-gray-700">Infos médicales</span>
                </div>
                {expandedSections.medical ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>
              {expandedSections.medical && (
                <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Allergies:</span>
                    <span className="text-gray-500">Non renseignées</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Traitements en cours:</span>
                    <span className="text-gray-500">Non renseignés</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Antécédents:</span>
                    <span className="text-gray-500">Non renseignés</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer buttons - Compact */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-3 flex gap-2">
          {onCancel && appointment.status !== 'CANCELLED' && (
            <button
              onClick={() => {
                if (window.confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) {
                  onCancel(appointment.id);
                }
              }}
              className="flex-1 py-2 px-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
            >
              Annuler
            </button>
          )}
          {onMove && (
            <button
              onClick={() => onMove(appointment)}
              className="flex-1 py-2 px-3 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
            >
              Déplacer
            </button>
          )}
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
