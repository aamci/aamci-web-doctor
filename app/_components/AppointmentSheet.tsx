'use client';

import { X, User, Calendar, Clock, Phone, Mail, FileText, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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
}

export default function AppointmentSheet({ appointment, isOpen, onClose }: AppointmentSheetProps) {
  if (!isOpen || !appointment) return null;

  const patient = appointment.patient;
  const kind = appointment.kind;

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
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-lg">
              {getInitials(patient?.fullName)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{patient?.fullName || 'Patient'}</h2>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${patient?.gender === 'FEMALE' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>
                  {patient?.gender === 'FEMALE' ? 'F' : 'M'}
                </span>
                {age && <span>{age} ans</span>}
                {patient?.birthDate && (
                  <span className="text-gray-400">
                    • {format(new Date(patient.birthDate), 'dd/MM/yyyy', { locale: fr })}
                  </span>
                )}
              </div>
            </div>
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
          {/* Open patient file button */}
          <button className="w-full py-3 px-4 bg-teal-50 text-teal-700 rounded-lg font-medium hover:bg-teal-100 transition-colors flex items-center justify-center gap-2">
            <FileText className="w-5 h-5" />
            Ouvrir le dossier patient
          </button>

          {/* Appointment details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-gray-900 mb-3">Détails du rendez-vous</h3>

            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-600">Agenda</div>
                  <div className="font-medium text-gray-900">Dr Laurent</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-600">Motif</div>
                  <div className="font-medium text-gray-900">
                    {kind?.name || 'Consultation'}
                    {kind?.duration && (
                      <span className="text-sm text-gray-500 ml-2">({kind.duration} min)</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-600">Date</div>
                  <div className="font-medium text-gray-900">
                    {format(new Date(appointment.start), 'EEEE d MMMM yyyy', { locale: fr })}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-600">Horaire</div>
                  <div className="font-medium text-gray-900">
                    {format(new Date(appointment.start), 'HH:mm', { locale: fr })} → {format(new Date(appointment.end), 'HH:mm', { locale: fr })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status badges */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Statut</h3>
            <div className="flex flex-wrap gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
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

          {/* Contact info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-gray-900 mb-3">Contact</h3>

            {patient?.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <a href={`tel:${patient.phone}`} className="text-gray-900 hover:text-teal-600">
                  {patient.phone}
                </a>
              </div>
            )}

            {patient?.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <a href={`mailto:${patient.email}`} className="text-gray-900 hover:text-teal-600">
                  {patient.email}
                </a>
              </div>
            )}
          </div>

          {/* Actions menu */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors">
                Déplacer
              </button>
              <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors">
                Copier
              </button>
              <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors">
                Imprimer
              </button>
              <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors">
                Ajouter une note
              </button>
            </div>
          </div>

          {/* Notes */}
          {appointment.notes && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
              <p className="text-gray-700 text-sm">{appointment.notes}</p>
            </div>
          )}

          {/* History section */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Historique</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-teal-600"></div>
                <span>Rendez-vous créé le {format(new Date(appointment.start), 'dd/MM/yyyy', { locale: fr })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex gap-3">
          <button className="flex-1 py-3 px-4 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors">
            Annuler le RDV
          </button>
          <button className="flex-1 py-3 px-4 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors">
            Modifier le RDV
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
