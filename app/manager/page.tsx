'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../_providers/AuthProvider';
import {
  Calendar, Clock, CheckCircle, XCircle, AlertCircle,
  ChevronLeft, ChevronRight, Stethoscope,
  RefreshCw, Mail, Plus, Trash2,
} from 'lucide-react';
import CreateAvailabilityWizard from '../planning/_components/CreateAvailabilityWizard';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

type Appointment = {
  id: string;
  status: string;
  notes: string | null;
  patient: { id: string; fullName: string | null; email: string; phone: string | null; avatarUrl: string | null };
  slot: { start: string; end: string; ownerId: string };
  kind: { name: string; durationMins: number; isTelemedicine: boolean } | null;
};

type Doctor = {
  id: string;
  fullName: string | null;
  email: string;
  avatarUrl: string | null;
  doctorProfile: { specialty: string | null } | null;
};

type AvailabilityRule = {
  id: string;
  startDate: string;
  endDate: string;
  daysOfWeek: number[];
  startHour: number;
  endHour: number;
  slotDurationMins: number;
  capacity: number;
  status: string;
};

const DAY_LABELS = ['', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING:   { label: 'En attente', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  CONFIRMED: { label: 'Confirmé',   color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  CANCELLED: { label: 'Annulé',     color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
  COMPLETED: { label: 'Terminé',    color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
  NO_SHOW:   { label: 'Absent',     color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
};

function authHeaders(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function ManagerPage() {
  const { user } = useAuth();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const [doctors, setDoctors]           = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading]           = useState(true);
  const [loadingAppts, setLoadingAppts] = useState(false);

  // Filters
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate]     = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedStatus, setSelectedStatus] = useState('');

  // Actions
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reminderSent, setReminderSent]   = useState<Set<string>>(new Set());

  // Wizard
  const [wizardOpen, setWizardOpen]         = useState(false);
  const [wizardDoctorId, setWizardDoctorId] = useState('');
  const [wizardDoctorName, setWizardDoctorName] = useState('');

  // Rules per doctor
  const [rulesMap, setRulesMap] = useState<Record<string, AvailabilityRule[]>>({});
  const [rulesLoadingSet, setRulesLoadingSet] = useState<Set<string>>(new Set());
  const [deletingRule, setDeletingRule] = useState<string | null>(null);

  const fetchDoctors = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/facility-managers/me/doctors`, { headers: authHeaders(token) });
      if (res.ok) setDoctors(await res.json());
    } catch { /* ignore */ }
  }, [token]);

  const fetchAppointments = useCallback(async () => {
    setLoadingAppts(true);
    try {
      const params = new URLSearchParams();
      if (selectedDoctor) params.set('doctorId', selectedDoctor);
      if (selectedDate)   params.set('date', selectedDate);
      if (selectedStatus) params.set('status', selectedStatus);
      const res = await fetch(`${API_BASE}/facility-managers/me/appointments?${params}`, { headers: authHeaders(token) });
      if (res.ok) setAppointments(await res.json());
    } catch { /* ignore */ } finally { setLoadingAppts(false); }
  }, [token, selectedDoctor, selectedDate, selectedStatus]);

  const fetchRulesForDoctor = useCallback(async (doctorId: string) => {
    setRulesLoadingSet(prev => new Set([...prev, doctorId]));
    try {
      const res = await fetch(`${API_BASE}/availability-rules/by-doctor/${doctorId}`, { headers: authHeaders(token) });
      const data = res.ok ? await res.json() : [];
      setRulesMap(prev => ({ ...prev, [doctorId]: data }));
    } catch {
      setRulesMap(prev => ({ ...prev, [doctorId]: [] }));
    } finally {
      setRulesLoadingSet(prev => { const s = new Set(prev); s.delete(doctorId); return s; });
    }
  }, [token]);

  useEffect(() => {
    fetchDoctors().then(() => setLoading(false));
  }, [fetchDoctors]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Auto-charge les règles dès que la liste des médecins est disponible
  useEffect(() => {
    doctors.forEach(d => {
      if (rulesMap[d.id] === undefined) fetchRulesForDoctor(d.id);
    });
  }, [doctors, fetchRulesForDoctor]); // eslint-disable-line react-hooks/exhaustive-deps

  const changeStatus = async (apptId: string, status: string) => {
    setActionLoading(apptId + status);
    try {
      await fetch(`${API_BASE}/appointments/${apptId}/status`, {
        method: 'PATCH',
        headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, status } : a));
    } finally { setActionLoading(null); }
  };

  const sendReminder = async (apptId: string) => {
    setActionLoading('remind-' + apptId);
    try {
      await fetch(`${API_BASE}/facility-managers/me/appointments/${apptId}/reminder`, {
        method: 'POST', headers: authHeaders(token),
      });
      setReminderSent(prev => new Set([...prev, apptId]));
    } finally { setActionLoading(null); }
  };

  const deleteRule = async (doctorId: string, ruleId: string) => {
    if (!confirm('Supprimer cette règle de disponibilité ?')) return;
    setDeletingRule(ruleId);
    try {
      const res = await fetch(`${API_BASE}/availability-rules/by-doctor/${doctorId}/${ruleId}`, {
        method: 'DELETE', headers: authHeaders(token),
      });
      if (res.ok) setRulesMap(prev => ({ ...prev, [doctorId]: (prev[doctorId] ?? []).filter(r => r.id !== ruleId) }));
    } finally { setDeletingRule(null); }
  };

  const shiftDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const stats = {
    total:     appointments.length,
    pending:   appointments.filter(a => a.status === 'PENDING').length,
    confirmed: appointments.filter(a => a.status === 'CONFIRMED').length,
    cancelled: appointments.filter(a => a.status === 'CANCELLED').length,
  };

  const getDoctorName = (ownerId: string) =>
    doctors.find(d => d.id === ownerId)?.fullName ?? 'Dr. inconnu';

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gestion des rendez-vous — {doctors.length} médecin{doctors.length > 1 ? 's' : ''} associé{doctors.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total',     value: stats.total,     icon: Calendar,     color: 'text-blue-500' },
          { label: 'En attente',value: stats.pending,   icon: AlertCircle,  color: 'text-amber-500' },
          { label: 'Confirmés', value: stats.confirmed, icon: CheckCircle,  color: 'text-green-500' },
          { label: 'Annulés',   value: stats.cancelled, icon: XCircle,      color: 'text-red-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <Icon className={`w-8 h-8 ${color} shrink-0`} />
            <div>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row gap-3 items-end">
        {/* Date nav */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Date</label>
          <div className="flex items-center gap-1">
            <button onClick={() => shiftDate(-1)} className="p-2 rounded-lg border border-border hover:bg-muted transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button onClick={() => shiftDate(1)} className="p-2 rounded-lg border border-border hover:bg-muted transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Doctor filter */}
        <div className="flex-1 min-w-[160px]">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Médecin</label>
          <select
            value={selectedDoctor}
            onChange={e => setSelectedDoctor(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Tous les médecins</option>
            {doctors.map(d => (
              <option key={d.id} value={d.id}>{d.fullName ?? d.email}</option>
            ))}
          </select>
        </div>

        {/* Status filter */}
        <div className="flex-1 min-w-[140px]">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Statut</label>
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Tous les statuts</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>

        <button
          onClick={fetchAppointments}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <RefreshCw className={`w-4 h-4 ${loadingAppts ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Appointments list */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-sm text-foreground">
            Rendez-vous{' '}
            <span className="text-muted-foreground font-normal">
              — {new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </h2>
          <span className="text-xs text-muted-foreground">{appointments.length} RDV</span>
        </div>

        {loadingAppts ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Aucun rendez-vous ce jour</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Modifiez les filtres pour explorer d'autres dates</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {appointments.map(appt => {
              const start = new Date(appt.slot.start);
              const end   = new Date(appt.slot.end);
              const st    = STATUS_LABELS[appt.status] ?? { label: appt.status, color: 'bg-slate-100 text-slate-600' };
              const isLoading = (s: string) => actionLoading === appt.id + s;

              return (
                <div key={appt.id} className="px-5 py-4 flex flex-col md:flex-row md:items-center gap-3 hover:bg-muted/30 transition-colors">
                  {/* Time */}
                  <div className="flex items-center gap-2 min-w-[90px]">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm font-semibold text-foreground">
                      {start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      <span className="font-normal text-muted-foreground"> – {end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                  </div>

                  {/* Patient */}
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    {appt.patient.avatarUrl ? (
                      <img src={appt.patient.avatarUrl} className="w-8 h-8 rounded-full object-cover shrink-0" alt="" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-primary">{(appt.patient.fullName ?? 'P')[0].toUpperCase()}</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{appt.patient.fullName ?? 'Patient'}</p>
                      <p className="text-xs text-muted-foreground truncate">{appt.patient.email}</p>
                    </div>
                  </div>

                  {/* Doctor */}
                  <div className="flex items-center gap-1.5 min-w-[140px]">
                    <Stethoscope className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground truncate">{getDoctorName(appt.slot.ownerId)}</span>
                  </div>

                  {/* Kind */}
                  {appt.kind && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full hidden md:inline-flex">
                      {appt.kind.name}
                    </span>
                  )}

                  {/* Status */}
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${st.color} shrink-0`}>
                    {st.label}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {appt.status === 'PENDING' && (
                      <button
                        onClick={() => changeStatus(appt.id, 'CONFIRMED')}
                        disabled={!!actionLoading}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:opacity-40 transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Confirmer
                      </button>
                    )}
                    {['PENDING', 'CONFIRMED'].includes(appt.status) && (
                      <button
                        onClick={() => changeStatus(appt.id, 'CANCELLED')}
                        disabled={!!actionLoading}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-40 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Annuler
                      </button>
                    )}
                    {['PENDING', 'CONFIRMED'].includes(appt.status) && (
                      <button
                        onClick={() => sendReminder(appt.id)}
                        disabled={!!actionLoading || reminderSent.has(appt.id)}
                        title="Envoyer un rappel email au patient"
                        className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary disabled:opacity-40 transition-colors"
                      >
                        {reminderSent.has(appt.id)
                          ? <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                          : <Mail className="w-3.5 h-3.5" />
                        }
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CreateAvailabilityWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSuccess={() => {
          fetchAppointments();
          if (wizardDoctorId) fetchRulesForDoctor(wizardDoctorId);
        }}
        doctorId={wizardDoctorId}
        doctorName={wizardDoctorName}
      />

      {/* Disponibilités par médecin */}
      <div className="space-y-3">
        <h2 className="font-semibold text-foreground">Règles de disponibilité par médecin</h2>
        {doctors.length === 0 ? (
          <div className="bg-card border border-border rounded-xl px-5 py-8 text-center text-sm text-muted-foreground">
            Aucun médecin associé à votre établissement.
          </div>
        ) : doctors.map(d => {
          const rules = rulesMap[d.id];
          const isLoading = rulesLoadingSet.has(d.id);
          return (
            <div key={d.id} className="bg-card border border-border rounded-xl overflow-hidden">
              {/* Doctor header */}
              <div className="px-5 py-3.5 flex items-center gap-3 border-b border-border bg-muted/20">
                {d.avatarUrl ? (
                  <img src={d.avatarUrl} className="w-9 h-9 rounded-full object-cover shrink-0" alt="" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-teal-700 dark:text-teal-400">{(d.fullName ?? 'D')[0]}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{d.fullName ?? d.email}</p>
                  {d.doctorProfile?.specialty && (
                    <p className="text-xs text-muted-foreground">{d.doctorProfile.specialty}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {rules ? `${rules.length} règle${rules.length !== 1 ? 's' : ''}` : ''}
                  </span>
                  <button
                    onClick={() => { setWizardDoctorId(d.id); setWizardDoctorName(d.fullName ?? d.email); setWizardOpen(true); }}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Ajouter une règle
                  </button>
                </div>
              </div>

              {/* Rules list */}
              <div className="px-5 py-3">
                {isLoading ? (
                  <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Chargement des règles…
                  </div>
                ) : !rules || rules.length === 0 ? (
                  <p className="py-3 text-xs text-muted-foreground">Aucune règle de disponibilité configurée.</p>
                ) : (
                  <div className="divide-y divide-border">
                    {rules.map(rule => (
                      <div key={rule.id} className="py-3 flex items-start gap-3">
                        <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-1">
                          <div>
                            <p className="text-xs font-medium text-foreground">
                              {new Date(rule.startDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                              {' → '}
                              {new Date(rule.endDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                            <span className={`inline-block mt-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${rule.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500'}`}>
                              {rule.status === 'ACTIVE' ? 'Active' : rule.status}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {String(rule.startHour).padStart(2,'0')}h00 → {String(rule.endHour).padStart(2,'0')}h00
                            <br />
                            Créneaux de {rule.slotDurationMins} min · {rule.capacity} place{rule.capacity > 1 ? 's' : ''}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {rule.daysOfWeek.slice().sort().map(n => DAY_LABELS[n]).join(', ')}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteRule(d.id, rule.id)}
                          disabled={deletingRule === rule.id}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40 shrink-0"
                          title="Supprimer cette règle"
                        >
                          {deletingRule === rule.id
                            ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            : <Trash2 className="w-3.5 h-3.5" />
                          }
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
