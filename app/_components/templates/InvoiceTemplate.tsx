'use client';

import { forwardRef } from 'react';
import DocumentHeader, { type DoctorInfo } from './DocumentHeader';

export interface PatientInfo {
  fullName: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  total: number;
  notes?: string;
  paymentMethod?: string;
  paidAt?: string;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'CANCELLED' | 'OVERDUE';
}

interface InvoiceTemplateProps {
  doctor: DoctorInfo;
  patient: PatientInfo;
  invoice: InvoiceData;
  showWatermark?: boolean;
}

const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceTemplateProps>(
  ({ doctor, patient, invoice, showWatermark = false }, ref) => {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XAF',
        minimumFractionDigits: 0,
      }).format(amount);
    };

    const getStatusLabel = (status: InvoiceData['status']) => {
      const labels = {
        DRAFT: 'BROUILLON',
        SENT: 'ENVOYÉE',
        PAID: 'PAYÉE',
        CANCELLED: 'ANNULÉE',
        OVERDUE: 'EN RETARD',
      };
      return labels[status];
    };

    return (
      <div
        ref={ref}
        className="bg-white p-8 max-w-full mx-auto shadow-lg print:shadow-none print:p-0"
        style={{ minHeight: '297mm' }}
      >
        {/* Watermark pour brouillon */}
        {showWatermark && invoice.status === 'DRAFT' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none print:hidden">
            <span className="text-8xl font-bold text-gray-200 rotate-[-30deg] select-none">
              BROUILLON
            </span>
          </div>
        )}

        {/* En-tête */}
        <DocumentHeader
          doctor={doctor}
          documentTitle="Facture"
          documentNumber={invoice.invoiceNumber}
          documentDate={invoice.issueDate}
        />

        {/* Statut */}
        <div className="flex justify-end mb-6">
          <span
            className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
              invoice.status === 'PAID'
                ? 'bg-green-100 text-green-700'
                : invoice.status === 'CANCELLED'
                ? 'bg-red-100 text-red-700'
                : invoice.status === 'OVERDUE'
                ? 'bg-orange-100 text-orange-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {getStatusLabel(invoice.status)}
          </span>
        </div>

        {/* Informations patient */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Facturé à
          </h3>
          <p className="font-semibold text-gray-900">{patient.fullName}</p>
          {patient.address && <p className="text-sm text-gray-600">{patient.address}</p>}
          {patient.city && <p className="text-sm text-gray-600">{patient.city}</p>}
          {patient.phone && <p className="text-sm text-gray-600">Tél: {patient.phone}</p>}
          {patient.email && <p className="text-sm text-gray-600">{patient.email}</p>}
        </div>

        {/* Tableau des prestations */}
        <div className="mb-8">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-3 text-sm font-semibold text-gray-700">
                  Description
                </th>
                <th className="text-center py-3 text-sm font-semibold text-gray-700 w-20">
                  Qté
                </th>
                <th className="text-right py-3 text-sm font-semibold text-gray-700 w-28">
                  Prix unit.
                </th>
                <th className="text-right py-3 text-sm font-semibold text-gray-700 w-28">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="py-3 text-gray-900">{item.description}</td>
                  <td className="py-3 text-center text-gray-600">{item.quantity}</td>
                  <td className="py-3 text-right text-gray-600">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="py-3 text-right font-medium text-gray-900">
                    {formatCurrency(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totaux */}
        <div className="flex justify-end mb-8">
          <div className="w-64">
            <div className="flex justify-between py-2 text-sm">
              <span className="text-gray-600">Sous-total</span>
              <span className="text-gray-900">{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.taxRate && invoice.taxRate > 0 && (
              <div className="flex justify-between py-2 text-sm">
                <span className="text-gray-600">TVA ({invoice.taxRate}%)</span>
                <span className="text-gray-900">
                  {formatCurrency(invoice.taxAmount || 0)}
                </span>
              </div>
            )}
            <div className="flex justify-between py-3 border-t-2 border-gray-300 text-lg font-bold">
              <span className="text-gray-900">Total</span>
              <span className="text-teal-600">{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>

        {/* Échéance */}
        {invoice.dueDate && invoice.status !== 'PAID' && (
          <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <span className="font-semibold">Date d'échéance:</span>{' '}
              {new Date(invoice.dueDate).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        )}

        {/* Paiement effectué */}
        {invoice.status === 'PAID' && invoice.paidAt && (
          <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              <span className="font-semibold">Payée le:</span>{' '}
              {new Date(invoice.paidAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
              {invoice.paymentMethod && ` - ${invoice.paymentMethod}`}
            </p>
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Notes
            </h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}

        {/* Zone de signature */}
        {doctor.signatureUrl && (
          <div className="mt-8 flex justify-end">
            <div className="text-center w-56">
              <div className="border-b-2 border-gray-300 mb-2 flex items-end justify-center" style={{ minHeight: '72px' }}>
                <img
                  src={doctor.signatureUrl}
                  alt="Signature du médecin"
                  className="max-h-16 max-w-[200px] object-contain mb-1"
                />
              </div>
              <p className="text-xs font-medium text-gray-600">Signature du praticien</p>
              <p className="text-xs text-gray-500">{doctor.fullName}</p>
            </div>
          </div>
        )}

        {/* Pied de page */}
        <div className="mt-auto pt-8 border-t border-gray-200 text-center text-xs text-gray-500">
          <p>Merci pour votre confiance.</p>
          <p className="mt-1">
            Document généré le{' '}
            {new Date().toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>

        {/* Styles d'impression */}
        <style jsx>{`
          @media print {
            @page {
              size: A4;
              margin: 15mm;
            }
          }
        `}</style>
      </div>
    );
  }
);

InvoiceTemplate.displayName = 'InvoiceTemplate';

export default InvoiceTemplate;
