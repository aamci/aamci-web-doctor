import { Calendar, Users, BarChart2, FileText, Video, Wallet, Shield, Smartphone } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Ibogha241 Pro — Votre cabinet, connecté.',
  description: 'La plateforme de gestion médicale pour les professionnels de santé au Gabon. Planning, patients, ordonnances et revenus en un seul endroit.',
};

const features = [
  {
    icon: Calendar,
    title: 'Planning intelligent',
    desc: 'Définissez vos disponibilités, gérez votre agenda et recevez vos rendez-vous automatiquement.',
  },
  {
    icon: Users,
    title: 'Gestion des patients',
    desc: 'Dossiers complets, historique des consultations, notes médicales sécurisées et chiffrées.',
  },
  {
    icon: FileText,
    title: 'Ordonnances numériques',
    desc: 'Rédigez et envoyez des ordonnances directement depuis la plateforme. Vos patients y accèdent instantanément.',
  },
  {
    icon: Video,
    title: 'Téléconsultation',
    desc: 'Consultez vos patients en vidéo sans quitter la plateforme. Idéal pour les suivis et renouvellements.',
  },
  {
    icon: Wallet,
    title: 'Wallet & revenus',
    desc: 'Suivez vos honoraires en temps réel et demandez vos virements en quelques clics.',
  },
  {
    icon: BarChart2,
    title: 'Statistiques',
    desc: 'Tableaux de bord analytiques pour suivre votre activité, vos revenus et la satisfaction patients.',
  },
  {
    icon: Shield,
    title: 'Données sécurisées',
    desc: 'Toutes les données médicales sont chiffrées AES-256. Conformité RGPD et standards de santé.',
  },
  {
    icon: Smartphone,
    title: 'Application mobile',
    desc: 'Gérez votre cabinet depuis votre smartphone. Disponible sur iOS et Android.',
  },
];

export default function AProposProPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">

      {/* Hero */}
      <section className="relative overflow-hidden py-20 px-4">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 50% at 60% 0%, rgba(19,78,74,0.3), transparent)' }}
        />
        <div className="max-w-3xl mx-auto text-center space-y-6 relative">
          <span className="inline-block text-teal-400 text-xs font-semibold tracking-widest uppercase">
            IBOGHA241 · PROFESSIONNELS DE SANTÉ
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight">
            Votre cabinet,{' '}
            <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              connecté.
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            La solution numérique complète pour les médecins et professionnels de santé au Gabon. Patients, planning et revenus — tout en un seul endroit.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/auth/register"
              className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-xl transition-colors"
            >
              Rejoindre la plateforme
            </Link>
            <Link
              href="/auth/login"
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold rounded-xl border border-slate-700 transition-colors"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-10">Conçu pour les praticiens</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="w-9 h-9 rounded-lg bg-teal-900/40 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-teal-400" />
                </div>
                <h3 className="font-semibold text-white text-sm">{title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 px-4">
        <div className="max-w-2xl mx-auto text-center bg-teal-900/20 border border-teal-500/30 rounded-2xl p-8 space-y-4">
          <h2 className="text-2xl font-bold text-white">Rejoignez Ibogha241 Pro</h2>
          <p className="text-slate-400">Inscription gratuite. Votre cabinet numérique opérationnel en moins de 10 minutes.</p>
          <Link
            href="/auth/register"
            className="inline-block px-6 py-3 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-xl transition-colors"
          >
            Créer mon compte professionnel
          </Link>
        </div>
      </section>

      <footer className="py-8 px-4 border-t border-slate-800/50">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600">
          <p>© {new Date().getFullYear()} Ibogha241 — Gabon</p>
          <div className="flex gap-5">
            <Link href="/politique-confidentialite" className="hover:text-slate-400 transition-colors">Confidentialité</Link>
            <Link href="/conditions-utilisation" className="hover:text-slate-400 transition-colors">CGU</Link>
            <Link href="/support" className="hover:text-slate-400 transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
