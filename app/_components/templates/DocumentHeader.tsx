'use client';

import { Building2 } from 'lucide-react';

export interface DoctorInfo {
  fullName: string;
  specialty?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  registrationNumber?: string; // Numéro ONMC/Ordre
  logoUrl?: string;
}

interface DocumentHeaderProps {
  doctor: DoctorInfo;
  documentTitle: string;
  documentNumber?: string;
  documentDate: string;
}

export default function DocumentHeader({
  doctor,
  documentTitle,
  documentNumber,
  documentDate,
}: DocumentHeaderProps) {
  return (
    <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-gray-200">
      {/* Logo et infos médecin */}
      <div className="flex items-start gap-4">
        {/* Espace Logo */}
        <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 flex-shrink-0">
          {doctor.logoUrl ? (
            <img
              src={doctor.logoUrl}
              alt="Logo"
              className="w-full h-full object-contain rounded-lg"
            />
          ) : (
            <div className="text-center">
              <Building2 className="w-8 h-8 text-gray-400 mx-auto" />
              <span className="text-[8px] text-gray-400 mt-1 block">LOGO</span>
            </div>
          )}
        </div>

        {/* Infos du médecin */}
        <div>
          <h2 className="text-lg font-bold text-gray-900">{doctor.fullName}</h2>
          {doctor.specialty && (
            <p className="text-sm text-teal-600 font-medium">{doctor.specialty}</p>
          )}
          {doctor.registrationNumber && (
            <p className="text-xs text-gray-500 mt-1">
              N° Ordre: {doctor.registrationNumber}
            </p>
          )}
          <div className="mt-2 text-xs text-gray-600 space-y-0.5">
            {doctor.address && <p>{doctor.address}</p>}
            {doctor.city && <p>{doctor.city}</p>}
            {doctor.phone && <p>Tél: {doctor.phone}</p>}
            {doctor.email && <p>{doctor.email}</p>}
          </div>
        </div>
      </div>

      {/* Titre et numéro du document */}
      <div className="text-right">
        <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">
          {documentTitle}
        </h1>
        {documentNumber && (
          <p className="text-sm text-gray-600 mt-1">N° {documentNumber}</p>
        )}
        <p className="text-sm text-gray-600 mt-1">
          Date: {new Date(documentDate).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </div>
    </div>
  );
}
