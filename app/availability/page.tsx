'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AvailabilityControls from './AvailabilityControls';
import AvailabilityGrid from './AvailabilityGrid';
import styles from './Availability.module.css';

export type Slot = {
  id: string;
  ownerId: string;
  ownerType: string;
  start: string;  // ISO
  end: string;    // ISO
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

async function authedFetch(path: string, init?: RequestInit) {
  const base = getApiBase();
  const url = base ? `${base}${path}` : `/api-proxy${path}`;

  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (!token) throw new Error('Non authentifié');

  const headers: Record<string, string> = {
    ...(init?.headers as any),
    Authorization: `Bearer ${token}`,
  };
  if (init?.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const r = await fetch(url, { ...init, headers, cache: 'no-store' });
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    throw new Error(`HTTP ${r.status}${t ? ` — ${t}` : ''}`);
  }
  return r;
}

// début de semaine (lundi) avec offset en semaines
function startOfWeekWithOffset(offset: number) {
  const today = new Date();
  const day = today.getDay(); // 0 = dimanche
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(today.getDate() + diffToMonday + offset * 7);
  return monday;
}

export default function AvailabilityPage() {
  const router = useRouter();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

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

  async function bulkCreate(
    slotsPayload: Array<{ start: string; end: string; capacity?: number; status?: string }>,
  ) {
    await authedFetch('/slots/bulk', {
      method: 'POST',
      body: JSON.stringify({ slots: slotsPayload }),
    });
    await load();
    setInfo('Créneaux générés ✅');
  }

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
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
  <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
    <div className={styles.header}>
      <div>
        <h1 className={styles.title}>Mes disponibilités</h1>
        <p className={styles.subtitle}>Configurez vos créneaux…</p>
      </div>
    </div>

      {err && (
        <div className="banner error mb-2">
          {err}
        </div>
      )}
      {info && (
        <div className="banner success mb-2">
          {info}
        </div>
      )}

      <AvailabilityControls onGenerate={bulkCreate} />

      {loading ? (
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          Chargement…
        </div>
      ) : (
        <AvailabilityGrid
          slots={slots}
          weekOffset={weekOffset}
          minHour={7}
          maxHour={18}
          onPrevWeek={() => {
            // on n’autorise pas de revenir avant la semaine 0
            setWeekOffset((w) => Math.max(0, w - 1));
          }}
          onNextWeek={() => {
            // on ne va à droite que s’il existe au moins un slot sur la semaine suivante
            const base = startOfWeekWithOffset(weekOffset + 1);
            const hasFuture = slots.some((s) => {
              const d = new Date(s.start);
              return d >= base;
            });
            if (hasFuture) setWeekOffset((w) => w + 1);
          }}
          onToggle={async (slot) => {
            await updateSlot(slot.id, {
              status: slot.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
            });
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