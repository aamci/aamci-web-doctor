'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  FileText,
  CheckSquare,
  Users,
  CalendarCheck,
  Receipt,
  Settings,
  User,
  Activity,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../_providers/AuthProvider';

interface NavItem {
  label: string;
  href: string | any;
  icon: React.ReactNode;
  badge?: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

export default function DoctorSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);

  const fetchUnreadMessages = useCallback(async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/messages/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadMessages(data.count || 0);
      }
    } catch { /* silent */ }
  }, [user]);

  useEffect(() => {
    fetchUnreadMessages();
    const interval = setInterval(fetchUnreadMessages, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadMessages]);

  // Ne pas afficher la sidebar si l'utilisateur n'est pas connecté
  if (!user) {
    return null;
  }

  const navigationItems: NavItem[] = [
    {
      label: 'Planning',
      href: '/planning',
      icon: <Calendar className="w-6 h-6" />,
    },
    {
      label: 'Disponibilités',
      href: '/availability',
      icon: <Clock className="w-6 h-6" />,
    },
    {
      label: 'Notes',
      href: '/medical-notes',
      icon: <FileText className="w-6 h-6" />,
    },
    {
      label: 'Tâches',
      href: '/tasks',
      icon: <CheckSquare className="w-6 h-6" />,
      badge: 3,
    },
    {
      label: 'Patients',
      href: '/patients',
      icon: <Users className="w-6 h-6" />,
    },
    {
      label: 'Réservations',
      href: '/reservations',
      icon: <CalendarCheck className="w-6 h-6" />,
    },
    {
      label: 'Facturation',
      href: '/billing',
      icon: <Receipt className="w-6 h-6" />,
    },
    {
      label: 'Activité',
      href: '/activity',
      icon: <Activity className="w-6 h-6" />,
    },
    {
      label: 'Messages',
      href: '/messages',
      icon: <MessageSquare className="w-6 h-6" />,
      badge: unreadMessages || undefined,
    },
  ];

  const bottomItems: NavItem[] = [
    {
      label: 'Paramètres',
      href: '/settings',
      icon: <Settings className="w-6 h-6" />,
    },
    {
      label: 'Mon compte',
      href: '/settings/compte',
      icon: <User className="w-6 h-6" />,
    },
  ];

  const isActive = (href: string) => {
    if (href === '/planning') {
      return pathname === '/' || pathname === '/dashboard' || pathname === '/planning';
    }
    return pathname?.startsWith(href);
  };

  // Extraire initiales pour l'avatar
  const getInitials = (name?: string | null) => {
    if (!name) return 'DR';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-20 bg-slate-800 text-white flex flex-col items-center py-6 shadow-lg z-30">
      {/* Logo en haut */}
      <Link href="/planning" className="mb-8">
        <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center hover:bg-slate-600 transition-colors">
          <span className="text-2xl font-bold text-teal-400">M</span>
        </div>
      </Link>

      {/* Menu de navigation principal */}
      <nav className="flex-1 w-full flex flex-col items-center space-y-1">
        {navigationItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`
              relative w-16 h-16 flex flex-col items-center justify-center rounded-xl
              transition-all duration-200 group
              ${isActive(item.href)
                ? 'bg-teal-600 text-white'
                : 'text-slate-400 hover:bg-slate-700 hover:text-white'
              }
            `}
          >
            {/* Icône */}
            <div className="relative">
              {item.icon}
              {/* Badge de notification */}
              {item.badge && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full text-xs flex items-center justify-center font-bold">
                  {item.badge}
                </span>
              )}
            </div>

            {/* Label */}
            <span className="text-xs mt-1 font-medium">{item.label}</span>

            {/* Tooltip au survol */}
            <div className="absolute left-full ml-2 px-3 py-1 bg-slate-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {item.label}
            </div>
          </Link>
        ))}
      </nav>

      {/* Section bas (Paramètres, Aide) */}
      <div className="w-full flex flex-col items-center space-y-1 mb-4">
        {bottomItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`
              relative w-16 h-16 flex flex-col items-center justify-center rounded-xl
              transition-all duration-200 group
              ${isActive(item.href)
                ? 'bg-teal-600 text-white'
                : 'text-slate-400 hover:bg-slate-700 hover:text-white'
              }
            `}
          >
            {item.icon}
            <span className="text-xs mt-1 font-medium">{item.label}</span>

            {/* Tooltip */}
            <div className="absolute left-full ml-2 px-3 py-1 bg-slate-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {item.label}
            </div>
          </Link>
        ))}
      </div>

      {/* Avatar utilisateur en bas */}
      <Link
        href={"/settings" as any}
        className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center font-bold text-sm hover:bg-teal-500 transition-colors"
      >
        {getInitials(user?.fullName)}
      </Link>
    </aside>
  );
}
