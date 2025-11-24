// app/_components/Navbar.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/app/_providers/AuthProvider';

// Si tu utilises shadcn/ui :
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';

function getInitials(nameOrEmail?: string | null) {
  if (!nameOrEmail) return 'U';
  const parts = nameOrEmail.split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return nameOrEmail.charAt(0).toUpperCase();
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const linksForDoctor = [
    { href: '/availability', label: 'Planning' },
    { href: '/appointments', label: 'Mes rendez-vous' },
  ];

  const linksForPatient = [
    { href: '/', label: 'Accueil' },
    { href: '/doctors', label: 'Trouver un médecin' },
    { href: '/appointments', label: 'Mes rendez-vous' },
  ];

  const links = user?.role === 'DOCTOR' ? linksForDoctor : linksForPatient;

  function handleLogout() {
    logout();
    router.replace('/auth/login');
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Logo + badge espace */}
        <button
          type="button"
          onClick={() => router.push('/')}
          className="flex items-center gap-2 rounded-md px-1 py-1 hover:bg-accent"
        >
          <span className="text-sm font-semibold">Plateforme Santé</span>
          {user?.role && (
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-600">
              {user.role === 'DOCTOR' ? 'Espace médecin' : 'Espace patient'}
            </span>
          )}
        </button>

        {/* Liens centre */}
        <nav className="flex items-center gap-2">
        {links.map((l) => {
          const active = pathname === l.href;
          return (
            <button
              key={l.href}
              type="button"
              onClick={() => router.push(l.href as any)} // ✅ cast pour satisfaire le type
              className={[
                'rounded-md px-3 py-1.5 text-sm transition-colors',
                active
                  ? 'bg-blue-50 text-blue-600 font-semibold'
                  : 'text-slate-800 hover:bg-slate-50',
              ].join(' ')}
            >
              {l.label}
            </button>
          );
        })}
        </nav>

        {/* Droite : login / menu utilisateur */}
        <div className="flex items-center gap-3">
          {!user ? (
            <Button size="sm" onClick={() => router.push('/auth/login')}>
              Connexion
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full px-2 py-1 hover:bg-accent"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user.avatarUrl || undefined} />
                    <AvatarFallback>
                      {getInitials(user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-xs sm:inline">
                    {user.email}
                  </span>
                  <span className="text-[10px] text-muted-foreground">▼</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Compte</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/account">Mon compte</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/">Home</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/appointments">Mes rendez-vous</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600"
                >
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}