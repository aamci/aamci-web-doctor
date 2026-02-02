'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../_providers/AuthProvider';
import {
  LogOut,
  User,
  Settings,
  ChevronDown,
  Calendar,
  CreditCard,
  HelpCircle,
  Bell,
  Search,
  Command,
} from 'lucide-react';
import NotificationBell from './NotificationBell';
import GlobalSearch from '@/components/GlobalSearch';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const quickActionsRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (quickActionsRef.current && !quickActionsRef.current.contains(event.target as Node)) {
        setShowQuickActions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
              Pro
            </span>
          )}
        </Link>

        {/* Barre de recherche globale (si connecté) */}
        {user && (
          <div className="flex-1 max-w-lg mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
              <button
                onClick={() => setShowGlobalSearch(true)}
                className="w-full pl-10 pr-20 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-400 text-left hover:bg-slate-600 hover:border-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                Rechercher patients, RDV...
              </button>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-600 border border-slate-500 rounded text-xs text-slate-300">
                  <Command className="w-3 h-3 inline" />
                </kbd>
                <kbd className="px-1.5 py-0.5 bg-slate-600 border border-slate-500 rounded text-xs text-slate-300">K</kbd>
              </div>
            </div>
          </div>
        )}

        {/* Actions à droite */}
        <div className="flex items-center gap-2">
          {!user ? (
            <>
              <button
                onClick={() => router.push('/auth/login')}
                className="px-4 py-2 rounded-lg font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                Connexion
              </button>
              <button
                onClick={() => router.push('/auth/login')}
                className="px-4 py-2 rounded-lg font-medium bg-teal-600 text-white hover:bg-teal-500 transition-colors"
              >
                S'inscrire
              </button>
            </>
          ) : (
            <>
              {/* Actions rapides dropdown */}
              <div className="relative" ref={quickActionsRef}>
                <button
                  onClick={() => setShowQuickActions(!showQuickActions)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-medium">Actions</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showQuickActions ? 'rotate-180' : ''}`} />
                </button>

                {showQuickActions && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <button
                      onClick={() => {
                        router.push('/planning');
                        setShowQuickActions(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                    >
                      <Calendar className="w-4 h-4 text-teal-600" />
                      Nouveau rendez-vous
                    </button>
                    <button
                      onClick={() => {
                        router.push('/patients');
                        setShowQuickActions(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                    >
                      <User className="w-4 h-4 text-blue-600" />
                      Nouveau patient
                    </button>
                    <button
                      onClick={() => {
                        router.push('/medical-notes');
                        setShowQuickActions(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                    >
                      <Bell className="w-4 h-4 text-orange-600" />
                      Nouvelle note
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={() => {
                        router.push('/settings/agenda');
                        setShowQuickActions(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                    >
                      <Settings className="w-4 h-4 text-gray-500" />
                      Configurer l'agenda
                    </button>
                  </div>
                )}
              </div>

              {/* Notifications */}
              <NotificationBell />

              {/* Menu utilisateur dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-sm font-bold">
                    {getInitials(user.fullName || user.email)}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-white truncate max-w-[120px]">
                      {user.fullName || 'Utilisateur'}
                    </p>
                    <p className="text-xs text-slate-400 truncate max-w-[120px]">
                      {user.email}
                    </p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    {/* En-tête du menu */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{user.fullName || 'Utilisateur'}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>

                    {/* Liens du menu */}
                    <div className="py-1">
                      <Link
                        href="/account"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <User className="w-4 h-4" />
                        Mon profil
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Settings className="w-4 h-4" />
                        Paramètres
                      </Link>
                      <Link
                        href="/wallet"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <CreditCard className="w-4 h-4" />
                        Portefeuille
                      </Link>
                      <Link
                        href="/preferences"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <HelpCircle className="w-4 h-4" />
                        Préférences
                      </Link>
                    </div>

                    {/* Déconnexion */}
                    <div className="border-t border-gray-100 py-1">
                      <button
                        onClick={() => {
                          handleLogout();
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" />
                        Déconnexion
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Global Search Modal */}
      <GlobalSearch
        isOpen={showGlobalSearch}
        onClose={() => setShowGlobalSearch(false)}
      />
    </nav>
  );
}
