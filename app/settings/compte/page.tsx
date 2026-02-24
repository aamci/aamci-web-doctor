import { Suspense } from 'react';
import AccountClient from '../../account/AccountClient';
import { ToastProvider } from '../../account/_lib/useToast';

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-400 text-sm">Chargement…</div>}>
      <ToastProvider>
        <AccountClient />
      </ToastProvider>
    </Suspense>
  );
}
