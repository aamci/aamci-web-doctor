import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from './_providers/AuthProvider';
import DoctorSidebar from '@/app/_components/DoctorSidebar';

export const metadata: Metadata = {
  title: 'Health Platform - Médecin',
  description: 'Plateforme de santé pour professionnels',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-gray-50">
        <AuthProvider>
          {/* Sidebar fixe à gauche */}
          <DoctorSidebar />

          {/* Contenu principal avec marge à gauche pour le sidebar */}
          <main className="ml-20 min-h-screen">
            <div className="max-w-7xl mx-auto p-8">
              {children}
            </div>
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
