import { Suspense } from 'react';
import FacilityDetailClient from './FacilityDetailClient';

export default async function FacilityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="card" style={{ marginTop: 24 }}>Chargement…</div>}>
      <FacilityDetailClient facilityId={id} />
    </Suspense>
  );
}
