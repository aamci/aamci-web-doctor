'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronDown,
  ChevronRight,
  Building2,
  CalendarDays,
  Bell,
  User,
  Shield,
  Pen,
  Laptop,
  MessageSquare,
  BookOpen,
} from 'lucide-react';

interface NavChild {
  label: string;
  href: string;
}

interface NavGroup {
  label: string;
  icon: any;
  children: NavChild[];
}

const NAV: NavGroup[] = [
  {
    label: 'Cabinet',
    icon: Building2,
    children: [
      { label: 'Types de consultation', href: '/settings/consultation-types' },
      { label: 'Absences & indisponibilités', href: '/settings/absences' },
      { label: 'Calendrier externe', href: '/settings/calendar-sync' },
      { label: 'Établissement', href: '/facility-management' },
    ],
  },
  {
    label: 'Agenda',
    icon: CalendarDays,
    children: [
      { label: 'Affichage agenda', href: '/settings/agenda' },
      { label: 'Notifications', href: '/settings/notifications' },
    ],
  },
  {
    label: 'Compte & Sécurité',
    icon: User,
    children: [
      { label: 'Profil & compte', href: '/settings/compte' },
      { label: 'Confidentialité', href: '/settings/confidentialite' },
      { label: 'Journal de sécurité', href: '/settings/journal-securite' },
      { label: 'Ma signature', href: '/settings/ma-signature' },
    ],
  },
  {
    label: 'Application',
    icon: Laptop,
    children: [
      { label: 'Paramètres app', href: '/settings/application' },
    ],
  },
  {
    label: 'Aide',
    icon: MessageSquare,
    children: [
      { label: 'Support', href: '/settings/support' },
    ],
  },
];

function NavGroup({ group, pathname }: { group: NavGroup; pathname: string }) {
  const hasActiveChild = group.children.some(
    (c) => pathname === c.href || pathname.startsWith(c.href + '/')
  );
  const [open, setOpen] = useState(hasActiveChild ?? true);
  const Icon = group.icon;

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-md transition-colors ${
          hasActiveChild ? 'text-slate-800' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5" />
          <span>{group.label}</span>
        </div>
        {open
          ? <ChevronDown className="w-3 h-3 opacity-60" />
          : <ChevronRight className="w-3 h-3 opacity-60" />
        }
      </button>

      {open && (
        <div className="mt-0.5 mb-2 ml-2 border-l border-slate-200 pl-3 space-y-0.5">
          {group.children.map((child) => {
            const isActive = pathname === child.href ||
              (child.href !== '/settings' && pathname.startsWith(child.href + '/'));
            return (
              <Link
                key={child.href}
                href={child.href as any}
                className={`flex items-center gap-2 px-2 py-1.5 text-sm rounded-lg transition-colors ${
                  isActive
                    ? 'bg-teal-50 text-teal-700 font-medium'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                )}
                <span className={`truncate ${!isActive ? 'ml-3.5' : ''}`}>{child.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Settings sidebar */}
      <div className="fixed left-20 top-16 w-52 bottom-0 bg-white border-r border-slate-100 z-20 overflow-y-auto">
        <div className="p-4 pt-5">
          {/* Header link */}
          <Link
            href="/settings"
            className={`flex items-center gap-2.5 px-3 py-2 mb-4 rounded-lg text-sm font-semibold transition-colors ${
              pathname === '/settings'
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4 text-teal-600" />
            Paramètres
          </Link>

          <div className="space-y-1">
            {NAV.map((group) => (
              <NavGroup key={group.label} group={group} pathname={pathname} />
            ))}
          </div>
        </div>
      </div>

      {/* Content area — clears left sidebar (80px main + 208px settings) and top navbar (64px) */}
      <div className="ml-52 flex-1 min-w-0 pt-16">
        <div className="max-w-3xl mx-auto px-6 py-8">
          {children}
        </div>
      </div>
    </div>
  );
}
