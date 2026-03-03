'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronDown,
  ChevronRight,
  Home,
  Building2,
  CalendarDays,
  Bell,
  Settings,
  User,
  Shield,
  BookOpen,
  Pen,
  Users,
  Clock,
  Monitor,
  Activity,
  Database,
  Laptop,
  Stethoscope,
  Lock,
} from 'lucide-react';

interface NavItem {
  label: string;
  href?: string;
  icon?: any;
  children?: NavItem[];
}

const NAV: NavItem[] = [
  { label: 'Accueil', href: '/settings', icon: Home },
  {
    label: 'Mon cabinet',
    icon: Building2,
    children: [
      { label: 'Comptes utilisateurs', href: '/team' },
      { label: 'Agendas', href: '/settings/agenda' },
      { label: 'Absences', href: '/settings/absences' },
      { label: 'Calendrier externe', href: '/settings/calendar-sync' },
      { label: 'Lieux de consultation', href: '/facility-management' },
    ],
  },
  {
    label: 'Gestion des rendez-vous',
    icon: CalendarDays,
    children: [
      { label: 'Types de consultation', href: '/settings/consultation-types' },
      { label: 'Notifications', href: '/settings/notifications' },
    ],
  },
  {
    label: 'Paramètres avancés',
    icon: Settings,
    children: [
      { label: 'Application', href: '/settings/application' },
      { label: 'Statistiques', href: '/activity' },
      { label: 'Données', href: '/settings/confidentialite' },
    ],
  },
  { label: 'Mon compte', href: '/settings/compte', icon: User },
  { label: 'Centre de confidentialité', href: '/settings/confidentialite', icon: Lock },
  { label: 'Journal de sécurité', href: '/settings/journal-securite', icon: Shield },
  { label: 'Ma signature', href: '/settings/ma-signature', icon: Pen },
];

function NavSection({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = item.href ? pathname === item.href || pathname.startsWith(item.href + '/') : false;
  const hasActiveChild = item.children?.some(
    (c) => c.href && (pathname === c.href || pathname.startsWith(c.href + '/'))
  );
  const [open, setOpen] = useState(hasActiveChild ?? true);
  const Icon = item.icon;

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
            hasActiveChild ? 'text-gray-900 font-medium' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
            <span className="truncate">{item.label}</span>
          </div>
          {open ? <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />}
        </button>
        {open && (
          <div className="ml-3 mt-0.5 space-y-0.5 border-l border-gray-200 pl-3">
            {item.children.map((child) => (
              <NavLeaf key={child.label} item={child} pathname={pathname} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return <NavLeaf item={item} pathname={pathname} />;
}

function NavLeaf({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = item.href && (pathname === item.href || (item.href !== '/settings' && pathname.startsWith(item.href)));
  const Icon = item.icon;

  if (!item.href) return null;

  return (
    <Link
      href={item.href as any}
      className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors truncate ${
        isActive
          ? 'bg-gray-100 text-gray-900 font-medium'
          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
      }`}
    >
      {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Settings sidebar — positioned right after DoctorSidebar (left-20 = 80px) */}
      <div className="fixed left-20 top-16 w-48 bottom-0 bg-white border-r border-gray-200 z-20 overflow-y-auto">
        <div className="p-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">
            Paramètres
          </p>
          <nav className="space-y-0.5">
            {NAV.map((item) => (
              <NavSection key={item.label} item={item} pathname={pathname} />
            ))}
          </nav>
        </div>
      </div>

      {/* Main content — shifted right to clear sidebar */}
      <div className="ml-48 flex-1 min-w-0">
        {/* Page content */}
        {children}
      </div>
    </div>
  );
}
