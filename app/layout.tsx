import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from './_providers/AuthProvider';
import Navbar from '@/app/_components/Navbar';

export const metadata: Metadata = {
  title: 'web-doctor',
  description: 'Health platform — web-doctor',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
          <Navbar />
          <main style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}