'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AvailabilityControls from './AvailabilityControls';
import AvailabilityGrid from './AvailabilityGrid';

type Slot = {
  id: string;
  ownerId: string;
  ownerType: string;
  start: string;
  end: string;
  capacity: number;
  status: 'ACTIVE' | 'INACTIVE';
};

function getApiBase(): string | null {
  let b = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  b = b.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  if (!b) return null;
  try {
    new URL(b);
    return b;
  } catch {
    return null;
  }
}

export default function AvailabilityPage() {
  const router = useRouter();
  const apiBase = useMemo(() => getApiBase(), []);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  function buildUrl(path: string) {
    return apiBase ? `${apiBase}${path}` : `/api-proxy${path}`;
  }

  async function authedFetch(path: string, init?: RequestInit) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) throw new Error('Non authentifié');
    const headers: Record<string, string> = { ...(init?.headers as any) };
    headers['Authorization'] = `Bearer ${token}`;
    if (init?.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
    const r = await fetch(buildUrl(path), { ...init, headers, cache: 'no-store' });
    if (!r.ok) {
      const t = await r.text().catch(() => '');
      throw new Error(`HTTP ${r.status}${t ? ` — ${t}` : ''}`);
    }
    return r;
  }

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const r = await authedFetch('/slots/mine', { method: 'GET' });
      const data = await r.json().catch(() => []);
      setSlots(Array.isArray(data) ? data : data?.data || []);
    } catch (e: any) {
      if (e?.message?.includes('Non authentifié')) {
        router.replace('/auth/login');
      } else {
        setErr(e?.message || 'Erreur de chargement');
      }
    } finally {
      setLoading(false);
    }
  }

  // appelé par le composant de contrôle quand on génère en bulk
  async function bulkCreate(slotsPayload: Array<{ start: string; end: string; capacity?: number; status?: string }>) {
    await authedFetch('/slots/bulk', {
      method: 'POST',
      body: JSON.stringify({ slots: slotsPayload }),
    });
    await load();
    setInfo('Créneaux générés ✅');
  }

  // appelé pour update/supprimer
  async function updateSlot(id: string, body: any) {
    await authedFetch(`/slots/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    await load();
  }

  async function deleteSlot(id: string) {
    await authedFetch(`/slots/${id}`, { method: 'DELETE' });
    await load();
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('token')) {
      router.replace('/auth/login');
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

 return (
    <div style={{ display: 'grid', gap: 16, padding: '24px 0' }}>
      <h1>Mes disponibilités</h1>
      {err && <div className="banner error">{err}</div>}
      {info && <div className="banner success">{info}</div>}

      <AvailabilityControls onGenerate={bulkCreate} />

      {loading ? (
        <div className="card">Chargement…</div>
      ) : (
        <AvailabilityGrid
          slots={slots}
          weekOffset={weekOffset}
          onPrevWeek={() => {
                // ✅ on autorise le retour tant qu'on n'est pas à la semaine 0
                setWeekOffset((w) => Math.max(0, w - 1));
            }}
          onNextWeek={() => {
            // on ne va à droite que si on a des slots après
            const hasFuture = slots.some((s) => {
              const d = new Date(s.start);
              const base = startOfWeekWithOffset(weekOffset + 1);
              return d >= base;
            });
            if (hasFuture) setWeekOffset((w) => w + 1);
          }}
          minHour={7}
          maxHour={18}
          onToggle={async (slot) => {
            await updateSlot(slot.id, { status: slot.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' });
          }}
          onCapacityChange={async (slot, cap) => {
            await updateSlot(slot.id, { capacity: cap });
          }}
          onDelete={async (slot) => {
            await deleteSlot(slot.id);
          }}
        />
      )}
    </div>
  );
}

// petit helper en bas du fichier (ou dans un utils)
function startOfWeekWithOffset(offset: number) {
  const today = new Date();
  // on force lundi comme début
  const day = today.getDay(); // 0=dim
  const diffToMonday = (day === 0 ? -6 : 1 - day); // pour arriver au lundi
  const monday = new Date(today);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(today.getDate() + diffToMonday + offset * 7);
  return monday;
}