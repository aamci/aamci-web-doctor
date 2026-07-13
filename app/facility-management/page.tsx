'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../_providers/AuthProvider';
import { Users, Calendar, Settings, ChevronDown, UserPlus, Mail, Shield, Trash2, Loader2, Crown, TrendingUp, Wallet, CalendarCheck, ArrowUpRight, ArrowDownRight, Building2, Pencil, Check, X, Phone, MapPin, Globe, GraduationCap, Briefcase, Star, Bell, Plus, Search } from 'lucide-react';
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

interface DoctorFinance {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  specialty?: string;
  balance: number;
  totalEarned: number;
  totalWithdrawn: number;
  appointmentsThisMonth: number;
  appointmentsLastMonth: number;
}

interface FinanceTotals {
  totalBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
  appointmentsThisMonth: number;
  appointmentsLastMonth: number;
}

interface TeamMember {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  status: 'ACTIVE' | 'PENDING' | 'INACTIVE';
  isManager: boolean;
}

type TabKey = 'cabinet' | 'availability' | 'preferences' | 'finances' | 'staff';

function getVisibleTabs(role?: string): TabKey[] {
  switch (role) {
    case 'FACILITY_MANAGER': return ['cabinet', 'availability', 'preferences', 'finances', 'staff'];
    case 'DOCTOR':           return ['cabinet', 'availability', 'preferences', 'staff'];
    case 'SECRETARY':        return ['availability', 'preferences'];
    default:                 return ['availability', 'preferences'];
  }
}

