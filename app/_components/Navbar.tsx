'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../_providers/AuthProvider';
import { LogOut, User } from 'lucide-react';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  const isActive = (href: string) => {
    if (href === '/planning') {
      return pathname === '/' || pathname === '/dashboard' || pathname === '/planning';
    }
    return pathname?.startsWith(href);
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-slate-800 text-white shadow-lg z-40 flex items-center">
      <div className={`flex items-center justify-between w-full px-6 ${user ? 'ml-20' : ''}`}>
        {/* Logo et titre */}
        <Link href={user ? '/planning' : '/'} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center hover:bg-slate-600 transition-colors">
            <span className="text-xl font-bold text-teal-400">M</span>
          </div>
          <span className="text-lg font-bold text-white">Health Platform</span>
          {user && (
            <span className="ml-2 text-xs bg-teal-600 text-white px-2 py-1 rounded-full">
              Espace médecin
            </span>
          )}
        </Link>

        {/* Navigation principale (si connecté) */}
        {user && (
          <div className="flex items-center gap-2">
            <Link
              href="/planning"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive('/planning')
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              Planning
            </Link>
            <Link
              href="/availability"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive('/availability')
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              Disponibilités
            </Link>
            <Link
              href="/preferences"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive('/preferences')
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              Préférences
            </Link>
            {user.role === 'FACILITY_MANAGER' && (
              <Link
                href="/facility-management"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive('/facility-management')
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                Gestion
              </Link>
            )}
            <Link
              href={"/patients" as any}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive('/patients')
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              Patients
            </Link>
            <Link
              href={"/medical-notes" as any}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive('/medical-notes')
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              Notes
            </Link>
            <Link
              href={"/billing" as any}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive('/billing')
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              Facturation
            </Link>
            <Link
              href={"/tasks" as any}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive('/tasks')
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              Tâches
            </Link>
          </div>
        )}

        {/* Actions à droite */}
        <div className="flex items-center gap-3">
          {!user ? (
            <>
              <button
                onClick={() => router.push('/auth/login' as any)}
                className="px-4 py-2 rounded-lg font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                Connexion
              </button>
              <button
                onClick={() => router.push('/auth/register' as any)}
                className="px-4 py-2 rounded-lg font-medium bg-teal-600 text-white hover:bg-teal-500 transition-colors"
              >
                S'inscrire
              </button>
            </>
          ) : (
            <>
              <NotificationBell />
              <Link
                href={"/settings" as any}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">{user.fullName || user.email}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:bg-red-600 hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Déconnexion</span>
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}