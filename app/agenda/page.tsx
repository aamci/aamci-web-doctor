'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../_providers/AuthProvider';
import {
  Calendar, ChevronDown, Plus, Search, Check, X, Clock, User,
  AlertCircle, Loader2, ChevronLeft, ChevronRight, Phone, Mail,
  CalendarCheck, CalendarX, Ban, FileText,
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

interface Doctor { id: string; fullName: string; doctorProfile: { specialty: string; city: string } }
interface Patient { id: string; fullName: string; email: string; phone?: string }
interface AppointmentKind { id: string; name: string; durationMins: number; price?: number }
interface Appointment {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'NO_SHOW' | 'COMPLETED';
  notes?: string;
  slot: { start: string; end: string; ownerId: string };
  patient?: Patient;
  kind?: AppointmentKind;
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente', CONFIRMED: 'Confirmé', CANCELLED: 'Annulé',
  NO_SHOW: 'Absent', COMPLETED: 'Terminé',
};
const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  NO_SHOW: 'bg-gray-100 text-gray-500',
  COMPLETED: 'bg-blue-100 text-blue-700',
};

function fmt(d: string) {
  return new Date(d).toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function AgendaPage() {
  const { user } = useAuth();
  const token = () => localStorage.getItem('token');

  // Employer doctors (for SECRETARY)
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  // Appointments
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // New appointment modal
  const [showModal, setShowModal] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [kinds, setKinds] = useState<AppointmentKind[]>([]);
  const [form, setForm] = useState({ date: '', startTime: '', duration: 30, kindId: '', notes: '' });
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState<string | null>(null);

  // Action state
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Date filter
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('week');

  useEffect(() => {
    if (user?.role === 'SECRETARY') {
      fetchEmployerDoctors();
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (selectedDoctor) {
      fetchKinds(selectedDoctor.id);
    }
  }, [selectedDoctor]);

  useEffect(() => {
    fetchAppointments();
  }, [selectedDoctor, dateFilter]);

  const fetchEmployerDoctors = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/team/my-membership`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (res.ok) {
        const memberships = await res.json();
        const docs: Doctor[] = memberships
          .filter((m: any) => m.owner)
          .map((m: any) => ({
            id: m.owner.id,
            fullName: m.owner.fullName,
            doctorProfile: m.owner.doctorProfile ?? { specialty: '', city: '' },
          }));
        setDoctors(docs);
        if (docs.length > 0) setSelectedDoctor(docs[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/appointments`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (res.ok) {
        const all: Appointment[] = await res.json();
        setAppointments(all);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchKinds = async (doctorId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/appointment-kinds/doctor/${doctorId}`);
      if (res.ok) setKinds(await res.json());
    } catch (e) { /* silent */ }
  };

  const searchPatients = async (q: string) => {
    if (!q || q.length < 2) { setPatientResults([]); return; }
    setSearchingPatients(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users/search?q=${encodeURIComponent(q)}&role=PATIENT`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (res.ok) setPatientResults(await res.json());
    } catch (e) { /* silent */ }
    finally { setSearchingPatients(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    setActionLoading(id);
    try {
      await fetch(`${API_BASE_URL}/appointments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ status }),
      });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: status as any } : a));
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  const createAppointment = async () => {
    if (!selectedPatient || !form.date || !form.startTime || !selectedDoctor) {
      setCreateErr('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    setCreating(true);
    setCreateErr(null);
    try {
      const start = new Date(`${form.date}T${form.startTime}`);
      const end = new Date(start.getTime() + form.duration * 60000);
      const res = await fetch(`${API_BASE_URL}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({
          doctorId: selectedDoctor.id,
          patientId: selectedPatient.id,
          slotStart: start.toISOString(),
          slotEnd: end.toISOString(),
          kindId: form.kindId || undefined,
          notes: form.notes || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setCreateErr(d.message || 'Erreur lors de la création du rendez-vous.');
        return;
      }
      setShowModal(false);
      setSelectedPatient(null);
      setPatientSearch('');
      setPatientResults([]);
      setForm({ date: '', startTime: '', duration: 30, kindId: '', notes: '' });
      fetchAppointments();
    } catch (e) {
      setCreateErr('Erreur réseau.');
    } finally {
      setCreating(false);
    }
  };

  // Filter appointments
  const now = new Date();
  const filtered = appointments.filter(a => {
    // Doctor filter (secretary may have multiple employers)
    if (selectedDoctor && a.slot.ownerId !== selectedDoctor.id) return false;

    // Date filter
    const apptDate = new Date(a.slot.start);
    if (dateFilter === 'today') {
      const today = new Date(); today.setHours(0,0,0,0);
      const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
      if (apptDate < today || apptDate >= tomorrow) return false;
    } else if (dateFilter === 'week') {
      const weekEnd = new Date(now); weekEnd.setDate(weekEnd.getDate()+7);
      const weekStart = new Date(now); weekStart.setDate(weekStart.getDate()-1);
      if (apptDate < weekStart || apptDate > weekEnd) return false;
    } else if (dateFilter === 'month') {
      const monthEnd = new Date(now); monthEnd.setMonth(monthEnd.getMonth()+1);
      if (apptDate < now || apptDate > monthEnd) return false;
    }

    // Status filter
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;

    // Search
    if (search) {
      const q = search.toLowerCase();
      const patientName = a.patient?.fullName?.toLowerCase() ?? '';
      const kindName = a.kind?.name?.toLowerCase() ?? '';
      if (!patientName.includes(q) && !kindName.includes(q)) return false;
    }

    return true;
  });

  const today = filtered.filter(a => {
    const d = new Date(a.slot.start); const t = new Date(); t.setHours(0,0,0,0);
    const t2 = new Date(t); t2.setDate(t2.getDate()+1);
    return d >= t && d < t2;
  });

  if (!user) return null;

  if (user.role !== 'SECRETARY') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Ban className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Cette page est réservée aux secrétaires.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-7 h-7 text-teal-600" />
              Agenda
            </h1>
            <p className="text-sm text-gray-500 mt-1">Gérez les rendez-vous de votre médecin</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Nouveau RDV
          </button>
        </div>

        {/* Doctor selector */}
        {doctors.length > 1 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-5">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Médecin</label>
            <div className="relative">
              <select
                value={selectedDoctor?.id ?? ''}
                onChange={e => setSelectedDoctor(doctors.find(d => d.id === e.target.value) ?? null)}
                className="w-full pl-3 pr-8 py-2.5 border border-gray-300 rounded-lg text-sm appearance-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>{d.fullName} — {d.doctorProfile.specialty}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Aujourd'hui", count: today.length, color: 'bg-blue-50 text-blue-700 border-blue-100' },
            { label: 'En attente', count: filtered.filter(a => a.status === 'PENDING').length, color: 'bg-amber-50 text-amber-700 border-amber-100' },
            { label: 'Confirmés', count: filtered.filter(a => a.status === 'CONFIRMED').length, color: 'bg-green-50 text-green-700 border-green-100' },
            { label: 'Annulés', count: filtered.filter(a => a.status === 'CANCELLED').length, color: 'bg-red-50 text-red-700 border-red-100' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl p-4 border ${s.color}`}>
              <p className="text-2xl font-bold">{s.count}</p>
              <p className="text-xs font-medium opacity-80">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher patient, type…"
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {/* Date filter */}
          <div className="flex gap-1">
            {(['today', 'week', 'month', 'all'] as const).map(f => (
              <button
                key={f}
                onClick={() => setDateFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${dateFilter === f ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {f === 'today' ? "Aujourd'hui" : f === 'week' ? 'Cette semaine' : f === 'month' ? 'Ce mois' : 'Tout'}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="pl-3 pr-7 py-2 border border-gray-200 rounded-lg text-sm appearance-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="ALL">Tous statuts</option>
              {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Appointment list */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Aucun rendez-vous</p>
              <p className="text-sm text-gray-400 mt-1">Modifiez les filtres ou créez un nouveau RDV</p>
              <button onClick={() => setShowModal(true)} className="mt-4 flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm mx-auto hover:bg-teal-700">
                <Plus className="w-4 h-4" /> Nouveau RDV
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map(appt => (
                <div key={appt.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                  {/* Time */}
                  <div className="w-28 flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(appt.slot.start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(appt.slot.start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>

                  {/* Patient */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xs font-semibold flex-shrink-0">
                        {appt.patient?.fullName?.charAt(0) ?? '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{appt.patient?.fullName ?? 'Patient inconnu'}</p>
                        <p className="text-xs text-gray-400">{appt.kind?.name ?? 'Consultation'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="hidden md:flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="w-3.5 h-3.5" />
                    {Math.round((new Date(appt.slot.end).getTime() - new Date(appt.slot.start).getTime()) / 60000)} min
                  </div>

                  {/* Status badge */}
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[appt.status]}`}>
                    {STATUS_LABELS[appt.status]}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {appt.status === 'PENDING' && (
                      <button
                        onClick={() => updateStatus(appt.id, 'CONFIRMED')}
                        disabled={actionLoading === appt.id}
                        title="Confirmer"
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        {actionLoading === appt.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarCheck className="w-4 h-4" />}
                      </button>
                    )}
                    {(appt.status === 'PENDING' || appt.status === 'CONFIRMED') && (
                      <button
                        onClick={() => updateStatus(appt.id, 'CANCELLED')}
                        disabled={actionLoading === appt.id}
                        title="Annuler"
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <CalendarX className="w-4 h-4" />
                      </button>
                    )}
                    {appt.status === 'CONFIRMED' && new Date(appt.slot.start) < now && (
                      <button
                        onClick={() => updateStatus(appt.id, 'NO_SHOW')}
                        disabled={actionLoading === appt.id}
                        title="Absent"
                        className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <AlertCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New appointment modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Nouveau rendez-vous</h2>
              <button onClick={() => { setShowModal(false); setCreateErr(null); setSelectedPatient(null); setPatientSearch(''); setPatientResults([]); }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Doctor (if multiple) */}
              {doctors.length > 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Médecin</label>
                  <select
                    value={selectedDoctor?.id ?? ''}
                    onChange={e => setSelectedDoctor(doctors.find(d => d.id === e.target.value) ?? null)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                  >
                    {doctors.map(d => <option key={d.id} value={d.id}>{d.fullName}</option>)}
                  </select>
                </div>
              )}

              {/* Patient search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient <span className="text-red-500">*</span></label>
                {selectedPatient ? (
                  <div className="flex items-center gap-3 p-3 bg-teal-50 rounded-lg border border-teal-200">
                    <div className="w-8 h-8 rounded-full bg-teal-200 flex items-center justify-center text-teal-700 text-sm font-semibold">
                      {selectedPatient.fullName.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{selectedPatient.fullName}</p>
                      <p className="text-xs text-gray-500">{selectedPatient.email}</p>
                    </div>
                    <button onClick={() => { setSelectedPatient(null); setPatientSearch(''); }} className="text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      value={patientSearch}
                      onChange={e => { setPatientSearch(e.target.value); searchPatients(e.target.value); }}
                      placeholder="Rechercher un patient par nom ou email…"
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                    {searchingPatients && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                    )}
                    {patientResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-10 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                        {patientResults.map(p => (
                          <button
                            key={p.id}
                            onClick={() => { setSelectedPatient(p); setPatientResults([]); setPatientSearch(''); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-left transition-colors"
                          >
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-sm font-medium flex-shrink-0">
                              {p.fullName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{p.fullName}</p>
                              <p className="text-xs text-gray-400">{p.email}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {patientSearch.length >= 2 && !searchingPatients && patientResults.length === 0 && (
                      <div className="absolute top-full left-0 right-0 z-10 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 px-3 py-2 text-sm text-gray-500">
                        Aucun patient trouvé
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Date & time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={form.date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Heure <span className="text-red-500">*</span></label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Durée</label>
                <select
                  value={form.duration}
                  onChange={e => setForm(f => ({ ...f, duration: +e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                >
                  {[15, 20, 30, 45, 60, 90].map(d => <option key={d} value={d}>{d} min</option>)}
                </select>
              </div>

              {/* Appointment type */}
              {kinds.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type de consultation</label>
                  <select
                    value={form.kindId}
                    onChange={e => {
                      const k = kinds.find(k => k.id === e.target.value);
                      setForm(f => ({ ...f, kindId: e.target.value, duration: k?.durationMins ?? f.duration }));
                    }}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">— Choisir un type —</option>
                    {kinds.map(k => <option key={k.id} value={k.id}>{k.name} ({k.durationMins} min)</option>)}
                  </select>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optionnel)</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Motif, remarques…"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>

              {createErr && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{createErr}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button
                onClick={() => { setShowModal(false); setCreateErr(null); setSelectedPatient(null); setPatientSearch(''); setPatientResults([]); }}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={createAppointment}
                disabled={creating}
                className="flex-1 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Créer le rendez-vous
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
