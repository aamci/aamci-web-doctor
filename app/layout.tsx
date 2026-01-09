import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from './_providers/AuthProvider';
import DoctorSidebar from '@/app/_components/DoctorSidebar';
import Navbar from '@/app/_components/Navbar';
import LayoutClient from './_components/LayoutClient';

export const metadata: Metadata = {
  title: 'Health Platform - Médecin',
  description: 'Plateforme de santé pour professionnels',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-gray-50">
        <AuthProvider>
          {/* Navbar toujours visible en haut */}
          <Navbar />

          {/* Sidebar fixe à gauche (cachée si non connecté) */}
          <DoctorSidebar />

          {/* Contenu principal avec marges ajustées */}
          <LayoutClient>
            {children}
          </LayoutClient>
        </AuthProvider>
      </body>
    </html>
  );
}
