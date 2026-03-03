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
  Activity,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../_providers/AuthProvider';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

const NAV_ITEMS = [
  { label: 'Planning',       href: '/planning',      icon: Calendar },
  { label: 'Disponibilités', href: '/availability',  icon: Clock },
  { label: 'Notes',          href: '/medical-notes', icon: FileText },
  { label: 'Tâches',         href: '/tasks',         icon: CheckSquare },
  { label: 'Patients',       href: '/patients',      icon: Users },
  { label: 'Réservations',   href: '/reservations',  icon: CalendarCheck },
  { label: 'Facturation',    href: '/billing',       icon: Receipt },
  { label: 'Activité',       href: '/activity',      icon: Activity },
  { label: 'Messages',       href: '/messages',      icon: MessageSquare },
] as const;

function Tooltip({ label }: { label: string }) {
  return (
    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 flex items-center pointer-events-none z-50">
      <div className="w-0 h-0 border-t-[5px] border-b-[5px] border-r-[6px] border-transparent border-r-slate-800" />
      <span className="px-2.5 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg shadow-2xl whitespace-nowrap border border-slate-700/50
        opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-150">
        {label}
      </span>
    </div>
  );
}

function NavLink({
  label,
  href,
  icon: Icon,
  badge,
  active,
}: {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  active: boolean;
}) {
  return (
    <Link href={href} className="relative group flex items-center justify-center w-full py-0.5">
      {/* Left accent bar */}
      <span
        className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-r-full transition-all duration-200
          ${active ? 'h-7 bg-teal-400' : 'h-0 bg-transparent'}`}
      />

      <div
        className={`relative flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-150
          ${active
            ? 'bg-teal-500/10 text-teal-400'
            : 'text-slate-500 hover:bg-slate-800 hover:text-slate-200'
          }`}
      >
        <Icon className="w-[18px] h-[18px]" strokeWidth={active ? 2.2 : 1.75} />
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none shadow-sm">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </div>

      <Tooltip label={label} />
    </Link>
  );
}

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

  if (!user) return null;

  const isActive = (href: string) => {
    if (href === '/planning') return pathname === '/' || pathname === '/dashboard' || pathname.startsWith('/planning');
    return pathname?.startsWith(href);
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'DR';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <aside className="fixed top-0 left-0 h-screen w-20 bg-slate-900 border-r border-slate-800/70 flex flex-col z-40 select-none">
      {/* Logo — same height as navbar (64px / h-16) */}
      <div className="h-16 flex items-center justify-center border-b border-slate-800/70 flex-shrink-0">
        <Link href="/planning" className="group">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center shadow-md group-hover:bg-teal-500 transition-colors">
            <span className="text-xl font-bold text-white">M</span>
          </div>
        </Link>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 flex flex-col items-center pt-3 pb-2 gap-0.5 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {NAV_ITEMS.map(({ label, href, icon }) => (
          <NavLink
            key={href}
            label={label}
            href={href}
            icon={icon}
            active={isActive(href)}
            badge={href === '/messages' ? (unreadMessages || undefined) : undefined}
          />
        ))}
      </nav>

      {/* Bottom: settings + avatar */}
      <div className="border-t border-slate-800/70 flex flex-col items-center py-3 gap-1.5">
        <NavLink
          label="Paramètres"
          href="/settings"
          icon={Settings}
          active={isActive('/settings')}
        />

        {/* User avatar */}
        <Link href="/settings/compte" className="relative group flex items-center justify-center mt-0.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-xs font-bold shadow-md hover:scale-105 transition-transform">
            {getInitials(user?.fullName)}
          </div>
          <Tooltip label={user?.fullName || 'Mon compte'} />
        </Link>
      </div>
    </aside>
  );
}
