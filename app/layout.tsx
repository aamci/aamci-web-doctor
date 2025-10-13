import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'web-doctor',
  description: 'Health platform — web-doctor',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <header className="site">
          <div className="container bar">
            <strong className="brand">Plateforme Santé — web-Doctor</strong>
            <nav style={{ display:'flex', gap:8, marginLeft:'auto' }}>
              <a href="/">Accueil</a>
              <a href="/auth/login">Connexion</a>
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}