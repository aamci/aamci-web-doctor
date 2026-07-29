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
  ArrowRightLeft,
  Mail,
  Building2,
  Video,
  LayoutDashboard,
  History,
} from 'lucide-react';
import { useAuth } from '../_providers/AuthProvider';
import { Logo } from '@/components/Logo';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

// roles autorisés par item (undefined = tous les rôles pro)
const NAV_ITEMS_DOCTOR = [
  { label: 'Planning',     href: '/planning',            icon: Calendar,       roles: undefined },
  { label: 'Notes',        href: '/medical-notes',       icon: FileText,       roles: ['DOCTOR'] },
  { label: 'Tâches',       href: '/tasks',               icon: CheckSquare,    roles: ['DOCTOR', 'FACILITY_MANAGER'] },
  { label: 'Patients',     href: '/patients',            icon: Users,          roles: undefined },
  { label: 'Réservations', href: '/reservations',        icon: CalendarCheck,  roles: ['DOCTOR', 'FACILITY_MANAGER'] },
  { label: 'Équipe',       href: '/team',                icon: Building2,      roles: ['DOCTOR', 'FACILITY_MANAGER'] },
  { label: 'Facturation',  href: '/billing',             icon: Receipt,        roles: ['DOCTOR', 'FACILITY_MANAGER'] },
  { label: 'Activité',     href: '/activity',            icon: Activity,       roles: ['DOCTOR', 'FACILITY_MANAGER'] },
  { label: 'Messagerie',   href: '/messages',            icon: MessageSquare,  roles: undefined },
  { label: 'Visio',        href: '/teleconsultation',    icon: Video,          roles: ['DOCTOR', 'FACILITY_MANAGER'] },
  { label: 'Adressages',   href: '/referrals',           icon: ArrowRightLeft, roles: ['DOCTOR'] },
  { label: 'Cabinet',      href: '/facility-management', icon: Building2,      roles: ['DOCTOR', 'FACILITY_MANAGER'] },
  { label: 'Historique',   href: '/historique',          icon: History,        roles: ['DOCTOR', 'FACILITY_MANAGER'] },
];

const NAV_ITEMS_FACILITY_MANAGER = [
  { label: 'Tableau de bord', href: '/manager',                 icon: LayoutDashboard, roles: undefined },
  { label: 'Planning',        href: '/planning',                icon: Calendar,        roles: undefined },
  { label: 'Multi-agenda',    href: '/manager/multi-agenda',    icon: Clock,           roles: undefined },
  { label: 'Patients',        href: '/patients',                icon: Users,           roles: undefined },
  { label: 'Réservations',    href: '/reservations',            icon: CalendarCheck,   roles: undefined },
  { label: 'Cabinet',         href: '/facility-management',     icon: Building2,       roles: undefined },
  { label: 'Historique',      href: '/historique',              icon: History,         roles: undefined },
  { label: 'Messages',        href: '/messages',                icon: MessageSquare,   roles: undefined },
];

const NAV_ITEMS_SECRETARY = [
  { label: 'Agenda',   href: '/agenda',              icon: Calendar,      roles: undefined },
  { label: 'Patients', href: '/patients',            icon: Users,         roles: undefined },
  { label: 'Cabinet',  href: '/facility-management', icon: Building2,     roles: undefined },
  { label: 'Messages', href: '/messages',            icon: MessageSquare, roles: undefined },
];

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
    <Link href={href as any} className="relative group flex flex-col items-center justify-center w-full py-1">
      {/* Left accent bar */}
      <span
        className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-r-full transition-all duration-200
          ${active ? 'h-7 bg-teal-400' : 'h-0 bg-transparent'}`}
      />

      <div
        className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-150
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

      <span className={`text-[9px] font-medium mt-0.5 transition-colors leading-tight text-center ${active ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
        {label}
      </span>

      <Tooltip label={label} />
    </Link>
  );
}

export default function DoctorSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadCorrespondences, setUnreadCorrespondences] = useState(0);

  const fetchCounts = useCallback(async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const [msgRes, corrRes] = await Promise.all([
        fetch(`${API_BASE_URL}/messages/unread-count`, { headers }),
        fetch(`${API_BASE_URL}/correspondences/unread-count`, { headers }),
      ]);
      if (msgRes.ok) { const d = await msgRes.json(); setUnreadMessages(d.count || 0); }
      if (corrRes.ok) { const d = await corrRes.json(); setUnreadCorrespondences(d.count || 0); }
    } catch { /* silent */ }
  }, [user]);

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [fetchCounts]);

  if (!user) return null;

  const isActive = (href: string) => {
    if (href === '/planning') return pathname === '/' || pathname === '/dashboard' || pathname.startsWith('/planning');
    if (href === '/agenda') return pathname === '/agenda' || (user?.role === 'SECRETARY' && (pathname === '/' || pathname === '/dashboard'));
    if (href === '/teleconsultation') return pathname.startsWith('/teleconsultation') || pathname.startsWith('/visio');
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
      <div className="h-16 flex items-center justify-center border-b border-slate-800/70 flex-shrink-0 px-2">
        <Link href={(user?.role === 'SECRETARY' || user?.role === 'FACILITY_MANAGER' ? '/manager' : '/planning') as any} className="group">
          <Logo className="h-10 w-auto" />
        </Link>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 flex flex-col items-center pt-3 pb-2 gap-0.5 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {(['SECRETARY', 'FACILITY_MANAGER'].includes(user?.role ?? '') ? NAV_ITEMS_FACILITY_MANAGER : NAV_ITEMS_DOCTOR)
          .filter(item => !item.roles || item.roles.includes(user?.role ?? ''))
          .map(({ label, href, icon }) => (
            <NavLink
              key={href}
              label={label}
              href={href}
              icon={icon}
              active={isActive(href)}
              badge={
                href === '/messages' ? (unreadMessages || undefined) :
                href === '/correspondances' ? (unreadCorrespondences || undefined) : undefined
              }
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
