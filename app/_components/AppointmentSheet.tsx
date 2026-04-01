'use client';

import {
  X, User, Calendar, Clock, Phone, Mail, FileText, Edit,
  ChevronDown, ChevronUp, History, Paperclip, Pill, CreditCard,
  Bell, Activity, Video, Plus, CheckCircle, Send, ExternalLink,
  MapPin, Copy,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
  durationMins?: number;
  isTelemedicine?: boolean;
  color?: string | null;
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

/* ── helpers ── */
function getAge(birthDate?: string) {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() - birth.getMonth() < 0 || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
  return age;
}

function getInitials(name?: string) {
  if (!name) return 'PA';
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 }).format(amount);
}

const STATUS_MAP: Record<string, { label: string; cls: string; dot: string }> = {
  CONFIRMED: { label: 'Confirmé',   cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  PENDING:   { label: 'En attente', cls: 'bg-amber-100 text-amber-700 border-amber-200',       dot: 'bg-amber-400' },
  CANCELLED: { label: 'Annulé',     cls: 'bg-red-100 text-red-600 border-red-200',             dot: 'bg-red-500' },
  NO_SHOW:   { label: 'Absent',     cls: 'bg-gray-100 text-gray-600 border-gray-200',          dot: 'bg-gray-400' },
};

const INVOICE_STATUS: Record<string, { label: string; cls: string }> = {
  DRAFT:     { label: 'Brouillon', cls: 'bg-gray-100 text-gray-700' },
  SENT:      { label: 'Envoyée',   cls: 'bg-blue-100 text-blue-700' },
  PAID:      { label: 'Payée',     cls: 'bg-emerald-100 text-emerald-700' },
  CANCELLED: { label: 'Annulée',   cls: 'bg-red-100 text-red-700' },
  OVERDUE:   { label: 'En retard', cls: 'bg-orange-100 text-orange-700' },
};

/* ── component ── */
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
  authedFetch,
}: AppointmentSheetProps) {
  const router = useRouter();
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceDescription, setInvoiceDescription] = useState('Consultation médicale');

  const [expandedSections, setExpandedSections] = useState({
    history: false,
    documents: false,
    prescriptions: false,
    billing: false,
    reminders: false,
    medical: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    if (section === 'history' && !expandedSections.history && appointment) loadHistory();
    if (section === 'billing' && !expandedSections.billing && appointment) loadInvoices();
  };

  const loadHistory = async () => {
    if (!appointment?.id) return;
    setLoadingHistory(true);
    try {
      const data = await authedFetch(`/appointments/${appointment.id}/history`);
      setHistory(Array.isArray(data) ? data : []);
    } catch { setHistory([]); }
    finally { setLoadingHistory(false); }
  };

  const loadInvoices = async () => {
    if (!appointment?.id) return;
    setLoadingInvoices(true);
    try {
      const data = await authedFetch(`/invoices?appointmentId=${appointment.id}`);
      setInvoices(Array.isArray(data) ? data : []);
    } catch { setInvoices([]); }
    finally { setLoadingInvoices(false); }
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
          items: [{ description: invoiceDescription, quantity: 1, unitPrice: parseFloat(invoiceAmount) }],
        }),
      });
      setIsCreatingInvoice(false);
      setInvoiceAmount('');
      setInvoiceDescription('Consultation médicale');
      loadInvoices();
    } catch (error) { console.error(error); }
  };

  const handleSendInvoice = async (id: string) => {
    try { await authedFetch(`/invoices/${id}/send`, { method: 'POST' }); loadInvoices(); }
    catch (error) { console.error(error); }
  };

  const handleMarkInvoicePaid = async (id: string) => {
    const method = prompt('Méthode de paiement (ex: Espèces, Carte, Virement):');
    if (!method) return;
    try {
      await authedFetch(`/invoices/${id}/mark-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod: method }),
      });
      loadInvoices();
    } catch (error) { console.error(error); }
  };

  if (!isOpen || !appointment) return null;

  const patient = appointment.patient;
  const kind = appointment.kind;
  const isTelemedicine = !!kind?.isTelemedicine;
  const age = getAge(patient?.birthDate);
  const statusInfo = STATUS_MAP[appointment.status] ?? { label: appointment.status, cls: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' };
  const totalBilled = invoices.reduce((s, inv) => inv.status !== 'CANCELLED' ? s + inv.total : s, 0);
  const durationMins = kind?.durationMins ?? kind?.duration;

  // Telemedicine timing
  const now = new Date();
  const aptStart = new Date(appointment.start);
  const diffMins = (aptStart.getTime() - now.getTime()) / 60000;
  const canJoin = isTelemedicine && appointment.status === 'CONFIRMED' && diffMins <= 15 && diffMins >= -60;
  const tooEarly = isTelemedicine && diffMins > 15;
  const tooLate = isTelemedicine && diffMins < -60;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col animate-slide-in">

        {/* ── Header ── */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3 z-10">
          {/* Avatar */}
          <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${isTelemedicine ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'}`}>
            {getInitials(patient?.fullName)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900 truncate">{patient?.fullName || 'Patient'}</h2>
              {isTelemedicine && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-semibold shrink-0">
                  <Video className="w-2.5 h-2.5" /> Visio
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusInfo.cls}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                {statusInfo.label}
              </span>
              {age && <span className="text-xs text-gray-400">{age} ans</span>}
              {patient?.gender && (
                <span className="text-xs text-gray-400">
                  {patient.gender === 'FEMALE' ? 'Femme' : 'Homme'}
                </span>
              )}
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors shrink-0">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Telemedicine banner ── */}
          {isTelemedicine && (
            <div className={`mx-4 mt-4 rounded-xl border p-4 ${canJoin ? 'bg-purple-600 border-purple-600 text-white' : 'bg-purple-50 border-purple-200'}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${canJoin ? 'bg-white/20' : 'bg-purple-100'}`}>
                  <Video className={`w-4 h-4 ${canJoin ? 'text-white' : 'text-purple-600'}`} />
                </div>
                <div>
                  <div className={`text-sm font-semibold ${canJoin ? 'text-white' : 'text-purple-900'}`}>
                    Téléconsultation
                  </div>
                  <div className={`text-xs ${canJoin ? 'text-white/80' : 'text-purple-600'}`}>
                    {format(aptStart, 'EEEE d MMMM', { locale: fr })} · {format(aptStart, 'HH:mm')} – {format(new Date(appointment.end), 'HH:mm')}
                  </div>
                </div>
              </div>

              {appointment.status === 'CONFIRMED' ? (
                canJoin ? (
                  <button
                    onClick={() => router.push(`/visio/${appointment.id}`)}
                    className="w-full py-2.5 bg-white text-purple-700 font-semibold text-sm rounded-lg flex items-center justify-center gap-2 hover:bg-purple-50 transition-colors"
                  >
                    <Video className="w-4 h-4" />
                    Rejoindre la consultation
                    <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                  </button>
                ) : tooEarly ? (
                  <div className="text-center py-2">
                    <p className="text-purple-700 text-xs font-medium">Disponible 15 min avant le rendez-vous</p>
                    <p className="text-purple-500 text-[11px] mt-0.5">
                      Dans {Math.ceil(diffMins - 15)} min
                    </p>
                  </div>
                ) : tooLate ? (
                  <div className="text-center py-2">
                    <p className="text-purple-600 text-xs">Créneau dépassé</p>
                  </div>
                ) : null
              ) : (
                <p className="text-purple-600 text-xs text-center py-1">
                  Le lien sera disponible une fois le rendez-vous confirmé
                </p>
              )}
            </div>
          )}

          <div className="px-4 py-4 space-y-4">

            {/* ── Appointment info row ── */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-sm capitalize">
                  {format(aptStart, 'EEEE d MMMM yyyy', { locale: fr })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-sm">
                  {format(aptStart, 'HH:mm')} – {format(new Date(appointment.end), 'HH:mm')}
                  {durationMins && (
                    <span className="text-gray-400 ml-1.5">({durationMins} min)</span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                {isTelemedicine
                  ? <Video className="w-4 h-4 text-purple-500 shrink-0" />
                  : <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                }
                <span className="text-sm font-medium">{kind?.name || 'Consultation'}</span>
                {isTelemedicine && (
                  <span className="text-[10px] font-semibold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">Visio</span>
                )}
              </div>
            </div>

            {/* ── Patient contact ── */}
            {patient && (patient.phone || patient.email) && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Contact</h3>
                <div className="space-y-1.5">
                  {patient.phone && (
                    <a
                      href={`tel:${patient.phone}`}
                      className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                    >
                      <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-700 group-hover:text-teal-600 transition-colors">{patient.phone}</span>
                    </a>
                  )}
                  {patient.email && (
                    <a
                      href={`mailto:${patient.email}`}
                      className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                    >
                      <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-700 truncate group-hover:text-teal-600 transition-colors">{patient.email}</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* ── Quick actions ── */}
            {appointment.status !== 'CANCELLED' && (
              <div className="flex flex-wrap gap-2">
                {onEdit && (
                  <button
                    onClick={() => onEdit(appointment)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-lg text-xs font-medium hover:bg-teal-100 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" /> Modifier
                  </button>
                )}
                {onMove && (
                  <button
                    onClick={() => onMove(appointment)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors"
                  >
                    Déplacer
                  </button>
                )}
                {onCopy && (
                  <button
                    onClick={() => onCopy(appointment)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copier
                  </button>
                )}
                <button
                  onClick={() => { setEditedNotes(appointment.notes || ''); setIsEditingNotes(true); }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" /> Notes
                </button>
              </div>
            )}

            {/* ── Notes ── */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Notes</h3>
              {isEditingNotes ? (
                <div className="space-y-2">
                  <textarea
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Ajouter des notes..."
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => { if (onUpdate) onUpdate(appointment.id, { notes: editedNotes }); setIsEditingNotes(false); }}
                      className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-medium hover:bg-teal-700 transition-colors"
                    >
                      Enregistrer
                    </button>
                    <button
                      onClick={() => setIsEditingNotes(false)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="px-3 py-2.5 bg-gray-50 rounded-lg text-sm text-gray-600 leading-relaxed cursor-pointer hover:bg-gray-100 transition-colors min-h-[2.5rem]"
                  onClick={() => { setEditedNotes(appointment.notes || ''); setIsEditingNotes(true); }}
                >
                  {appointment.notes || <span className="text-gray-400 italic">Aucune note — cliquer pour ajouter</span>}
                </div>
              )}
            </div>

            {/* ── Collapsible sections ── */}
            <div className="space-y-1.5">
              {[
                {
                  key: 'history' as const,
                  icon: <History className="w-4 h-4" />,
                  label: 'Historique',
                  badge: history.length || null,
                  content: (
                    loadingHistory ? <p className="text-xs text-gray-400">Chargement…</p> :
                    history.length === 0 ? <p className="text-xs text-gray-400">Aucun historique disponible</p> :
                    <div className="space-y-2">
                      {history.map((entry) => (
                        <div key={entry.id} className="bg-white rounded-lg p-2.5 border border-gray-100">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-900 truncate">{entry.description || entry.action}</p>
                              {entry.user && <p className="text-[11px] text-gray-400">Par {entry.user.fullName || entry.user.email}</p>}
                            </div>
                            <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">
                              {format(new Date(entry.createdAt), 'dd/MM · HH:mm', { locale: fr })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ),
                },
                {
                  key: 'documents' as const,
                  icon: <Paperclip className="w-4 h-4" />,
                  label: 'Documents',
                  badge: null,
                  content: <p className="text-xs text-gray-400">Aucun document attaché</p>,
                },
                {
                  key: 'prescriptions' as const,
                  icon: <Pill className="w-4 h-4" />,
                  label: 'Prescriptions',
                  badge: null,
                  content: <p className="text-xs text-gray-400">Aucune prescription</p>,
                },
                {
                  key: 'billing' as const,
                  icon: <CreditCard className="w-4 h-4" />,
                  label: 'Facturation',
                  badge: null,
                  extra: totalBilled > 0 ? <span className="text-xs text-emerald-600 font-medium">{formatCurrency(totalBilled)}</span> : null,
                  content: (
                    loadingInvoices ? <p className="text-xs text-gray-400">Chargement…</p> :
                    <>
                      {invoices.length === 0 && !isCreatingInvoice && (
                        <div className="text-center py-2">
                          <p className="text-xs text-gray-400 mb-2">Aucune facture</p>
                          <button onClick={() => setIsCreatingInvoice(true)} className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1 mx-auto">
                            <Plus className="w-3 h-3" /> Créer une facture
                          </button>
                        </div>
                      )}
                      {invoices.map((invoice) => {
                        const si = INVOICE_STATUS[invoice.status];
                        return (
                          <div key={invoice.id} className="bg-white rounded-lg p-2.5 border border-gray-100 flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-xs font-medium text-gray-900">{invoice.invoiceNumber}</span>
                                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${si.cls}`}>{si.label}</span>
                              </div>
                              <p className="text-[11px] text-gray-400">{format(new Date(invoice.issueDate), 'dd/MM/yyyy', { locale: fr })}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-gray-900">{formatCurrency(invoice.total)}</p>
                              <div className="flex items-center gap-1 mt-1 justify-end">
                                {invoice.status === 'DRAFT' && (
                                  <button onClick={() => handleSendInvoice(invoice.id)} className="p-1 text-blue-500 hover:bg-blue-50 rounded" title="Envoyer">
                                    <Send className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {(invoice.status === 'SENT' || invoice.status === 'OVERDUE') && (
                                  <button onClick={() => handleMarkInvoicePaid(invoice.id)} className="p-1 text-emerald-500 hover:bg-emerald-50 rounded" title="Marquer payée">
                                    <CheckCircle className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {invoices.length > 0 && !isCreatingInvoice && (
                        <button onClick={() => setIsCreatingInvoice(true)} className="w-full text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center justify-center gap-1 py-1">
                          <Plus className="w-3 h-3" /> Ajouter une facture
                        </button>
                      )}
                      {isCreatingInvoice && (
                        <div className="bg-white rounded-lg p-3 border border-teal-200 space-y-2 mt-1">
                          <p className="text-xs font-semibold text-gray-900">Nouvelle facture</p>
                          <input type="text" placeholder="Description" value={invoiceDescription} onChange={(e) => setInvoiceDescription(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:border-transparent" />
                          <input type="number" placeholder="Montant (XAF)" value={invoiceAmount} onChange={(e) => setInvoiceAmount(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:border-transparent" />
                          <div className="flex gap-2">
                            <button onClick={handleCreateInvoice} disabled={!invoiceAmount}
                              className="flex-1 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-medium hover:bg-teal-700 disabled:opacity-50">
                              Créer
                            </button>
                            <button onClick={() => { setIsCreatingInvoice(false); setInvoiceAmount(''); }}
                              className="flex-1 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200">
                              Annuler
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ),
                },
                {
                  key: 'reminders' as const,
                  icon: <Bell className="w-4 h-4" />,
                  label: 'Rappels',
                  badge: null,
                  content: <p className="text-xs text-gray-400">Aucun rappel configuré</p>,
                },
                {
                  key: 'medical' as const,
                  icon: <Activity className="w-4 h-4" />,
                  label: 'Infos médicales',
                  badge: null,
                  content: (
                    <div className="space-y-2">
                      {[['Allergies', 'Non renseignées'], ['Traitements en cours', 'Non renseignés'], ['Antécédents', 'Non renseignés']].map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">{k}</span>
                          <span className="text-gray-400">{v}</span>
                        </div>
                      ))}
                    </div>
                  ),
                },
              ].map(({ key, icon, label, badge, extra, content }) => (
                <div key={key} className="border border-gray-100 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleSection(key)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 text-gray-600">
                      {icon}
                      <span className="text-sm font-medium">{label}</span>
                      {badge !== null && badge !== undefined && badge > 0 && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{badge}</span>
                      )}
                      {(extra as any)}
                    </div>
                    {expandedSections[key]
                      ? <ChevronUp className="w-4 h-4 text-gray-400" />
                      : <ChevronDown className="w-4 h-4 text-gray-400" />
                    }
                  </button>
                  {expandedSections[key] && (
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 space-y-2 max-h-64 overflow-y-auto">
                      {content}
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* ── Footer actions ── */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-3 flex gap-2">
          {onConfirm && appointment.status === 'PENDING' && (
            <button
              onClick={() => { if (window.confirm('Confirmer ce rendez-vous ?')) onConfirm(appointment.id); }}
              className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" /> Confirmer
            </button>
          )}
          {onCancel && appointment.status !== 'CANCELLED' && (
            <button
              onClick={() => { if (window.confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) onCancel(appointment.id); }}
              className={`${onConfirm && appointment.status === 'PENDING' ? '' : 'flex-1'} py-2.5 px-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors`}
            >
              Annuler le RDV
            </button>
          )}
          {onMove && appointment.status !== 'CANCELLED' && !onConfirm && (
            <button
              onClick={() => onMove(appointment)}
              className="flex-1 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors"
            >
              Déplacer
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from { transform: translateX(100%); }
          to   { transform: translateX(0);    }
        }
        .animate-slide-in { animation: slide-in 0.25s ease-out; }
      `}</style>
    </>
  );
}
