import { Suspense } from 'react';
import FacilitiesListClient from './FacilitiesListClient';

export default function FacilitiesPage() {
  return (
    <Suspense fallback={<div className="card" style={{ marginTop: 24 }}>Chargement…</div>}>
      <FacilitiesListClient />
    </Suspense>
  );
}
