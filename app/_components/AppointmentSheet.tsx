'use client';

import { X, User, Calendar, Clock, Phone, Mail, FileText, Edit, ChevronDown, ChevronUp, History, Paperclip, Pill, CreditCard, Bell, Activity, Video, Plus, CheckCircle, Send } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../_providers/AuthProvider';

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
  isTelemedicine?: boolean;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  total: number;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'CANCELLED' | 'OVERDUE';
  issueDate: string;
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
  onConfirm?: (appointmentId: string) => void;
  onUpdate?: (appointmentId: string, data: any) => void;
  onMove?: (appointment: Appointment) => void;
  onEdit?: (appointment: Appointment) => void;
  authedFetch: (path: string, init?: RequestInit) => Promise<any>;
}

export default function AppointmentSheet({
  appointment,
  isOpen,
  onClose,
  onCopy,
  onCancel,
  onConfirm,
  onUpdate,
  onMove,
  onEdit,
  authedFetch
}: AppointmentSheetProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceDescription, setInvoiceDescription] = useState('Consultation médicale');

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

    // Charger l'historique quand on ouvre la section
    if (section === 'history' && !expandedSections.history && appointment) {
      loadHistory();
    }
    // Charger les factures quand on ouvre la section
    if (section === 'billing' && !expandedSections.billing && appointment) {
      loadInvoices();
    }
  };

  const loadHistory = async () => {
    if (!appointment?.id) return;
    setLoadingHistory(true);
    try {
      const data = await authedFetch(`/appointments/${appointment.id}/history`);
      // S'assurer que data est un tableau
      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading history:', error);
      setHistory([]); // En cas d'erreur, réinitialiser à un tableau vide
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadInvoices = async () => {
    if (!appointment?.id) return;
    setLoadingInvoices(true);
    try {
      const data = await authedFetch(`/invoices?appointmentId=${appointment.id}`);
      setInvoices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading invoices:', error);
      setInvoices([]);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleCreateInvoice = async () => {
    if (!appointment?.patient?.id || !invoiceAmount) return;

    try {
      await authedFetch('/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: appointment.patient.id,
          appointmentId: appointment.id,
          items: [{
            description: invoiceDescription,
            quantity: 1,
            unitPrice: parseFloat(invoiceAmount),
          }],
        }),
      });
      setIsCreatingInvoice(false);
      setInvoiceAmount('');
      setInvoiceDescription('Consultation médicale');
      loadInvoices();
    } catch (error) {
      console.error('Error creating invoice:', error);
    }
  };

  const handleSendInvoice = async (invoiceId: string) => {
    try {
      await authedFetch(`/invoices/${invoiceId}/send`, { method: 'POST' });
      loadInvoices();
    } catch (error) {
      console.error('Error sending invoice:', error);
    }
  };

  const handleMarkInvoicePaid = async (invoiceId: string) => {
    const method = prompt('Méthode de paiement (ex: Espèces, Carte, Virement):');
    if (!method) return;

    try {
      await authedFetch(`/invoices/${invoiceId}/mark-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod: method }),
      });
      loadInvoices();
    } catch (error) {
      console.error('Error marking invoice paid:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getInvoiceStatusLabel = (status: Invoice['status']) => {
    const statusMap = {
      DRAFT: { label: 'Brouillon', color: 'bg-gray-100 text-gray-700' },
      SENT: { label: 'Envoyée', color: 'bg-blue-100 text-blue-700' },
      PAID: { label: 'Payée', color: 'bg-green-100 text-green-700' },
      CANCELLED: { label: 'Annulée', color: 'bg-red-100 text-red-700' },
      OVERDUE: { label: 'En retard', color: 'bg-orange-100 text-orange-700' },
    };
    return statusMap[status];
  };

  const totalBilled = invoices.reduce((sum, inv) => inv.status !== 'CANCELLED' ? sum + inv.total : sum, 0);

  if (!isOpen || !appointment) return null;

  const patient = appointment.patient;
  const kind = appointment.kind;

  // Vérifier si on peut démarrer la consultation (15 min avant jusqu'à 1h après)
  const canStartConsultation = () => {
    if (!appointment?.start) return false;
    const now = new Date();
    const start = new Date(appointment.start);
    const diffMinutes = (start.getTime() - now.getTime()) / 1000 / 60;
    // On peut démarrer 15 min avant jusqu'à 60 min après l'heure de début
    return diffMinutes <= 15 && diffMinutes >= -60;
  };

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
                  <div className="font-medium text-gray-900 truncate flex items-center gap-1">
                    {kind?.isTelemedicine && (
                      <Video className="w-3 h-3 text-purple-600 flex-shrink-0" />
                    )}
                    {kind?.name || 'Consultation'}
                    {kind?.duration && <span className="text-gray-500 ml-1">({kind.duration}min)</span>}
                  </div>
                  {kind?.isTelemedicine && (
                    <span className="inline-flex items-center px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] mt-1">
                      Téléconsultation
                    </span>
                  )}
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
            {/* Bouton Visio pour les téléconsultations */}
            {kind?.isTelemedicine && appointment.status === 'CONFIRMED' && (
              canStartConsultation() ? (
                <button
                  onClick={() => router.push(`/visio/${appointment.id}`)}
                  className="px-2 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-medium transition-colors flex items-center justify-center gap-1 col-span-2"
                >
                  <Video className="w-3 h-3" />
                  Démarrer Visio
                </button>
              ) : (
                <div className="col-span-2 px-2 py-1.5 bg-gray-100 text-gray-500 rounded text-xs font-medium flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(appointment.start) > new Date() ? 'Pas encore l\'heure' : 'Temps dépassé'}
                </div>
              )
            )}
            {onEdit && appointment.status !== 'CANCELLED' && (
              <button
                onClick={() => onEdit(appointment)}
                className="px-2 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
              >
                <Edit className="w-3 h-3" />
                Modifier
              </button>
            )}
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
                  <span className="text-xs text-gray-500">({history.length})</span>
                </div>
                {expandedSections.history ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>
              {expandedSections.history && (
                <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 max-h-60 overflow-y-auto">
                  {loadingHistory ? (
                    <p className="text-xs text-gray-500">Chargement...</p>
                  ) : history.length === 0 ? (
                    <p className="text-xs text-gray-500">Aucun historique disponible</p>
                  ) : (
                    <div className="space-y-2">
                      {history.map((entry) => (
                        <div key={entry.id} className="bg-white rounded p-2 border border-gray-100">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-900 truncate">
                                {entry.description || entry.action}
                              </p>
                              {entry.user && (
                                <p className="text-[10px] text-gray-500 truncate">
                                  Par {entry.user.fullName || entry.user.email}
                                </p>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-400 whitespace-nowrap flex-shrink-0">
                              {format(new Date(entry.createdAt), 'dd/MM à HH:mm', { locale: fr })}
                            </span>
                          </div>
                          {entry.action === 'STATUS_CHANGED' && entry.oldValue && entry.newValue && (
                            <div className="text-[10px] text-gray-600 mt-1">
                              {JSON.parse(entry.oldValue).status} → {JSON.parse(entry.newValue).status}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
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
                  <span className="text-xs text-green-600 font-medium">{formatCurrency(totalBilled)}</span>
                </div>
                {expandedSections.billing ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>
              {expandedSections.billing && (
                <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 space-y-2">
                  {loadingInvoices ? (
                    <p className="text-xs text-gray-500">Chargement...</p>
                  ) : invoices.length === 0 && !isCreatingInvoice ? (
                    <div className="text-center py-2">
                      <p className="text-xs text-gray-500 mb-2">Aucune facture</p>
                      <button
                        onClick={() => setIsCreatingInvoice(true)}
                        className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1 mx-auto"
                      >
                        <Plus className="w-3 h-3" />
                        Créer une facture
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Liste des factures */}
                      {invoices.map((invoice) => {
                        const statusInfo = getInvoiceStatusLabel(invoice.status);
                        return (
                          <div key={invoice.id} className="bg-white rounded p-2 border border-gray-100">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className="text-xs font-medium text-gray-900">{invoice.invoiceNumber}</span>
                                  <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${statusInfo.color}`}>
                                    {statusInfo.label}
                                  </span>
                                </div>
                                <p className="text-[10px] text-gray-500">
                                  {format(new Date(invoice.issueDate), 'dd/MM/yyyy', { locale: fr })}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-semibold text-gray-900">{formatCurrency(invoice.total)}</p>
                                <div className="flex items-center gap-1 mt-1">
                                  {invoice.status === 'DRAFT' && (
                                    <button
                                      onClick={() => handleSendInvoice(invoice.id)}
                                      className="p-1 hover:bg-blue-50 rounded text-blue-600"
                                      title="Envoyer"
                                    >
                                      <Send className="w-3 h-3" />
                                    </button>
                                  )}
                                  {(invoice.status === 'SENT' || invoice.status === 'OVERDUE') && (
                                    <button
                                      onClick={() => handleMarkInvoicePaid(invoice.id)}
                                      className="p-1 hover:bg-green-50 rounded text-green-600"
                                      title="Marquer payée"
                                    >
                                      <CheckCircle className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Bouton ajouter facture */}
                      {!isCreatingInvoice && (
                        <button
                          onClick={() => setIsCreatingInvoice(true)}
                          className="w-full text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center justify-center gap-1 py-1"
                        >
                          <Plus className="w-3 h-3" />
                          Ajouter une facture
                        </button>
                      )}

                      {/* Formulaire création facture */}
                      {isCreatingInvoice && (
                        <div className="bg-white rounded p-2 border border-teal-200 space-y-2">
                          <p className="text-xs font-medium text-gray-900">Nouvelle facture</p>
                          <input
                            type="text"
                            placeholder="Description"
                            value={invoiceDescription}
                            onChange={(e) => setInvoiceDescription(e.target.value)}
                            className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-teal-500 focus:border-transparent"
                          />
                          <input
                            type="number"
                            placeholder="Montant (XAF)"
                            value={invoiceAmount}
                            onChange={(e) => setInvoiceAmount(e.target.value)}
                            className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-teal-500 focus:border-transparent"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleCreateInvoice}
                              disabled={!invoiceAmount}
                              className="flex-1 py-1 bg-teal-600 text-white rounded text-xs font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Créer
                            </button>
                            <button
                              onClick={() => {
                                setIsCreatingInvoice(false);
                                setInvoiceAmount('');
                              }}
                              className="flex-1 py-1 bg-gray-200 text-gray-700 rounded text-xs font-medium hover:bg-gray-300"
                            >
                              Annuler
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
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
          {onConfirm && appointment.status === 'PENDING' && (
            <button
              onClick={() => {
                if (window.confirm('Confirmer ce rendez-vous ?')) {
                  onConfirm(appointment.id);
                }
              }}
              className="flex-1 py-2 px-3 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Confirmer
            </button>
          )}
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
          {onMove && appointment.status !== 'CANCELLED' && (
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