export default function FacilityManagementPage() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('availability');

  // Finances state
  const [finances, setFinances] = useState<{ totals: FinanceTotals; perDoctor: DoctorFinance[] } | null>(null);
  const [loadingFinances, setLoadingFinances] = useState(false);
  const [loading, setLoading] = useState(true);

  // Staff state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ fullName: '', email: '', phone: '', role: 'SECRETARY' });
  const [inviting, setInviting] = useState(false);
  const [inviteErr, setInviteErr] = useState<string | null>(null);

  // Unread team invitations banner
  const [teamInviteBanner, setTeamInviteBanner] = useState<string | null>(null);

  // Cabinet state
  const [cabinetData, setCabinetData] = useState<any>(null);
  const [cabinetEditing, setCabinetEditing] = useState(false);

  // Gestion des établissements
  const [showFacilitySearch, setShowFacilitySearch] = useState(false);
  const [facilitySearchQ, setFacilitySearchQ] = useState('');
  const [facilitySearchResults, setFacilitySearchResults] = useState<any[]>([]);
  const [searchingFacility, setSearchingFacility] = useState(false);
  const [facilityActionLoading, setFacilityActionLoading] = useState<string | null>(null);
  const [cabinetForm, setCabinetForm] = useState<any>({});
  const [savingCabinet, setSavingCabinet] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

  const visibleTabs = useMemo(() => getVisibleTabs(user?.role), [user?.role]);

  // If activeTab becomes hidden (e.g. after role loads), fall back to first visible tab
  useEffect(() => {
    if (!visibleTabs.includes(activeTab)) {
      setActiveTab(visibleTabs[0]);
    }
  }, [visibleTabs]);

  useEffect(() => {
    if (user) fetchManagedDoctors();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('token');
    fetch(`${API_BASE_URL}/notifications?unreadOnly=true`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then((notifs: any[]) => {
        const inv = notifs.find(n => n.type === 'TEAM_INVITATION' || n.type === 'TEAM_JOINED');
        if (inv) setTeamInviteBanner(inv.message);
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (activeTab === 'cabinet') fetchCabinet();
  }, [activeTab]);

  const fetchManagedDoctors = async () => {
    try {
      const token = localStorage.getItem('token');

      if (user?.role === 'DOCTOR') {
        // DOCTOR: always manages themselves
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const me = await res.json();
          const self: Doctor = {
            id: me.id,
            fullName: me.fullName,
            email: me.email,
            doctorProfile: me.doctorProfile ?? { specialty: '', city: '' },
          };
          setDoctors([self]);
          setSelectedDoctor(self);
        }
      } else if (user?.role === 'SECRETARY') {
        const res = await fetch(`${API_BASE_URL}/team/my-membership`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const memberships = await res.json();
          const doctorList: Doctor[] = memberships
            .filter((m: any) => m.owner)
            .map((m: any) => ({
              id: m.owner.id,
              fullName: m.owner.fullName,
              email: m.owner.email,
              doctorProfile: m.owner.doctorProfile ?? { specialty: '', city: '' },
            }));
          setDoctors(doctorList);
          if (doctorList.length > 0) setSelectedDoctor(doctorList[0]);
        }
      } else {
        // FACILITY_MANAGER
        const response = await fetch(`${API_BASE_URL}/facility-managers/me/doctors`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setDoctors(data);
          if (data.length > 0) setSelectedDoctor(data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching managed doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCabinet = async () => {
    try {
      const token = localStorage.getItem('token');
      if (user?.role === 'FACILITY_MANAGER') {
        const res = await fetch(`${API_BASE_URL}/facility-managers/my-facility`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const services = typeof data.services === 'string'
            ? JSON.parse(data.services)
            : data.services ?? [];
          const parsed = { ...data, services };
          setCabinetData(parsed);
          setCabinetForm(parsed);
        }
      } else if (user?.role === 'DOCTOR') {
        const res = await fetch(`${API_BASE_URL}/doctor-profiles/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setCabinetData(data);
          setCabinetForm(data);
        }
      }
    } catch (e) {
      console.error('fetchCabinet error', e);
    }
  };

  const saveCabinet = async () => {
    setSavingCabinet(true);
    try {
      const token = localStorage.getItem('token');
      let url = '';
      let method = 'PUT';
      let body: any = cabinetForm;

      if (user?.role === 'FACILITY_MANAGER') {
        url = `${API_BASE_URL}/facility-managers/my-facility`;
        method = 'PATCH';
      } else if (user?.role === 'DOCTOR') {
        url = `${API_BASE_URL}/doctor-profiles/me`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const updated = await res.json();
        const services = typeof updated.services === 'string'
          ? JSON.parse(updated.services)
          : updated.services ?? updated.services;
        setCabinetData({ ...updated, ...(services !== undefined ? { services } : {}) });
        setCabinetEditing(false);
      }
    } catch (e) {
      console.error('saveCabinet error', e);
    } finally {
      setSavingCabinet(false);
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

  const fetchFinances = async () => {
    setLoadingFinances(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/facility-managers/me/finances`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFinances(data);
      }
    } catch { /* ignore */ }
    finally { setLoadingFinances(false); }
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

  const handleToggleManager = async (member: TeamMember) => {
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE_URL}/team/${member.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isManager: !member.isManager }),
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

  async function searchFacilities(q: string) {
    setFacilitySearchQ(q);
    if (!q.trim()) { setFacilitySearchResults([]); return; }
    setSearchingFacility(true);
    try {
      const res = await fetch(`${API_BASE_URL}/facilities?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : data?.data ?? [];
      const currentIds = new Set((cabinetData?.facilities ?? []).map((f: any) => f.id));
      setFacilitySearchResults(list.filter((f: any) => !currentIds.has(f.id)).slice(0, 6));
    } catch { setFacilitySearchResults([]); }
    finally { setSearchingFacility(false); }
  }

  async function joinFacility(facility: any) {
    const token = localStorage.getItem('token');
    setFacilityActionLoading(facility.id);
    try {
      await fetch(`${API_BASE_URL}/doctor-profiles/me/facilities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ facilityId: facility.id }),
      });
      setCabinetData((d: any) => ({ ...d, facilities: [...(d.facilities ?? []), facility] }));
      setFacilitySearchResults(r => r.filter(f => f.id !== facility.id));
      setShowFacilitySearch(false);
      setFacilitySearchQ('');
    } catch (e) { alert('Erreur : ' + (e as Error).message); }
    finally { setFacilityActionLoading(null); }
  }

  async function leaveFacility(facilityId: string) {
    if (!confirm('Quitter cet établissement ?')) return;
    const token = localStorage.getItem('token');
    setFacilityActionLoading(facilityId);
    try {
      await fetch(`${API_BASE_URL}/doctor-profiles/me/facilities/${facilityId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setCabinetData((d: any) => ({ ...d, facilities: (d.facilities ?? []).filter((f: any) => f.id !== facilityId) }));
    } catch (e) { alert('Erreur : ' + (e as Error).message); }
    finally { setFacilityActionLoading(null); }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Team invitation banner */}
        {teamInviteBanner && (
          <div className="flex items-start gap-3 bg-teal-50 border border-teal-200 rounded-xl p-4 mb-6">
            <Bell className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm text-teal-800">{teamInviteBanner}</div>
            <button onClick={() => setTeamInviteBanner(null)} className="text-teal-500 hover:text-teal-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            {user?.role === 'DOCTOR' ? <Building2 className="w-8 h-8 text-teal-600" /> : <Users className="w-8 h-8 text-teal-600" />}
            {user?.role === 'DOCTOR' ? 'Mon cabinet' : 'Gestion des disponibilités'}
          </h1>
          <p className="text-gray-600 mt-2">
            {user?.role === 'DOCTOR'
              ? 'Gérez votre profil, votre équipe et vos disponibilités'
              : 'Gérez les emplois du temps et préférences de vos médecins'}
          </p>
        </div>

        {/* Doctor Selector — hidden for DOCTOR (always themselves) */}
        {user?.role !== 'DOCTOR' && (
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
        )}

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
                <div className="flex overflow-x-auto">
                  {visibleTabs.includes('cabinet') && (
                    <button
                      onClick={() => setActiveTab('cabinet')}
                      className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-2 whitespace-nowrap ${
                        activeTab === 'cabinet'
                          ? 'border-teal-600 text-teal-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Building2 className="w-5 h-5" />
                      {user?.role === 'DOCTOR' ? 'Mon cabinet' : 'Établissement'}
                    </button>
                  )}
                  {visibleTabs.includes('availability') && (
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
                  )}
                  {visibleTabs.includes('preferences') && (
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
                  )}
                  {visibleTabs.includes('finances') && (
                    <button
                      onClick={() => { setActiveTab('finances'); fetchFinances(); }}
                      className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-2 ${
                        activeTab === 'finances'
                          ? 'border-teal-600 text-teal-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <TrendingUp className="w-5 h-5" />
                      Finances
                    </button>
                  )}
                  {visibleTabs.includes('staff') && (
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
                  )}
                </div>
              </div>

              <div className="p-6">
                {activeTab === 'cabinet' && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-base font-semibold text-gray-900">
                        {user?.role === 'DOCTOR' ? 'Profil du cabinet' : 'Informations de l\'établissement'}
                      </h3>
                      {!cabinetEditing ? (
                        <button
                          onClick={() => setCabinetEditing(true)}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-teal-600 border border-teal-200 rounded-lg hover:bg-teal-50 transition-colors"
                        >
                          <Pencil className="w-4 h-4" /> Modifier
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setCabinetEditing(false); setCabinetForm(cabinetData); }}
                            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                          >
                            <X className="w-4 h-4" /> Annuler
                          </button>
                          <button
                            onClick={saveCabinet}
                            disabled={savingCabinet}
                            className="flex items-center gap-1 px-4 py-2 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                          >
                            {savingCabinet ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            Enregistrer
                          </button>
                        </div>
                      )}
                    </div>

                    {!cabinetData ? (
                      <div className="text-center py-10 text-gray-400">
                        <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Chargement des informations…</p>
                      </div>
                    ) : user?.role === 'DOCTOR' ? (
                      /* ── DOCTOR: DoctorProfile fields ── */
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Spécialité</label>
                          {cabinetEditing ? (
                            <input value={cabinetForm.specialty ?? ''} onChange={e => setCabinetForm((f: any) => ({...f, specialty: e.target.value}))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                          ) : (
                            <p className="text-sm text-gray-900 flex items-center gap-2"><Star className="w-4 h-4 text-teal-500" />{cabinetData.specialty || '—'}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Type de cabinet</label>
                          {cabinetEditing ? (
                            <input value={cabinetForm.hospitalType ?? ''} onChange={e => setCabinetForm((f: any) => ({...f, hospitalType: e.target.value}))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                          ) : (
                            <p className="text-sm text-gray-900 flex items-center gap-2"><Briefcase className="w-4 h-4 text-teal-500" />{cabinetData.hospitalType || '—'}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Adresse</label>
                          {cabinetEditing ? (
                            <input value={cabinetForm.address ?? ''} onChange={e => setCabinetForm((f: any) => ({...f, address: e.target.value}))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                          ) : (
                            <p className="text-sm text-gray-900 flex items-center gap-2"><MapPin className="w-4 h-4 text-teal-500" />{cabinetData.address || '—'}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Ville</label>
                          {cabinetEditing ? (
                            <input value={cabinetForm.city ?? ''} onChange={e => setCabinetForm((f: any) => ({...f, city: e.target.value}))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                          ) : (
                            <p className="text-sm text-gray-900">{cabinetData.city || '—'}</p>
                          )}
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Présentation</label>
                          {cabinetEditing ? (
                            <textarea rows={4} value={cabinetForm.presentation ?? ''} onChange={e => setCabinetForm((f: any) => ({...f, presentation: e.target.value}))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none" />
                          ) : (
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{cabinetData.presentation || '—'}</p>
                          )}
                        </div>
                        <div className="md:col-span-2">
                          <label className="flex items-center gap-1 text-xs font-medium text-gray-500 mb-1"><GraduationCap className="w-4 h-4" /> Formations</label>
                          {cabinetEditing ? (
                            <textarea rows={3} value={cabinetForm.formations ?? ''} onChange={e => setCabinetForm((f: any) => ({...f, formations: e.target.value}))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none" />
                          ) : (
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{cabinetData.formations || '—'}</p>
                          )}
                        </div>
                        <div className="md:col-span-2">
                          <label className="flex items-center gap-1 text-xs font-medium text-gray-500 mb-1"><Briefcase className="w-4 h-4" /> Expériences</label>
                          {cabinetEditing ? (
                            <textarea rows={3} value={cabinetForm.experiences ?? ''} onChange={e => setCabinetForm((f: any) => ({...f, experiences: e.target.value}))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none" />
                          ) : (
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{cabinetData.experiences || '—'}</p>
                          )}
                        </div>
                        <div className="md:col-span-2">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-medium text-gray-500">Mes établissements</label>
                            <button
                              type="button"
                              onClick={() => { setShowFacilitySearch(!showFacilitySearch); setFacilitySearchQ(''); setFacilitySearchResults([]); }}
                              className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium"
                            >
                              <Plus className="w-3.5 h-3.5" /> Rejoindre un établissement
                            </button>
                          </div>

                          {/* Recherche établissement */}
                          {showFacilitySearch && (
                            <div className="mb-3 relative">
                              <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-white">
                                <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <input
                                  autoFocus
                                  value={facilitySearchQ}
                                  onChange={e => searchFacilities(e.target.value)}
                                  placeholder="Rechercher un établissement…"
                                  className="flex-1 text-sm outline-none"
                                />
                                {searchingFacility && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />}
                              </div>
                              {facilitySearchResults.length > 0 && (
                                <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                                  {facilitySearchResults.map(f => (
                                    <button
                                      key={f.id}
                                      type="button"
                                      disabled={facilityActionLoading === f.id}
                                      onClick={() => joinFacility(f)}
                                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-teal-50 text-left transition-colors"
                                    >
                                      <Building2 className="w-4 h-4 text-teal-500 shrink-0" />
                                      <div>
                                        <p className="text-sm font-medium text-gray-800">{f.name}</p>
                                        <p className="text-xs text-gray-500">{f.type}{f.city ? ` · ${f.city}` : ''}</p>
                                      </div>
                                      {facilityActionLoading === f.id && <Loader2 className="w-3.5 h-3.5 animate-spin ml-auto" />}
                                    </button>
                                  ))}
                                </div>
                              )}
                              {facilitySearchQ && !searchingFacility && facilitySearchResults.length === 0 && (
                                <p className="mt-1 text-xs text-gray-400 px-1">Aucun établissement trouvé</p>
                              )}
                            </div>
                          )}

                          {/* Liste des établissements actuels */}
                          {(cabinetData.facilities ?? []).length === 0 ? (
                            <p className="text-xs text-gray-400 italic">Aucun établissement associé</p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {(cabinetData.facilities ?? []).map((f: any) => (
                                <div key={f.id} className="flex items-center gap-1.5 px-3 py-1 bg-teal-50 border border-teal-100 rounded-full text-xs font-medium text-teal-700">
                                  <Building2 className="w-3 h-3" />
                                  <span>{f.name}{f.city ? ` · ${f.city}` : ''}</span>
                                  <button
                                    type="button"
                                    disabled={facilityActionLoading === f.id}
                                    onClick={() => leaveFacility(f.id)}
                                    className="ml-1 text-teal-400 hover:text-red-500 transition-colors disabled:opacity-50"
                                    title="Quitter cet établissement"
                                  >
                                    {facilityActionLoading === f.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* ── FACILITY_MANAGER: Facility fields ── */
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Nom de l'établissement</label>
                          {cabinetEditing ? (
                            <input value={cabinetForm.name ?? ''} onChange={e => setCabinetForm((f: any) => ({...f, name: e.target.value}))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                          ) : (
                            <p className="text-sm font-semibold text-gray-900">{cabinetData.name || '—'}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                          {cabinetEditing ? (
                            <select value={cabinetForm.type ?? ''} onChange={e => setCabinetForm((f: any) => ({...f, type: e.target.value}))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                              <option value="CLINIC">Clinique</option>
                              <option value="CHU">CHU</option>
                              <option value="POLYCLINIC">Polyclinique</option>
                              <option value="CENTER">Centre médical</option>
                            </select>
                          ) : (
                            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">{cabinetData.type}</span>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Adresse</label>
                          {cabinetEditing ? (
                            <input value={cabinetForm.address ?? ''} onChange={e => setCabinetForm((f: any) => ({...f, address: e.target.value}))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                          ) : (
                            <p className="text-sm text-gray-900 flex items-center gap-2"><MapPin className="w-4 h-4 text-teal-500" />{cabinetData.address || '—'}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Ville</label>
                          {cabinetEditing ? (
                            <input value={cabinetForm.city ?? ''} onChange={e => setCabinetForm((f: any) => ({...f, city: e.target.value}))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                          ) : (
                            <p className="text-sm text-gray-900">{cabinetData.city || '—'}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Téléphone</label>
                          {cabinetEditing ? (
                            <input value={cabinetForm.phone ?? ''} onChange={e => setCabinetForm((f: any) => ({...f, phone: e.target.value}))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                          ) : (
                            <p className="text-sm text-gray-900 flex items-center gap-2"><Phone className="w-4 h-4 text-teal-500" />{cabinetData.phone || '—'}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                          {cabinetEditing ? (
                            <input type="email" value={cabinetForm.email ?? ''} onChange={e => setCabinetForm((f: any) => ({...f, email: e.target.value}))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                          ) : (
                            <p className="text-sm text-gray-900 flex items-center gap-2"><Mail className="w-4 h-4 text-teal-500" />{cabinetData.email || '—'}</p>
                          )}
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Site web</label>
                          {cabinetEditing ? (
                            <input value={cabinetForm.website ?? ''} onChange={e => setCabinetForm((f: any) => ({...f, website: e.target.value}))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                          ) : (
                            <p className="text-sm text-gray-900 flex items-center gap-2">
                              <Globe className="w-4 h-4 text-teal-500" />
                              {cabinetData.website ? <a href={cabinetData.website} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">{cabinetData.website}</a> : '—'}
                            </p>
                          )}
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                          {cabinetEditing ? (
                            <textarea rows={3} value={cabinetForm.description ?? ''} onChange={e => setCabinetForm((f: any) => ({...f, description: e.target.value}))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none" />
                          ) : (
                            <p className="text-sm text-gray-700">{cabinetData.description || '—'}</p>
                          )}
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-500 mb-2">Services proposés</label>
                          {cabinetEditing ? (
                            <input
                              value={Array.isArray(cabinetForm.services) ? cabinetForm.services.join(', ') : ''}
                              onChange={e => setCabinetForm((f: any) => ({...f, services: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean)}))}
                              placeholder="Cardiologie, Pédiatrie, Urgences…"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {(Array.isArray(cabinetData.services) ? cabinetData.services : []).map((s: string) => (
                                <span key={s} className="px-3 py-1 bg-teal-50 text-teal-700 text-xs rounded-full border border-teal-100 font-medium">{s}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
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
                          <div key={m.id} className={`flex items-center gap-4 p-4 border rounded-xl hover:bg-gray-50 transition-colors ${m.isManager ? 'border-amber-200 bg-amber-50/30' : 'border-gray-100'}`}>
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm ${m.isManager ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-teal-700'}`}>
                              {m.fullName.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-900 truncate">{m.fullName}</p>
                                {m.isManager && (
                                  <span className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                                    <Crown className="w-3 h-3" />
                                    Gestionnaire
                                  </span>
                                )}
                              </div>
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
                              {m.status === 'ACTIVE' && (
                                <button
                                  onClick={() => handleToggleManager(m)}
                                  title={m.isManager ? 'Retirer les droits gestionnaire' : 'Nommer gestionnaire'}
                                  className={`p-1.5 rounded-lg transition-colors ${m.isManager ? 'text-amber-500 bg-amber-50 hover:bg-amber-100' : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'}`}
                                >
                                  <Crown className="w-3.5 h-3.5" />
                                </button>
                              )}
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

            {/* Finances tab content */}
            {activeTab === 'finances' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6">
                  {loadingFinances ? (
                    <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-teal-600" /></div>
                  ) : !finances ? (
                    <div className="text-center py-16 text-gray-400">
                      <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="font-medium text-gray-500">Aucune donnée financière</p>
                      <button onClick={fetchFinances} className="mt-3 text-sm text-teal-600 hover:underline">Charger les données</button>
                    </div>
                  ) : (
                    <div>
                      {/* Summary cards */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-teal-50 rounded-xl p-4 border border-teal-100">
                          <div className="flex items-center gap-2 mb-1">
                            <Wallet className="w-4 h-4 text-teal-600" />
                            <span className="text-xs text-teal-600 font-medium">Solde total</span>
                          </div>
                          <p className="text-2xl font-bold text-teal-800">{(finances.totals.totalBalance / 100).toFixed(0)} FCFA</p>
                        </div>
                        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                          <div className="flex items-center gap-2 mb-1">
                            <ArrowUpRight className="w-4 h-4 text-green-600" />
                            <span className="text-xs text-green-600 font-medium">CA total</span>
                          </div>
                          <p className="text-2xl font-bold text-green-800">{(finances.totals.totalEarned / 100).toFixed(0)} FCFA</p>
                        </div>
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                          <div className="flex items-center gap-2 mb-1">
                            <CalendarCheck className="w-4 h-4 text-blue-600" />
                            <span className="text-xs text-blue-600 font-medium">RDV ce mois</span>
                          </div>
                          <p className="text-2xl font-bold text-blue-800">{finances.totals.appointmentsThisMonth}</p>
                          {finances.totals.appointmentsLastMonth > 0 && (
                            <p className={`text-xs mt-0.5 flex items-center gap-1 ${finances.totals.appointmentsThisMonth >= finances.totals.appointmentsLastMonth ? 'text-green-600' : 'text-red-500'}`}>
                              {finances.totals.appointmentsThisMonth >= finances.totals.appointmentsLastMonth
                                ? <ArrowUpRight className="w-3 h-3" />
                                : <ArrowDownRight className="w-3 h-3" />}
                              vs {finances.totals.appointmentsLastMonth} mois dernier
                            </p>
                          )}
                        </div>
                        <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                          <div className="flex items-center gap-2 mb-1">
                            <ArrowDownRight className="w-4 h-4 text-purple-600" />
                            <span className="text-xs text-purple-600 font-medium">Retraits total</span>
                          </div>
                          <p className="text-2xl font-bold text-purple-800">{(finances.totals.totalWithdrawn / 100).toFixed(0)} FCFA</p>
                        </div>
                      </div>

                      {/* Per-doctor table */}
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Détail par médecin</h3>
                      <div className="overflow-x-auto rounded-xl border border-gray-100">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Médecin</th>
                              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Solde</th>
                              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">CA total</th>
                              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">RDV ce mois</th>
                              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">RDV mois préc.</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {finances.perDoctor.map((d) => (
                              <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xs font-semibold">
                                      {d.fullName?.charAt(0) ?? '?'}
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900">{d.fullName}</p>
                                      {d.specialty && <p className="text-xs text-gray-400">{d.specialty}</p>}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right font-semibold text-teal-700">{(d.balance / 100).toFixed(2)} FCFA</td>
                                <td className="px-4 py-3 text-right text-gray-700">{(d.totalEarned / 100).toFixed(2)} FCFA</td>
                                <td className="px-4 py-3 text-right">
                                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">{d.appointmentsThisMonth}</span>
                                </td>
                                <td className="px-4 py-3 text-right text-gray-500 text-xs">{d.appointmentsLastMonth}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

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
