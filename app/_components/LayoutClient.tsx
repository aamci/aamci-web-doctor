'use client';

import { useAuth } from '../_providers/AuthProvider';
import { usePathname } from 'next/navigation';

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();

  // Pages qui doivent être en plein écran sans padding
  const fullScreenPages = ['/planning'];
  const isFullScreen = fullScreenPages.includes(pathname);

  return (
    <main className={`min-h-screen pt-16 ${user ? 'ml-20' : ''}`}>
      {isFullScreen ? (
        children
      ) : (
        <div className="max-w-7xl mx-auto p-8">
          {children}
        </div>
      )}
    </main>
  );
}
