import { Suspense } from 'react';
import AccountClient from './AccountClient';
import { ToastProvider } from './_lib/useToast';

export default function Page() {
  return (
    <Suspense fallback={<div className="card" style={{ marginTop: 24 }}>Chargement…</div>}>
      <ToastProvider>
        <AccountClient />
      </ToastProvider>
    </Suspense>
  );
}