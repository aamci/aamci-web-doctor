'use client';
import { useMemo, useState } from 'react';

const SPECIALTIES = ['Médecine générale','Cardiologie','Pédiatrie','Dermatologie','Gynécologie','Ophtalmologie'];

type PartialDoctorProfile = {
  specialty?: string|null;
  hospitalType?: string|null;
  presentation?: string|null;
  formations?: string|null;
  experiences?: string|null;
};

export default function ProfessionalInfoForm({
  profile,
  onSave,
}: {
  profile?: PartialDoctorProfile | null; // 🔸 optionnel
  onSave: (data: Partial<PartialDoctorProfile>) => Promise<void>;
}) {
  const p = useMemo<PartialDoctorProfile>(() => profile ?? {}, [profile]);

  const [specialty, setSpecialty] = useState(p.specialty ?? '');
  const [hospitalType, setHospitalType] = useState(p.hospitalType ?? '');
  const [presentation, setPresentation] = useState(p.presentation ?? '');
  const [formations, setFormations] = useState(p.formations ?? '');
  const [experiences, setExperiences] = useState(p.experiences ?? '');

  return (
    <div className="card" style={{ display:'grid', gap:12 }}>
      <h3>Informations professionnelles</h3>
      <div className="grid" style={{ gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div>
          <label className="small">Spécialité</label>
          <input list="specialties" className="input" value={specialty} onChange={e=>setSpecialty(e.target.value)} placeholder="ex. Cardiologie" />
          <datalist id="specialties">{SPECIALTIES.map(s => <option key={s} value={s} />)}</datalist>
        </div>
        <div>
          <label className="small">Type d’établissement</label>
          <select className="input" value={hospitalType} onChange={e=>setHospitalType(e.target.value)}>
            <option value="">—</option>
            <option value="Cabinet">Cabinet</option>
            <option value="Clinique">Clinique</option>
            <option value="Hôpital">Hôpital</option>
          </select>
        </div>
        <div style={{ gridColumn:'1/-1' }}>
          <label className="small">Présentation</label>
          <textarea className="input" rows={4} value={presentation} onChange={e=>setPresentation(e.target.value)} placeholder="Décrivez votre pratique…" />
        </div>
        <div>
          <label className="small">Formations</label>
          <textarea className="input" rows={3} value={formations} onChange={e=>setFormations(e.target.value)} placeholder="Diplômes, DU…" />
        </div>
        <div>
          <label className="small">Expériences</label>
          <textarea className="input" rows={3} value={experiences} onChange={e=>setExperiences(e.target.value)} placeholder="Postes, services…" />
        </div>
      </div>
      <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
        <button className="btn" onClick={() => onSave({ specialty, hospitalType, presentation, formations, experiences })}>
          Enregistrer
        </button>
      </div>
    </div>
  );
}