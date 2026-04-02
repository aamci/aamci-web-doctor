'use client';

import { useAuth } from '../_providers/AuthProvider';
import { usePathname } from 'next/navigation';

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  const fullScreenPages   = ['/planning'];
  const fullScreenPrefixes = ['/patients/'];
  const isFullScreen = fullScreenPages.includes(pathname)
    || fullScreenPrefixes.some((p) => pathname.startsWith(p));

  /* ── Auth loading: show centered spinner while we verify the JWT ── */
  if (loading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-50 gap-4 z-20">
        <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center shadow-lg">
          <span className="text-2xl font-bold text-white">M</span>
        </div>
        <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className={`min-h-screen pt-16 bg-gray-50 transition-all ${user ? 'ml-20' : ''}`}>
      {isFullScreen ? (
        children
      ) : (
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      )}
    </main>
  );
}
