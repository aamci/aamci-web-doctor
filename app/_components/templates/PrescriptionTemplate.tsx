'use client';

import { forwardRef } from 'react';
import DocumentHeader, { type DoctorInfo } from './DocumentHeader';

export interface PatientInfo {
  fullName: string;
  birthDate?: string;
  gender?: 'MALE' | 'FEMALE';
  address?: string;
  city?: string;
}

export interface Medication {
  name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
  quantity?: number;
}

export interface PrescriptionData {
  prescriptionNumber?: string;
  issueDate: string;
  validUntil?: string;
  medications: Medication[];
  generalInstructions?: string;
  diagnosis?: string;
}

interface PrescriptionTemplateProps {
  doctor: DoctorInfo;
  patient: PatientInfo;
  prescription: PrescriptionData;
}

const PrescriptionTemplate = forwardRef<HTMLDivElement, PrescriptionTemplateProps>(
  ({ doctor, patient, prescription }, ref) => {
    const calculateAge = (birthDate: string) => {
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    };

    return (
      <div
        ref={ref}
        className="bg-white p-8 max-w-[210mm] mx-auto shadow-lg print:shadow-none print:p-0"
        style={{ minHeight: '297mm' }}
      >
        {/* En-tête */}
        <DocumentHeader
          doctor={doctor}
          documentTitle="Ordonnance"
          documentNumber={prescription.prescriptionNumber}
          documentDate={prescription.issueDate}
        />

        {/* Informations patient */}
        <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">
                Patient
              </h3>
              <p className="font-semibold text-gray-900 text-lg">{patient.fullName}</p>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                {patient.birthDate && (
                  <span>
                    Né(e) le{' '}
                    {new Date(patient.birthDate).toLocaleDateString('fr-FR')}
                    {' '}({calculateAge(patient.birthDate)} ans)
                  </span>
                )}
                {patient.gender && (
                  <span className="px-2 py-0.5 bg-white rounded text-xs font-medium">
                    {patient.gender === 'FEMALE' ? 'Féminin' : 'Masculin'}
                  </span>
                )}
              </div>
              {(patient.address || patient.city) && (
                <p className="text-sm text-gray-500 mt-1">
                  {patient.address}
                  {patient.address && patient.city && ', '}
                  {patient.city}
                </p>
              )}
            </div>

            {/* Validité */}
            {prescription.validUntil && (
              <div className="text-right">
                <p className="text-xs text-gray-500">Valable jusqu'au</p>
                <p className="font-semibold text-gray-900">
                  {new Date(prescription.validUntil).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Diagnostic (optionnel) */}
        {prescription.diagnosis && (
          <div className="mb-6 p-3 bg-gray-50 rounded-lg">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Diagnostic / Motif
            </h3>
            <p className="text-gray-800">{prescription.diagnosis}</p>
          </div>
        )}

        {/* Symbole Rx */}
        <div className="flex items-start gap-4 mb-6">
          <span className="text-4xl font-serif text-teal-600 leading-none">℞</span>
          <div className="flex-1 border-l-2 border-teal-200 pl-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
              Prescription
            </h3>

            {/* Liste des médicaments */}
            <div className="space-y-4">
              {prescription.medications.map((med, index) => (
                <div
                  key={index}
                  className="pb-4 border-b border-gray-200 last:border-0 last:pb-0"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-lg">
                        {index + 1}. {med.name}
                      </p>
                      {med.dosage && (
                        <p className="text-teal-600 font-medium">{med.dosage}</p>
                      )}
                    </div>
                    {med.quantity && (
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-700">
                        Qté: {med.quantity}
                      </span>
                    )}
                  </div>

                  <div className="mt-2 pl-4 space-y-1">
                    {med.frequency && (
                      <p className="text-gray-700">
                        <span className="text-gray-500">Posologie:</span> {med.frequency}
                      </p>
                    )}
                    {med.duration && (
                      <p className="text-gray-700">
                        <span className="text-gray-500">Durée:</span> {med.duration}
                      </p>
                    )}
                    {med.instructions && (
                      <p className="text-gray-600 italic text-sm mt-1">
                        → {med.instructions}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Instructions générales */}
        {prescription.generalInstructions && (
          <div className="mb-8 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <h3 className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">
              Instructions importantes
            </h3>
            <p className="text-amber-900 whitespace-pre-wrap">
              {prescription.generalInstructions}
            </p>
          </div>
        )}

        {/* Zone de signature */}
        <div className="mt-12 flex justify-end">
          <div className="text-center w-64">
            <div className="border-b-2 border-gray-300 pb-16 mb-2">
              {/* Espace pour la signature */}
            </div>
            <p className="text-sm font-medium text-gray-700">
              Signature et cachet du médecin
            </p>
          </div>
        </div>

        {/* Pied de page */}
        <div className="mt-auto pt-8 border-t border-gray-200">
          <div className="flex justify-between text-xs text-gray-500">
            <div>
              <p>Ordonnance à usage médical uniquement.</p>
              <p>Ne pas renouveler sans avis médical.</p>
            </div>
            <div className="text-right">
              <p>
                Document généré le{' '}
                {new Date().toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
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

PrescriptionTemplate.displayName = 'PrescriptionTemplate';

export default PrescriptionTemplate;
