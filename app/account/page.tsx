import { Suspense } from 'react';
import AccountClient from './AccountClient';
import { ToastProvider } from './_lib/useToast';

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <Suspense fallback={<div className="text-gray-400 text-sm py-20 text-center">Chargement…</div>}>
          <ToastProvider>
            <AccountClient />
          </ToastProvider>
        </Suspense>
      </div>
    </div>
  );
}
