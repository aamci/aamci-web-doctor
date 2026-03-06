'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Calendar, Settings, ChevronDown, UserPlus, Mail, Shield, Trash2, Loader2 } from 'lucide-react';
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

interface TeamMember {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  status: 'ACTIVE' | 'PENDING' | 'INACTIVE';
}

export default function FacilityManagementPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [activeTab, setActiveTab] = useState<'availability' | 'preferences' | 'staff'>('availability');
  const [loading, setLoading] = useState(true);

  // Staff state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ fullName: '', email: '', phone: '', role: 'SECRETARY' });
  const [inviting, setInviting] = useState(false);
  const [inviteErr, setInviteErr] = useState<string | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

  useEffect(() => {
    fetchManagedDoctors();
  }, []);

  const fetchManagedDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/facility-managers/me/doctors`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setDoctors(data);
        if (data.length > 0) setSelectedDoctor(data[0]);
      }
    } catch (error) {
      console.error('Error fetching managed doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    setLoadingStaff(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/team`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTeamMembers(data);
      }
    } catch { /* ignore */ }
    finally { setLoadingStaff(false); }
  };

  const handleInvite = async () => {
    setInviteErr(null);
    if (!inviteForm.fullName || !inviteForm.email) { setInviteErr('Nom et email obligatoires.'); return; }
    setInviting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/team/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(inviteForm),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setInviteErr(d.message || 'Erreur lors de l\'invitation.');
        return;
      }
      setShowInviteModal(false);
      setInviteForm({ fullName: '', email: '', phone: '', role: 'SECRETARY' });
      fetchStaff();
    } catch { setInviteErr('Erreur réseau.'); }
    finally { setInviting(false); }
  };

  const handleDeactivate = async (memberId: string) => {
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE_URL}/team/${memberId}/deactivate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchStaff();
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
                  <button
                    onClick={() => { setActiveTab('staff'); fetchStaff(); }}
                    className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-2 ${
                      activeTab === 'staff'
                        ? 'border-teal-600 text-teal-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Users className="w-5 h-5" />
                    Personnel
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
                {activeTab === 'staff' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-gray-500">Secrétaires et assistants rattachés à votre établissement</p>
                      <button
                        onClick={() => setShowInviteModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
                      >
                        <UserPlus className="w-4 h-4" />
                        Inviter un membre
                      </button>
                    </div>
                    {loadingStaff ? (
                      <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-teal-600" /></div>
                    ) : teamMembers.length === 0 ? (
                      <div className="text-center py-10 text-gray-400">
                        <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Aucun membre dans votre équipe.</p>
                        <button onClick={() => setShowInviteModal(true)} className="mt-3 text-sm text-teal-600 hover:underline">
                          + Inviter le premier membre
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {teamMembers.map((m) => (
                          <div key={m.id} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:bg-gray-50">
                            <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center font-semibold text-teal-700 text-sm">
                              {m.fullName.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{m.fullName}</p>
                              <p className="text-xs text-gray-500 flex items-center gap-1"><Mail className="w-3 h-3" />{m.email}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full flex items-center gap-1">
                                <Shield className="w-3 h-3" />{m.role}
                              </span>
                              <span className={`px-2 py-0.5 text-xs rounded-full ${
                                m.status === 'ACTIVE' ? 'bg-green-50 text-green-700' :
                                m.status === 'PENDING' ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-500'
                              }`}>{m.status}</span>
                              {m.status !== 'INACTIVE' && (
                                <button onClick={() => handleDeactivate(m.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Désactiver">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Invite modal */}
            {showInviteModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Inviter un membre de l&apos;équipe</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                      <input type="text" value={inviteForm.fullName} onChange={(e) => setInviteForm(f => ({...f, fullName: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input type="email" value={inviteForm.email} onChange={(e) => setInviteForm(f => ({...f, email: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                      <input type="tel" value={inviteForm.phone} onChange={(e) => setInviteForm(f => ({...f, phone: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                      <select value={inviteForm.role} onChange={(e) => setInviteForm(f => ({...f, role: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                        <option value="SECRETARY">Secrétaire</option>
                        <option value="NURSE">Infirmier(ère)</option>
                        <option value="ASSISTANT">Assistant(e)</option>
                        <option value="INTERN">Stagiaire</option>
                      </select>
                    </div>
                    {inviteErr && <p className="text-sm text-red-600">{inviteErr}</p>}
                  </div>
                  <div className="flex gap-3 mt-5">
                    <button onClick={() => { setShowInviteModal(false); setInviteErr(null); }}
                      className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                      Annuler
                    </button>
                    <button onClick={handleInvite} disabled={inviting}
                      className="flex-1 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50">
                      {inviting ? 'Envoi…' : 'Inviter'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
