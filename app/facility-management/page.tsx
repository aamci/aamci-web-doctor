'use client';

import { useState, useEffect } from 'react';
import { Users, Calendar, Settings, ChevronDown } from 'lucide-react';
import DoctorAvailability from './_components/DoctorAvailability';
import DoctorPreferences from './_components/DoctorPreferences';

interface Doctor {
  id: string;
  fullName: string;
  email: string;
  doctorProfile: {
    specialty: string;
    city: string;
  };
}

export default function FacilityManagementPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [activeTab, setActiveTab] = useState<'availability' | 'preferences'>('availability');
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

  useEffect(() => {
    fetchManagedDoctors();
  }, []);

  const fetchManagedDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/facility-managers/me/doctors`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDoctors(data);
        if (data.length > 0) {
          setSelectedDoctor(data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching managed doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (doctors.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Aucun médecin assigné
            </h3>
            <p className="text-gray-600">
              Vous n'avez pas encore de médecins assignés à gérer. Contactez un administrateur.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-teal-600" />
            Gestion des disponibilités
          </h1>
          <p className="text-gray-600 mt-2">
            Gérez les emplois du temps et préférences de vos médecins
          </p>
        </div>

        {/* Doctor Selector */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sélectionnez un médecin
          </label>
          <div className="relative">
            <select
              value={selectedDoctor?.id || ''}
              onChange={(e) => {
                const doctor = doctors.find((d) => d.id === e.target.value);
                setSelectedDoctor(doctor || null);
              }}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 font-medium"
            >
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.fullName} - {doctor.doctorProfile.specialty} ({doctor.doctorProfile.city})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {selectedDoctor && (
          <>
            {/* Doctor Info Card */}
            <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg shadow-sm p-6 mb-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{selectedDoctor.fullName}</h2>
                  <div className="flex flex-col gap-1 text-teal-50">
                    <p className="text-sm">{selectedDoctor.doctorProfile.specialty}</p>
                    <p className="text-sm">{selectedDoctor.email}</p>
                    <p className="text-sm">{selectedDoctor.doctorProfile.city}</p>
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                  <p className="text-xs font-medium text-teal-50">ID Médecin</p>
                  <p className="text-sm font-mono">{selectedDoctor.id.slice(0, 8)}...</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="border-b border-gray-200">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('availability')}
                    className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-2 ${
                      activeTab === 'availability'
                        ? 'border-teal-600 text-teal-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Calendar className="w-5 h-5" />
                    Disponibilités
                  </button>
                  <button
                    onClick={() => setActiveTab('preferences')}
                    className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-2 ${
                      activeTab === 'preferences'
                        ? 'border-teal-600 text-teal-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Settings className="w-5 h-5" />
                    Préférences
                  </button>
                </div>
              </div>

              <div className="p-6">
                {activeTab === 'availability' && (
                  <DoctorAvailability doctorId={selectedDoctor.id} />
                )}
                {activeTab === 'preferences' && (
                  <DoctorPreferences doctorId={selectedDoctor.id} />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
