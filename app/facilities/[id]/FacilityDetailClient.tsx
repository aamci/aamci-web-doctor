'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

function getApiBase(): string | null {
  let base = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  base = base.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  try {
    return base ? new URL(base).toString().replace(/\/$/, '') : null;
  } catch {
    return null;
  }
}

interface Doctor {
  id: string;
  specialty?: string;
  user: {
    id: string;
    fullName?: string;
    avatarUrl?: string;
  };
}

interface Facility {
  id: string;
  name: string;
  type: 'CLINIC' | 'CHU' | 'POLYCLINIC' | 'CENTER';
  description?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  services?: string;
  doctors?: Doctor[];
}

const FACILITY_TYPE_LABELS: Record<string, string> = {
  CLINIC: 'Clinique',
  CHU: 'CHU',
  POLYCLINIC: 'Polyclinique',
  CENTER: 'Centre Médical',
};

export default function FacilityDetailClient({ facilityId }: { facilityId: string }) {
  const router = useRouter();
  const apiBase = useMemo(() => getApiBase(), []);

  const [facility, setFacility] = useState<Facility | null>(null);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');

  // Liste des spécialités disponibles
  const specialties = useMemo(() => {
    if (!facility?.doctors) return [];
    const uniqueSpecialties = new Set(
      facility.doctors.map((d) => d.specialty).filter((s): s is string => !!s)
    );
    return Array.from(uniqueSpecialties).sort();
  }, [facility]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const url = apiBase
        ? `${apiBase}/facilities/${facilityId}`
        : `/facilities/${facilityId}`;

      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) {
          throw new Error('Facility not found');
        }
        const data = await res.json();
        setFacility(data);
        setFilteredDoctors(data.doctors || []);
      } catch (error) {
        console.error('Error loading facility:', error);
        setFacility(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [apiBase, facilityId]);

  // Filtrer les médecins par spécialité
  useEffect(() => {
    if (!facility?.doctors) return;

    if (!selectedSpecialty) {
      setFilteredDoctors(facility.doctors);
    } else {
      setFilteredDoctors(
        facility.doctors.filter((d) => d.specialty === selectedSpecialty)
      );
    }
  }, [selectedSpecialty, facility]);

  if (loading) {
    return <div className="card" style={{ marginTop: 24 }}>Chargement…</div>;
  }

  if (!facility) {
    return (
      <div className="card" style={{ marginTop: 24 }}>
        <p>Établissement non trouvé.</p>
        <Link href="/facilities" className="btn primary" style={{ marginTop: 16 }}>
          Retour à la liste
        </Link>
      </div>
    );
  }

  const typeLabel = FACILITY_TYPE_LABELS[facility.type] || facility.type;
  let services: string[] = [];
  try {
    services = facility.services ? JSON.parse(facility.services) : [];
  } catch {
    services = [];
  }

  return (
    <div style={{ display: 'grid', gap: 24, padding: '24px 0' }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: 14, color: '#666' }}>
        <Link href="/facilities" style={{ color: '#0369a1', textDecoration: 'none' }}>
          Établissements
        </Link>
        {' > '}
        <span>{facility.name}</span>
      </div>

      {/* Informations de l'établissement */}
      <div className="card">
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>{facility.name}</h1>
              <span
                style={{
                  display: 'inline-block',
                  marginTop: 10,
                  padding: '6px 14px',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 600,
                  backgroundColor: '#e0f2fe',
                  color: '#0369a1',
                }}
              >
                {typeLabel}
              </span>
            </div>
          </div>

          {facility.description && (
            <p style={{ margin: 0, fontSize: 16, color: '#444', lineHeight: 1.6 }}>
              {facility.description}
            </p>
          )}

          <div style={{ display: 'grid', gap: 12, fontSize: 15 }}>
            {facility.address && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'start' }}>
                <span style={{ color: '#888', minWidth: 24 }}>📍</span>
                <div>
                  <div style={{ fontWeight: 500 }}>{facility.address}</div>
                  {facility.city && <div style={{ color: '#666' }}>{facility.city}</div>}
                </div>
              </div>
            )}
            {facility.phone && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ color: '#888', minWidth: 24 }}>📞</span>
                <a href={`tel:${facility.phone}`} style={{ color: '#0369a1', textDecoration: 'none' }}>
                  {facility.phone}
                </a>
              </div>
            )}
            {facility.email && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ color: '#888', minWidth: 24 }}>✉️</span>
                <a href={`mailto:${facility.email}`} style={{ color: '#0369a1', textDecoration: 'none' }}>
                  {facility.email}
                </a>
              </div>
            )}
            {facility.website && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ color: '#888', minWidth: 24 }}>🌐</span>
                <a
                  href={facility.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#0369a1', textDecoration: 'none' }}
                >
                  {facility.website}
                </a>
              </div>
            )}
          </div>

          {services.length > 0 && (
            <div>
              <h3 style={{ margin: '16px 0 10px', fontSize: 16, fontWeight: 600 }}>Services disponibles</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {services.map((service, index) => (
                  <span
                    key={index}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 20,
                      fontSize: 13,
                      backgroundColor: '#f0f9ff',
                      color: '#0369a1',
                      border: '1px solid #bae6fd',
                    }}
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Liste des médecins */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
            Médecins ({filteredDoctors.length})
          </h2>

          {specialties.length > 0 && (
            <select
              className="input"
              style={{ maxWidth: 250 }}
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
            >
              <option value="">Toutes les spécialités</option>
              {specialties.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          )}
        </div>

        <div
          className="grid"
          style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}
        >
          {!filteredDoctors.length && (
            <div className="card">
              {selectedSpecialty
                ? `Aucun médecin trouvé pour la spécialité "${selectedSpecialty}".`
                : 'Aucun médecin associé à cet établissement.'}
            </div>
          )}
          {filteredDoctors.map((doctor) => {
            const fullName = doctor.user.fullName || 'Docteur';
            const specialty = doctor.specialty || 'Médecine générale';

            return (
              <Link
                key={doctor.id}
                href={`/doctors/${doctor.user.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div
                  className="card"
                  style={{
                    display: 'grid',
                    gap: 10,
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '';
                  }}
                >
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    {doctor.user.avatarUrl ? (
                      <img
                        src={doctor.user.avatarUrl}
                        alt={fullName}
                        style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: '50%',
                          backgroundColor: '#e0f2fe',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 20,
                          fontWeight: 600,
                          color: '#0369a1',
                        }}
                      >
                        {fullName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{fullName}</h4>
                      <p style={{ margin: '4px 0 0', fontSize: 14, color: '#666' }}>{specialty}</p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
