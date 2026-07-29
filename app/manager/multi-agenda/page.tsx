'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../_providers/AuthProvider';
import {
  ChevronLeft, ChevronRight, RefreshCw, LayoutGrid,
  Clock, User, CheckCircle, XCircle, AlertCircle, Calendar,
  Plus, X, Search, Loader2,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

type Slot = {
  id?: string;
  doctorId: string;
  startTime: string;
  endTime: string;
  appointment?: {
    id: string;
    status: string;
    checkedInAt?: string | null;
    patient: { fullName: string | null; email: string };
    kind: { name: string } | null;
  } | null;
};

type Doctor = {
  id: string;
  fullName: string | null;
  email: string;
  avatarUrl: string | null;
  doctorProfile: { specialty: string | null } | null;
};

type AvailableSlot = { start: string; end: string };
type Kind = { id: string; name: string; durationMins: number };
type PatientResult = { id: string; fullName: string | null; email: string; phone: string | null };

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7);

const STATUS_COLORS: Record<string, string> = {
  PENDING:   'bg-amber-100 border-amber-400 text-amber-900 dark:bg-amber-900/30 dark:border-amber-500 dark:text-amber-200',
  CONFIRMED: 'bg-green-100 border-green-400 text-green-900 dark:bg-green-900/30 dark:border-green-500 dark:text-green-200',
  CANCELLED: 'bg-red-100 border-red-300 text-red-700 dark:bg-red-900/20 dark:border-red-500 dark:text-red-300 opacity-60',
  COMPLETED: 'bg-slate-100 border-slate-300 text-slate-600 dark:bg-slate-700 dark:border-slate-500 dark:text-slate-300',
  NO_SHOW:   'bg-orange-100 border-orange-300 text-orange-700 dark:bg-orange-900/20 dark:border-orange-500 dark:text-orange-300',
  FREE:      'bg-white border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500',
};

