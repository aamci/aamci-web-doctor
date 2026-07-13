'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../_providers/AuthProvider';
import {
  LogOut,
  User,
  Settings,
  ChevronDown,
  Calendar,
  CreditCard,
  HelpCircle,
  Search,
  Command,
  Plus,
  FileText,
} from 'lucide-react';
import NotificationBell from './NotificationBell';
import GlobalSearch from '@/components/GlobalSearch';

const QUICK_ACTIONS = [
  { label: 'Nouveau rendez-vous', href: '/planning',      Icon: Calendar,  color: 'text-teal-600',  bg: 'bg-teal-50'  },
  { label: 'Nouveau patient',     href: '/patients',      Icon: User,      color: 'text-blue-600',  bg: 'bg-blue-50'  },
  { label: 'Nouvelle note',       href: '/medical-notes', Icon: FileText,  color: 'text-amber-600', bg: 'bg-amber-50' },
];

const USER_LINKS = [
  { label: 'Mon profil',    href: '/settings/compte', Icon: User       },
  { label: 'Paramètres',   href: '/settings',         Icon: Settings   },
  { label: 'Portefeuille', href: '/wallet',            Icon: CreditCard },
  { label: 'Préférences',  href: '/preferences',      Icon: HelpCircle },
];

function getInitials(name?: string | null) {
  if (!name) return 'U';
  const parts = name.split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (pathname === '/' || pathname.startsWith('/auth')) return null;
  const [showUserMenu, setShowUserMenu]       = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const userMenuRef    = useRef<HTMLDivElement>(null);
  const quickActionsRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node))    setShowUserMenu(false);
      if (quickActionsRef.current && !quickActionsRef.current.contains(e.target as Node)) setShowQuickActions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ⌘K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (user) setShowGlobalSearch(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [user]);

  return (
    <>
      {/* Navbar — starts at left-20 when user logged in (sidebar occupies left-0 to left-20) */}
      <nav
        className={`fixed top-0 right-0 h-16 bg-slate-900 border-b border-slate-800/70 z-30 flex items-center px-4 gap-3
          ${user ? 'left-20' : 'left-0'}`}
      >
        {/* Logo — only when NOT logged in */}
        {!user && (
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 mr-2 group">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center shadow-md group-hover:bg-teal-500 transition-colors">
              <span className="text-lg font-bold text-white">M</span>
            </div>
            <div className="hidden sm:block leading-tight">
              <p className="text-sm font-bold text-white">Ibogha 241</p>
              <p className="text-[10px] text-teal-400 font-medium">Pro</p>
            </div>
          </Link>
        )}

        {/* Global search — when logged in */}
        {user && (
          <div className="flex-1 max-w-sm">
            <button
              onClick={() => setShowGlobalSearch(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2 bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-lg text-sm text-slate-400 hover:text-slate-300 transition-colors"
            >
              <Search className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">Rechercher...</span>
              <span className="flex items-center gap-0.5 opacity-50">
                <kbd className="px-1 py-0.5 text-[10px] bg-slate-700 border border-slate-600 rounded font-mono leading-none">
                  <Command className="w-2.5 h-2.5 inline" />
                </kbd>
                <kbd className="px-1 py-0.5 text-[10px] bg-slate-700 border border-slate-600 rounded font-mono leading-none">K</kbd>
              </span>
            </button>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right-side actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {!user ? (
            <>
              <button
                onClick={() => router.push('/auth/login')}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                Connexion
              </button>
              <button
                onClick={() => router.push('/auth/login')}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-teal-600 text-white hover:bg-teal-500 transition-colors shadow-sm"
              >
                S'inscrire
              </button>
            </>
          ) : (
            <>
              {/* Quick-create dropdown */}
              <div className="relative" ref={quickActionsRef}>
                <button
                  onClick={() => setShowQuickActions((v) => !v)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline font-medium">Créer</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${showQuickActions ? 'rotate-180' : ''}`} />
                </button>

                {showQuickActions && (
                  <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50">
                    {QUICK_ACTIONS.map(({ label, href, Icon, color, bg }) => (
                      <button
                        key={href}
                        onClick={() => { router.push(href as any); setShowQuickActions(false); }}
                        className="w-full px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                      >
                        <span className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-4 h-4 ${color}`} />
                        </span>
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Notification bell */}
              <NotificationBell />

              {/* User menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu((v) => !v)}
                  className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-sm font-bold text-white shadow-sm flex-shrink-0">
                    {getInitials(user.fullName || user.email)}
                  </div>
                  <div className="hidden md:block text-left min-w-0">
                    <p className="text-sm font-medium text-white leading-tight truncate max-w-[110px]">
                      {user.fullName || 'Utilisateur'}
                    </p>
                    <p className="text-[10px] text-slate-400 leading-tight truncate max-w-[110px]">
                      {user.email}
                    </p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform duration-150 ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.fullName || 'Utilisateur'}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{user.email}</p>
                    </div>

                    <div className="py-1">
                      {USER_LINKS.map(({ label, href, Icon }) => (
                        <Link
                          key={href}
                          href={href as any}
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          {label}
                        </Link>
                      ))}
                    </div>

                    <div className="border-t border-gray-100 py-1">
                      <button
                        onClick={() => { handleLogout(); setShowUserMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4 flex-shrink-0" />
                        Déconnexion
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </nav>

      <GlobalSearch isOpen={showGlobalSearch} onClose={() => setShowGlobalSearch(false)} />
    </>
  );
}
