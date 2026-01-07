'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function getApiBase(): string | null {
  let base = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  base = base.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  try {
    return base ? new URL(base).toString().replace(/\/$/, '') : null;
  } catch {
    return null;
  }
}

interface Facility {
  id: string;
  name: string;
  type: 'CLINIC' | 'CHU' | 'POLYCLINIC' | 'CENTER';
  description?: string;
  address?: string;
  city?: string;
  phone?: string;
  _count?: {
    doctors: number;
  };
}

const FACILITY_TYPE_LABELS: Record<string, string> = {
  CLINIC: 'Clinique',
  CHU: 'CHU',
  POLYCLINIC: 'Polyclinique',
  CENTER: 'Centre Médical',
};

export default function FacilitiesListClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get('q') ?? '';
  const city = searchParams.get('city') ?? '';
  const type = searchParams.get('type') ?? '';
  const apiBase = useMemo(() => getApiBase(), []);

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (city) params.set('city', city);
      if (type) params.set('type', type);

      const url = apiBase
        ? `${apiBase}/facilities?${params.toString()}`
        : `/facilities?${params.toString()}`;

      try {
        const res = await fetch(url, { cache: 'no-store' });
        const data = await res.json();
        setFacilities(Array.isArray(data) ? data : data?.data || []);
      } catch {
        setFacilities([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [apiBase, q, city, type]);

  function onSubmit(formData: FormData) {
    const nxtQ = formData.get('q')?.toString() ?? '';
    const nxtCity = formData.get('city')?.toString() ?? '';
    const nxtType = formData.get('type')?.toString() ?? '';
    const params = new URLSearchParams();
    if (nxtQ) params.set('q', nxtQ);
    if (nxtCity) params.set('city', nxtCity);
    if (nxtType) params.set('type', nxtType);

    const href = `/facilities${params.toString() ? `?${params.toString()}` : ''}`;
    router.push(href as any);
  }

  return (
    <div style={{ display: 'grid', gap: 16, padding: '24px 0' }}>
      <h1>Établissements de Santé</h1>

      <form
        action={onSubmit}
        style={{ display: 'grid', gridTemplateColumns: '1fr 200px 180px 120px', gap: 10 }}
      >
        <input className="input" name="q" placeholder="Nom de l'établissement" defaultValue={q} />
        <input className="input" name="city" placeholder="Ville" defaultValue={city} />
        <select className="input" name="type" defaultValue={type}>
          <option value="">Tous les types</option>
          <option value="CHU">CHU</option>
          <option value="CLINIC">Clinique</option>
          <option value="POLYCLINIC">Polyclinique</option>
          <option value="CENTER">Centre Médical</option>
        </select>
        <button className="btn primary" type="submit">
          Rechercher
        </button>
      </form>

      {loading ? (
        <div className="card">Chargement…</div>
      ) : (
        <div
          className="grid"
          style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16 }}
        >
          {!facilities.length && <div className="card">Aucun établissement trouvé.</div>}
          {facilities.map((facility) => {
            const typeLabel = FACILITY_TYPE_LABELS[facility.type] || facility.type;
            const doctorCount = facility._count?.doctors || 0;

            return (
              <Link
                key={facility.id}
                href={`/facilities/${facility.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div
                  className="card"
                  style={{
                    display: 'grid',
                    gap: 12,
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                        {facility.name}
                      </h3>
                      <span
                        style={{
                          display: 'inline-block',
                          marginTop: 6,
                          padding: '4px 10px',
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 500,
                          backgroundColor: '#e0f2fe',
                          color: '#0369a1',
                        }}
                      >
                        {typeLabel}
                      </span>
                    </div>
                  </div>

                  {facility.description && (
                    <p style={{ margin: 0, fontSize: 14, color: '#666', lineHeight: 1.5 }}>
                      {facility.description}
                    </p>
                  )}

                  <div style={{ display: 'grid', gap: 6, fontSize: 14 }}>
                    {facility.city && (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ color: '#888' }}>📍</span>
                        <span>{facility.city}</span>
                      </div>
                    )}
                    {facility.phone && (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ color: '#888' }}>📞</span>
                        <span>{facility.phone}</span>
                      </div>
                    )}
                    <div
                      style={{
                        display: 'flex',
                        gap: 8,
                        alignItems: 'center',
                        paddingTop: 8,
                        borderTop: '1px solid #eee',
                        marginTop: 4,
                      }}
                    >
                      <span style={{ color: '#888' }}>👨‍⚕️</span>
                      <span style={{ fontWeight: 500, color: '#0369a1' }}>
                        {doctorCount} médecin{doctorCount > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
