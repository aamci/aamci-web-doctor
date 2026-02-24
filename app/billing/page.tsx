'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  FileText,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Search,
  Eye,
  Printer,
  User,
  Calendar,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../_providers/AuthProvider';
import { InvoiceTemplate, PrintButton } from '../_components/templates';

interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  appointmentId: string | null;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'CANCELLED' | 'OVERDUE';
  issueDate: string;
  dueDate: string | null;
  paidAt: string | null;
  notes: string | null;
  paymentMethod: string | null;
  items: InvoiceItem[];
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface InvoiceStats {
  totalInvoices: number;
  paidCount: number;
  paidAmount: number;
  pendingCount: number;
  pendingAmount: number;
  walletBalance: number;
  recentInvoices: any[];
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const STATUS_CONFIG = {
  DRAFT: { label: 'Brouillon', color: 'bg-gray-100 text-gray-700', icon: FileText },
  SENT: { label: 'Envoyée', color: 'bg-blue-100 text-blue-700', icon: Send },
  PAID: { label: 'Payée', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  CANCELLED: { label: 'Annulée', color: 'bg-red-100 text-red-700', icon: XCircle },
  OVERDUE: { label: 'En retard', color: 'bg-orange-100 text-orange-700', icon: Clock },
};

export default function BillingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctorSignature] = useState<string | null>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('doctorSignature') : null
  );

  // Form state
  const [formData, setFormData] = useState({
    patientId: '',
    notes: '',
    dueDate: '',
    items: [{ description: '', quantity: 1, unitPrice: 0 }],
  });

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3002';

  useEffect(() => {
    fetchInvoices();
    fetchStats();
    fetchPatients();
  }, []);

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/invoices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/invoices/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/users?role=PAT`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPatients(data);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API_BASE_URL}/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patientId: formData.patientId,
          notes: formData.notes || undefined,
          dueDate: formData.dueDate || undefined,
          items: formData.items.filter((i) => i.description && i.unitPrice > 0),
        }),
      });

      if (res.ok) {
        setIsCreateModalOpen(false);
        setFormData({
          patientId: '',
          notes: '',
          dueDate: '',
          items: [{ description: '', quantity: 1, unitPrice: 0 }],
        });
        fetchInvoices();
        fetchStats();
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
    }
  };

  const handleSendInvoice = async (invoiceId: string) => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`${API_BASE_URL}/invoices/${invoiceId}/send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchInvoices();
      fetchStats();
    } catch (error) {
      console.error('Error sending invoice:', error);
    }
  };

  const handleMarkAsPaid = async (invoiceId: string, paymentMethod: string) => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`${API_BASE_URL}/invoices/${invoiceId}/mark-paid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentMethod }),
      });
      fetchInvoices();
      fetchStats();
      setIsDetailModalOpen(false);
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
    }
  };

  const handleCancelInvoice = async (invoiceId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette facture ?')) return;
    const token = localStorage.getItem('token');
    try {
      await fetch(`${API_BASE_URL}/invoices/${invoiceId}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchInvoices();
      fetchStats();
      setIsDetailModalOpen(false);
    } catch (error) {
      console.error('Error cancelling invoice:', error);
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, unitPrice: 0 }],
    });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${invoice.patient.firstName} ${invoice.patient.lastName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Facturation</h1>
            <p className="text-gray-600 text-sm">Gérez vos factures et suivez vos paiements</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Nouvelle facture
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div
              onClick={() => router.push('/wallet')}
              className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-4 shadow-sm border border-teal-400 cursor-pointer hover:from-teal-600 hover:to-teal-700 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-teal-100">Solde disponible</p>
                  <p className="text-xl font-bold text-white">
                    {formatCurrency(Number(stats.walletBalance) || 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total factures</p>
                  <p className="text-xl font-bold text-gray-900">{stats.totalInvoices}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payées ({stats.paidCount})</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(Number(stats.paidAmount) || 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">En attente ({stats.pendingCount})</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(Number(stats.pendingAmount) || 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Taux encaissement</p>
                  <p className="text-xl font-bold text-gray-900">
                    {stats.totalInvoices > 0
                      ? Math.round((stats.paidCount / stats.totalInvoices) * 100)
                      : 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par numéro ou patient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="all">Tous les statuts</option>
            <option value="DRAFT">Brouillons</option>
            <option value="SENT">Envoyées</option>
            <option value="PAID">Payées</option>
            <option value="OVERDUE">En retard</option>
            <option value="CANCELLED">Annulées</option>
          </select>
        </div>

        {/* Invoices List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {filteredInvoices.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">Aucune facture trouvée</p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="text-teal-600 hover:text-teal-700 text-sm font-medium"
              >
                + Créer votre première facture
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredInvoices.map((invoice) => {
                const statusConfig = STATUS_CONFIG[invoice.status];
                const StatusIcon = statusConfig.icon;

                return (
                  <div
                    key={invoice.id}
                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedInvoice(invoice);
                      setIsDetailModalOpen(true);
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <FileText className="w-5 h-5 text-gray-600" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {invoice.invoiceNumber}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {invoice.patient.firstName} {invoice.patient.lastName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(invoice.issueDate)}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(invoice.total)}
                        </p>
                        {invoice.dueDate && invoice.status !== 'PAID' && (
                          <p className="text-xs text-gray-500">
                            Échéance: {formatDate(invoice.dueDate)}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {invoice.status === 'DRAFT' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendInvoice(invoice.id);
                            }}
                            className="p-2 hover:bg-blue-50 rounded-lg text-blue-600"
                            title="Envoyer"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedInvoice(invoice);
                            setIsDetailModalOpen(true);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                          title="Voir détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Invoice Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
              <h2 className="text-lg font-semibold">Nouvelle facture</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-4 space-y-4">
              {/* Patient Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                <select
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                >
                  <option value="">Sélectionner un patient</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.firstName} {patient.lastName} ({patient.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date d'échéance (optionnel)
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              {/* Items */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Éléments de la facture
                </label>
                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <input
                        type="text"
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Qté"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-20 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                        min="1"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Prix"
                        value={item.unitPrice || ''}
                        onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-28 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                        min="0"
                        required
                      />
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addItem}
                  className="mt-2 text-sm text-teal-600 hover:text-teal-700 font-medium"
                >
                  + Ajouter un élément
                </button>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optionnel)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-sm"
                  placeholder="Notes internes ou pour le patient..."
                />
              </div>

              {/* Total */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Total</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {formatCurrency(calculateTotal())}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  Créer la facture
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Detail Modal */}
      {isDetailModalOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-lg font-semibold">{selectedInvoice.invoiceNumber}</h2>
                <p className="text-sm text-gray-500">
                  Créée le {formatDate(selectedInvoice.issueDate)}
                </p>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Actions rapides */}
              <div className="flex flex-wrap gap-2 pb-4 border-b">
                {selectedInvoice.status === 'DRAFT' && (
                  <>
                    <button
                      onClick={() => handleSendInvoice(selectedInvoice.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium"
                    >
                      <Send className="w-4 h-4" />
                      Envoyer
                    </button>
                    <button
                      onClick={() => handleCancelInvoice(selectedInvoice.id)}
                      className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium"
                    >
                      Annuler
                    </button>
                  </>
                )}
                {(selectedInvoice.status === 'SENT' || selectedInvoice.status === 'OVERDUE') && (
                  <>
                    <button
                      onClick={() => {
                        const method = prompt('Méthode de paiement (ex: Espèces, Carte, Virement):');
                        if (method) handleMarkAsPaid(selectedInvoice.id, method);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm font-medium"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Marquer payée
                    </button>
                    <button
                      onClick={() => handleCancelInvoice(selectedInvoice.id)}
                      className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium"
                    >
                      Annuler
                    </button>
                  </>
                )}

                {/* Boutons d'impression */}
                <div className="ml-auto">
                  <PrintButton documentTitle={selectedInvoice.invoiceNumber}>
                    <InvoiceTemplate
                      doctor={{
                        fullName: user?.fullName || 'Dr. Médecin',
                        specialty: (user as any)?.doctorProfile?.specialty,
                        address: (user as any)?.doctorProfile?.address,
                        city: (user as any)?.doctorProfile?.city,
                        phone: (user as any)?.phone,
                        email: user?.email,
                        signatureUrl: doctorSignature || undefined,
                      }}
                      patient={{
                        fullName: `${selectedInvoice.patient.firstName} ${selectedInvoice.patient.lastName}`,
                        email: selectedInvoice.patient.email,
                      }}
                      invoice={{
                        invoiceNumber: selectedInvoice.invoiceNumber,
                        issueDate: selectedInvoice.issueDate,
                        dueDate: selectedInvoice.dueDate || undefined,
                        items: selectedInvoice.items,
                        subtotal: selectedInvoice.subtotal,
                        taxRate: selectedInvoice.taxRate,
                        taxAmount: selectedInvoice.taxAmount,
                        total: selectedInvoice.total,
                        status: selectedInvoice.status,
                        notes: selectedInvoice.notes || undefined,
                        paymentMethod: selectedInvoice.paymentMethod || undefined,
                        paidAt: selectedInvoice.paidAt || undefined,
                      }}
                      showWatermark={selectedInvoice.status === 'DRAFT'}
                    />
                  </PrintButton>
                </div>
              </div>

              {/* Aperçu de la facture */}
              <div className="bg-gray-50 rounded-lg p-4">
                <InvoiceTemplate
                  doctor={{
                    fullName: user?.fullName || 'Dr. Médecin',
                    specialty: (user as any)?.doctorProfile?.specialty,
                    address: (user as any)?.doctorProfile?.address,
                    city: (user as any)?.doctorProfile?.city,
                    phone: (user as any)?.phone,
                    email: user?.email,
                  }}
                  patient={{
                    fullName: `${selectedInvoice.patient.firstName} ${selectedInvoice.patient.lastName}`,
                    email: selectedInvoice.patient.email,
                  }}
                  invoice={{
                    invoiceNumber: selectedInvoice.invoiceNumber,
                    issueDate: selectedInvoice.issueDate,
                    dueDate: selectedInvoice.dueDate || undefined,
                    items: selectedInvoice.items,
                    subtotal: selectedInvoice.subtotal,
                    taxRate: selectedInvoice.taxRate,
                    taxAmount: selectedInvoice.taxAmount,
                    total: selectedInvoice.total,
                    status: selectedInvoice.status,
                    notes: selectedInvoice.notes || undefined,
                    paymentMethod: selectedInvoice.paymentMethod || undefined,
                    paidAt: selectedInvoice.paidAt || undefined,
                  }}
                  showWatermark={selectedInvoice.status === 'DRAFT'}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