function authHeaders(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function localDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function initials(name: string | null) {
  if (!name) return '?';
  return name.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
}

function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function SlotBlock({ slot, onClick }: { slot: Slot; onClick?: () => void }) {
  const appt = slot.appointment;
  const status = appt?.status ?? 'FREE';
  const colorClass = STATUS_COLORS[status] ?? STATUS_COLORS.FREE;
  const startH = new Date(slot.startTime).getHours() + new Date(slot.startTime).getMinutes() / 60;
  const endH   = new Date(slot.endTime).getHours()   + new Date(slot.endTime).getMinutes() / 60;
  const top    = (startH - 7) * 60;
  const height = Math.max((endH - startH) * 60, 24);

  return (
    <div
      className={`absolute left-1 right-1 rounded-md border text-xs px-1.5 py-1 overflow-hidden ${colorClass} ${appt ? 'cursor-pointer hover:brightness-95 transition-all' : ''}`}
      style={{ top: `${top}px`, height: `${height}px` }}
      title={appt ? `${appt.patient.fullName ?? appt.patient.email} — ${appt.kind?.name ?? 'Consultation'}` : 'Libre'}
      onClick={appt && onClick ? onClick : undefined}
    >
      {appt ? (
        <>
          <p className="font-semibold truncate leading-tight">{appt.patient.fullName ?? appt.patient.email}</p>
          <p className="truncate opacity-75">{fmtTime(slot.startTime)} · {appt.kind?.name ?? 'Consultation'}</p>
          {appt.checkedInAt && (
            <CheckCircle className="w-3 h-3 absolute top-1 right-1 text-emerald-500" />
          )}
        </>
      ) : (
        <p className="truncate">{fmtTime(slot.startTime)} Libre</p>
      )}
    </div>
  );
}

// ─── Booking Modal ────────────────────────────────────────────────────────────

interface BookingModalProps {
  doctors: Doctor[];
  initialDoctorId: string;
  initialDate: string;
  token: string | null;
  managerId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function BookingModal({ doctors, initialDoctorId, initialDate, token, managerId, onClose, onSuccess }: BookingModalProps) {
  const [doctorId, setDoctorId]     = useState(initialDoctorId || doctors[0]?.id || '');
  const [date, setDate]             = useState(initialDate);
  const [slots, setSlots]           = useState<AvailableSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [kinds, setKinds]           = useState<Kind[]>([]);
  const [kindId, setKindId]         = useState('');
  const [notes, setNotes]           = useState('');

  // Patient
  const [patientQuery, setPatientQuery] = useState('');
  const [patientResults, setPatientResults] = useState<PatientResult[]>([]);
  const [patientSearching, setPatientSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientResult | null>(null);
  // OR walk-in beneficiary
  const [beneficiaryMode, setBeneficiaryMode] = useState(false);
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [beneficiaryPhone, setBeneficiaryPhone] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load slots when doctor or date changes
  useEffect(() => {
    if (!doctorId || !date) return;
    setSlotsLoading(true);
    setSelectedSlot(null);
    const from = `${date}T00:00:00`;
    const to   = `${date}T23:59:59`;
    fetch(`${API_BASE}/slots/available/${doctorId}?from=${from}&to=${to}`)
      .then(r => r.ok ? r.json() : [])
      .then((data: any[]) => {
        const mapped = data.map((s: any) => ({ start: s.start ?? s.startTime, end: s.end ?? s.endTime }));
        setSlots(mapped);
      })
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [doctorId, date]);

  // Load appointment kinds when doctor changes
  useEffect(() => {
    if (!doctorId) return;
    fetch(`${API_BASE}/appointment-kinds/doctor/${doctorId}`)
      .then(r => r.ok ? r.json() : [])
      .then(setKinds)
      .catch(() => setKinds([]));
    setKindId('');
  }, [doctorId]);

  // Patient search with debounce
  useEffect(() => {
    if (beneficiaryMode || patientQuery.length < 2) { setPatientResults([]); return; }
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setPatientSearching(true);
      try {
        const res = await fetch(`${API_BASE}/users/search?q=${encodeURIComponent(patientQuery)}&role=PATIENT`, {
          headers: authHeaders(token),
        });
        if (res.ok) setPatientResults(await res.json());
      } catch { /* ignore */ }
      finally { setPatientSearching(false); }
    }, 350);
  }, [patientQuery, beneficiaryMode, token]);

  const handleSubmit = async () => {
    if (!doctorId || !selectedSlot) { setError('Choisissez un médecin et un créneau.'); return; }
    if (!beneficiaryMode && !selectedPatient) { setError('Choisissez un patient ou activez le mode bénéficiaire.'); return; }
    if (beneficiaryMode && !beneficiaryName.trim()) { setError('Entrez le nom du bénéficiaire.'); return; }

    setSubmitting(true); setError('');
    try {
      const body: any = {
        doctorId,
        slotStart: selectedSlot.start,
        slotEnd: selectedSlot.end,
        kindId: kindId || undefined,
        notes: notes || undefined,
      };
      if (beneficiaryMode) {
        body.beneficiaryName = beneficiaryName.trim();
        if (beneficiaryPhone.trim()) body.beneficiaryPhone = beneficiaryPhone.trim();
        body.patientId = managerId;
      } else {
        body.patientId = selectedPatient!.id;
      }

      const res = await fetch(`${API_BASE}/appointments`, {
        method: 'POST',
        headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || 'Erreur lors de la création du RDV.');
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setError('Erreur réseau.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedDoctor = doctors.find(d => d.id === doctorId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Nouveau rendez-vous
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* Doctor + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Médecin</label>
              <select
                value={doctorId}
                onChange={e => setDoctorId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>{d.fullName ?? d.email}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Available slots */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Créneau disponible
              {selectedDoctor && <span className="ml-1 text-primary">— Dr {selectedDoctor.fullName ?? selectedDoctor.email}</span>}
            </label>
            {slotsLoading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Chargement des créneaux…
              </div>
            ) : slots.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">Aucun créneau disponible pour cette date.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                {slots.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedSlot(s)}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                      selectedSlot?.start === s.start
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border hover:border-primary hover:text-primary'
                    }`}
                  >
                    {fmtTime(s.start)}
                  </button>
                ))}
              </div>
            )}
            {selectedSlot && (
              <p className="text-xs text-primary font-medium">
                Sélectionné : {fmtTime(selectedSlot.start)} → {fmtTime(selectedSlot.end)}
              </p>
            )}
          </div>

          {/* Appointment kind */}
          {kinds.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Type de consultation</label>
              <select
                value={kindId}
                onChange={e => setKindId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">— Choisir un type (optionnel) —</option>
                {kinds.map(k => (
                  <option key={k.id} value={k.id}>{k.name} ({k.durationMins} min)</option>
                ))}
              </select>
            </div>
          )}

          {/* Patient */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">Patient</label>
              <button
                onClick={() => { setBeneficiaryMode(!beneficiaryMode); setSelectedPatient(null); setPatientQuery(''); }}
                className="text-xs text-primary hover:underline"
              >
                {beneficiaryMode ? '← Rechercher un patient' : 'Bénéficiaire sans compte →'}
              </button>
            </div>

            {beneficiaryMode ? (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Nom complet du bénéficiaire *"
                  value={beneficiaryName}
                  onChange={e => setBeneficiaryName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <input
                  type="tel"
                  placeholder="Téléphone (optionnel)"
                  value={beneficiaryPhone}
                  onChange={e => setBeneficiaryPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                {selectedPatient ? (
                  <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                      {(selectedPatient.fullName ?? 'P')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{selectedPatient.fullName ?? 'Patient'}</p>
                      <p className="text-xs text-muted-foreground truncate">{selectedPatient.email}</p>
                    </div>
                    <button onClick={() => setSelectedPatient(null)} className="p-1 rounded hover:bg-muted transition-colors">
                      <X className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Rechercher un patient (nom, email…)"
                      value={patientQuery}
                      onChange={e => setPatientQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    {patientSearching && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-muted-foreground" />
                    )}
                  </div>
                )}
                {patientResults.length > 0 && !selectedPatient && (
                  <div className="rounded-lg border border-border bg-background shadow-md max-h-40 overflow-y-auto">
                    {patientResults.map(p => (
                      <button
                        key={p.id}
                        onClick={() => { setSelectedPatient(p); setPatientQuery(''); setPatientResults([]); }}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted transition-colors text-left"
                      >
                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-semibold shrink-0">
                          {(p.fullName ?? 'P')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{p.fullName ?? 'Patient'}</p>
                          <p className="text-xs text-muted-foreground truncate">{p.email}{p.phone ? ` · ${p.phone}` : ''}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Notes (optionnel)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Motif, instructions…"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !selectedSlot || (!beneficiaryMode && !selectedPatient) || (beneficiaryMode && !beneficiaryName.trim())}
              className="flex-1 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
            >
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Création…</> : 'Créer le rendez-vous'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Appointment Detail Modal ─────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  PENDING:   'En attente',
  CONFIRMED: 'Confirmé',
  CANCELLED: 'Annulé',
  COMPLETED: 'Terminé',
  NO_SHOW:   'Absent',
};

interface AppointmentDetailModalProps {
  slot: Slot;
  token: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

function AppointmentDetailModal({ slot, token, onClose, onSuccess }: AppointmentDetailModalProps) {
  const appt = slot.appointment!;
  const [status, setStatus] = useState(appt.status);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const changeStatus = async (newStatus: string) => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE}/appointments/${appt.id}/status`, {
        method: 'PATCH',
        headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.message || 'Erreur lors du changement de statut.');
        return;
      }
      setStatus(newStatus);
      onSuccess();
    } catch { setError('Erreur réseau.'); }
    finally { setLoading(false); }
  };

  const saveNotes = async () => {
    if (!notes.trim()) return;
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE}/appointments/${appt.id}`, {
        method: 'PATCH',
        headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notes.trim() }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.message || 'Erreur lors de la mise à jour.');
        return;
      }
      onSuccess();
      onClose();
    } catch { setError('Erreur réseau.'); }
    finally { setLoading(false); }
  };

  const colorClass = STATUS_COLORS[status] ?? STATUS_COLORS.PENDING;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            Détail du rendez-vous
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">

          {/* Patient info */}
          <div className="flex items-center gap-3 bg-muted/40 rounded-xl p-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
              {(appt.patient.fullName ?? appt.patient.email ?? 'P')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground truncate">{appt.patient.fullName ?? 'Patient'}</p>
              <p className="text-xs text-muted-foreground truncate">{appt.patient.email}</p>
            </div>
          </div>

          {/* Appointment info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Heure</p>
              <p className="font-medium">{fmtTime(slot.startTime)} → {fmtTime(slot.endTime)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Type</p>
              <p className="font-medium">{appt.kind?.name ?? 'Consultation'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground mb-0.5">Statut actuel</p>
              <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full border ${colorClass}`}>
                {STATUS_LABELS[status] ?? status}
              </span>
            </div>
          </div>

          {/* Status actions */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Changer le statut</p>
            <div className="flex flex-wrap gap-2">
              {status !== 'CONFIRMED' && (
                <button
                  onClick={() => changeStatus('CONFIRMED')}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:opacity-50 transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Confirmer
                </button>
              )}
              {status !== 'COMPLETED' && (
                <button
                  onClick={() => changeStatus('COMPLETED')}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-600 text-white rounded-lg hover:bg-slate-500 disabled:opacity-50 transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Terminé
                </button>
              )}
              {status !== 'NO_SHOW' && (
                <button
                  onClick={() => changeStatus('NO_SHOW')}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-orange-600 text-white rounded-lg hover:bg-orange-500 disabled:opacity-50 transition-colors"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  Absent
                </button>
              )}
              {status !== 'CANCELLED' && (
                <button
                  onClick={() => changeStatus('CANCELLED')}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Annuler
                </button>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Ajouter une note</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Motif, instructions, observations…"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              onClick={saveNotes}
              disabled={loading || !notes.trim()}
              className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              Enregistrer la note
            </button>
          </div>

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MultiAgendaPage() {
  const { user } = useAuth();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const managerId: string = (user as any)?.id ?? '';

  const [date, setDate] = useState(new Date());
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [slots, setSlots] = useState<Record<string, Slot[]>>({});
  const [loading, setLoading] = useState(true);

  // Booking modal
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingDoctorId, setBookingDoctorId] = useState('');

  const openBooking = (doctorId = '') => { setBookingDoctorId(doctorId); setBookingOpen(true); };

  // Appointment detail modal
  const [detailSlot, setDetailSlot] = useState<Slot | null>(null);

  const loadDoctors = useCallback(async () => {
    const res = await fetch(`${API_BASE}/facility-managers/me/doctors`, {
      headers: authHeaders(token),
    });
    if (res.ok) setDoctors(await res.json());
  }, [token]);

  const loadSlots = useCallback(async (doctorList: Doctor[], d: Date) => {
    setLoading(true);
    const dateStr = localDateStr(d);
    const results: Record<string, Slot[]> = {};

    await Promise.all(doctorList.map(async (doc) => {
      try {
        const res = await fetch(
          `${API_BASE}/facility-managers/me/appointments?doctorId=${doc.id}&date=${dateStr}`,
          { headers: authHeaders(token) },
        );
        if (res.ok) {
          const data = await res.json();
          const appts: any[] = Array.isArray(data) ? data : data.appointments ?? [];
          results[doc.id] = appts.map((a: any) => ({
            doctorId: doc.id,
            startTime: a.slot?.start ?? '',
            endTime:   a.slot?.end   ?? '',
            appointment: {
              id: a.id,
              status: a.status,
              checkedInAt: a.checkedInAt,
              patient: a.patient,
              kind: a.kind,
            },
          }));
        } else {
          results[doc.id] = [];
        }
      } catch {
        results[doc.id] = [];
      }
    }));

    setSlots(results);
    setLoading(false);
  }, [token]);

  useEffect(() => { loadDoctors(); }, [loadDoctors]);
  useEffect(() => {
    if (doctors.length > 0) loadSlots(doctors, date);
  }, [doctors, date, loadSlots]);

  const shift = (n: number) => setDate(d => { const nd = new Date(d); nd.setDate(nd.getDate() + n); return nd; });

  const dayLabel = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const isToday = localDateStr(date) === localDateStr(new Date());

  return (
    <div className="p-4 md:p-6 space-y-4 h-screen flex flex-col overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-violet-500" />
            Multi-agenda
          </h1>
          <p className="text-sm text-muted-foreground capitalize">{dayLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => shift(-1)} className="p-2 rounded-lg border border-border hover:bg-muted">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDate(new Date())}
            className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${isToday ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}
          >
            Aujourd'hui
          </button>
          <button onClick={() => shift(1)} className="p-2 rounded-lg border border-border hover:bg-muted">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => loadSlots(doctors, date)}
            className="p-2 rounded-lg border border-border hover:bg-muted"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {doctors.length > 0 && (
            <button
              onClick={() => openBooking()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Nouveau RDV
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-3 text-xs flex-shrink-0 flex-wrap">
        {[['PENDING','En attente'],['CONFIRMED','Confirmé'],['CANCELLED','Annulé'],['COMPLETED','Terminé'],['NO_SHOW','Absent']].map(([s, l]) => (
          <span key={s} className={`px-2 py-0.5 rounded border ${STATUS_COLORS[s]}`}>{l}</span>
        ))}
        <span className="flex items-center gap-1 text-emerald-600"><CheckCircle className="w-3 h-3" /> Check-in</span>
      </div>

      {/* Grid */}
      {doctors.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>Aucun médecin géré</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto rounded-xl border border-border">
          <div className="flex min-w-max">

            {/* Hour axis */}
            <div className="w-14 flex-shrink-0 border-r border-border">
              <div className="h-16 border-b border-border" />
              <div className="relative" style={{ height: `${13 * 60}px` }}>
                {HOURS.map(h => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 flex items-center justify-end pr-2 text-[10px] text-muted-foreground border-t border-border/50"
                    style={{ top: `${(h - 7) * 60}px`, height: '60px' }}
                  >
                    {String(h).padStart(2, '0')}h
                  </div>
                ))}
              </div>
            </div>

            {/* Doctor columns */}
            {doctors.map(doc => (
              <div key={doc.id} className="flex-shrink-0 w-48 border-r border-border last:border-r-0">
                {/* Doctor header */}
                <div className="h-16 border-b border-border p-2 flex items-center gap-2 bg-muted/30 sticky top-0 z-10">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                    {doc.avatarUrl
                      ? <img src={doc.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                      : initials(doc.fullName)
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground truncate">{doc.fullName ?? doc.email}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{doc.doctorProfile?.specialty ?? 'Médecin'}</p>
                  </div>
                  <button
                    onClick={() => openBooking(doc.id)}
                    title="Nouveau RDV pour ce médecin"
                    className="p-1 rounded hover:bg-primary/10 text-primary transition-colors flex-shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Slot grid */}
                <div className="relative bg-background" style={{ height: `${13 * 60}px` }}>
                  {HOURS.map(h => (
                    <div
                      key={h}
                      className="absolute left-0 right-0 border-t border-border/30"
                      style={{ top: `${(h - 7) * 60}px`, height: '60px' }}
                    />
                  ))}

                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : (slots[doc.id] ?? []).length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-xs text-muted-foreground">Pas de RDV</p>
                    </div>
                  ) : (slots[doc.id] ?? []).map((slot, i) => (
                    <SlotBlock key={i} slot={slot} onClick={() => slot.appointment && setDetailSlot(slot)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Booking modal */}
      {bookingOpen && (
        <BookingModal
          doctors={doctors}
          initialDoctorId={bookingDoctorId}
          initialDate={localDateStr(date)}
          token={token}
          managerId={managerId}
          onClose={() => setBookingOpen(false)}
          onSuccess={() => loadSlots(doctors, date)}
        />
      )}

      {/* Appointment detail / edit modal */}
      {detailSlot?.appointment && (
        <AppointmentDetailModal
          slot={detailSlot}
          token={token}
          onClose={() => setDetailSlot(null)}
          onSuccess={() => { loadSlots(doctors, date); setDetailSlot(null); }}
        />
      )}
    </div>
  );
}
