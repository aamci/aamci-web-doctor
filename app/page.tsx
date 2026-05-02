'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from './_providers/AuthProvider';
import {
  Calendar, Video, Wallet, BarChart2, Users,
  Bell, FileText, ArrowRight,
  CheckCircle, Stethoscope, MessageSquare,
  Shield, Smartphone,
} from 'lucide-react';

const FEATURES = [
  { icon: Calendar,      color: 'teal',    title: 'Gestion du planning',          desc: 'Définissez vos disponibilités, gérez vos créneaux en temps réel.' },
  { icon: Video,         color: 'violet',  title: 'Téléconsultation intégrée',    desc: 'Consultations vidéo HD avec salle d\'attente virtuelle incluse.' },
  { icon: Users,         color: 'sky',     title: 'Dossier patient complet',      desc: 'Historique, notes médicales, ordonnances et correspondances.' },
  { icon: Wallet,        color: 'emerald', title: 'Portefeuille & paiements',     desc: 'Suivez vos revenus et effectuez des retraits en un clic.' },
  { icon: BarChart2,     color: 'amber',   title: 'Tableau de bord analytique',   desc: 'Statistiques : occupation, revenus, profil patients, évolution.' },
  { icon: FileText,      color: 'rose',    title: 'Ordonnances & prescriptions',  desc: 'Créez vos ordonnances depuis des modèles, envoyées automatiquement.' },
  { icon: MessageSquare, color: 'cyan',    title: 'Messagerie sécurisée',         desc: 'Communicez avec patients et confrères en toute confidentialité.' },
  { icon: Bell,          color: 'orange',  title: 'Notifications temps réel',     desc: 'Alertes instantanées pour nouveaux RDV, annulations et messages.' },
  { icon: Shield,        color: 'indigo',  title: 'Données chiffrées',            desc: 'Chiffrement AES-256. Conformité RGPD et HDS garantie.' },
];

const COLOR_MAP: Record<string, { icon: string; bg: string; border: string }> = {
  teal:    { icon: 'text-teal-400',   bg: 'bg-teal-400/10',   border: 'border-teal-400/20' },
  violet:  { icon: 'text-violet-400', bg: 'bg-violet-400/10', border: 'border-violet-400/20' },
  sky:     { icon: 'text-sky-400',    bg: 'bg-sky-400/10',    border: 'border-sky-400/20' },
  emerald: { icon: 'text-emerald-400',bg: 'bg-emerald-400/10',border: 'border-emerald-400/20' },
  amber:   { icon: 'text-amber-400',  bg: 'bg-amber-400/10',  border: 'border-amber-400/20' },
  rose:    { icon: 'text-rose-400',   bg: 'bg-rose-400/10',   border: 'border-rose-400/20' },
  cyan:    { icon: 'text-cyan-400',   bg: 'bg-cyan-400/10',   border: 'border-cyan-400/20' },
  orange:  { icon: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20' },
  indigo:  { icon: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'border-indigo-400/20' },
};

const STATS = [
  { value: '2 000+', label: 'Médecins actifs' },
  { value: '50 000+', label: 'Consultations/mois' },
  { value: '98%', label: 'Taux de satisfaction' },
  { value: '24/7', label: 'Support disponible' },
];

const PLANS = [
  {
    name: 'Starter',
    price: 'Gratuit',
    period: '',
    features: ['Agenda en ligne', '50 RDV/mois', 'Messagerie basique', 'Support email'],
    highlight: false,
  },
  {
    name: 'Pro',
    price: '49€',
    period: '/mois',
    features: ['RDV illimités', 'Téléconsultation HD', 'Dossier patient complet', 'Ordonnances', 'Statistiques avancées', 'Support prioritaire'],
    highlight: true,
  },
  {
    name: 'Établissement',
    price: 'Sur devis',
    period: '',
    features: ['Multi-praticiens', 'Gestion des salles', 'API & intégrations', 'SLA garanti', 'Onboarding dédié'],
    highlight: false,
  },
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.push('/dashboard');
  }, [user, loading, router]);

  if (loading) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">

      {/* ── Navbar ─────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center shadow">
              <Stethoscope className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">Health Platform</p>
              <p className="text-[10px] text-teal-400 font-medium">Pro</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a>
            <a href="#pricing" className="hover:text-white transition-colors">Tarifs</a>
            <a href="#stats" className="hover:text-white transition-colors">Chiffres</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm text-slate-400 hover:text-white transition-colors px-3 py-1.5">
              Connexion
            </Link>
            <Link href="/auth/login" className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-500 transition-colors shadow-sm shadow-teal-900/50">
              Commencer
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="pt-32 pb-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-900/20 via-slate-950 to-slate-950" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-teal-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-400/10 border border-teal-400/20 rounded-full text-teal-400 text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse" />
            Plateforme médicale nouvelle génération
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Gérez votre cabinet
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
              avec efficacité
            </span>
          </h1>
          <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Agenda en ligne, téléconsultation, dossiers patients, ordonnances et paiements — tout en un seul outil conçu pour les professionnels de santé.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth/login"
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-500 transition-colors shadow-lg shadow-teal-900/40"
            >
              Accéder à mon espace <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#features"
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-800 text-slate-300 rounded-xl font-semibold hover:bg-slate-700 hover:text-white transition-colors border border-slate-700"
            >
              Voir les fonctionnalités
            </a>
          </div>
        </div>

        {/* Dashboard mockup */}
        <div className="relative mt-16 max-w-4xl mx-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl shadow-black/50">
            <div className="flex items-center gap-1.5 mb-4">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
              <div className="ml-2 flex-1 h-5 bg-slate-800 rounded-md flex items-center px-2">
                <span className="text-[10px] text-slate-500">pro.ibogha.elowe.fr/dashboard</span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'RDV aujourd\'hui', value: '12', color: 'teal' },
                { label: 'En attente', value: '3', color: 'amber' },
                { label: 'Revenus mois', value: '3 420€', color: 'emerald' },
                { label: 'Patients actifs', value: '284', color: 'sky' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-slate-800 rounded-xl p-3 border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-1">{label}</p>
                  <p className={`text-xl font-bold text-${color}-400`}>{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <div className="col-span-2 bg-slate-800 rounded-xl p-3 border border-slate-700/50 h-24 flex items-center justify-center">
                <div className="flex gap-1 items-end h-12">
                  {[40, 65, 50, 80, 60, 90, 70].map((h, i) => (
                    <div key={i} className="w-5 bg-teal-600/60 rounded-t" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
              <div className="bg-slate-800 rounded-xl p-3 border border-slate-700/50 space-y-2">
                {['09:00 — Dr. Martin', '10:30 — Téléconsult', '14:00 — Suivi'].map(s => (
                  <div key={s} className="text-[10px] text-slate-400 bg-slate-700/50 rounded px-2 py-1">{s}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────────────── */}
      <section id="stats" className="py-16 px-4 border-y border-slate-800 bg-slate-900/40">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map(({ value, label }) => (
            <div key={label}>
              <p className="text-3xl font-bold text-teal-400 mb-1">{value}</p>
              <p className="text-sm text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-3">Tout ce dont vous avez besoin</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Un écosystème complet pour digitaliser et optimiser votre pratique médicale.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, color, title, desc }) => {
              const c = COLOR_MAP[color];
              return (
                <div key={title} className={`bg-slate-900 border ${c.border} rounded-2xl p-5 hover:border-opacity-60 transition-all hover:-translate-y-0.5`}>
                  <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${c.icon}`} />
                  </div>
                  <h3 className="font-semibold text-white mb-1.5">{title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Mobile app ─────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-slate-900/40 border-y border-slate-800">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-400/10 border border-violet-400/20 rounded-full text-violet-400 text-xs font-medium mb-4">
              <Smartphone className="w-3 h-3" /> Application mobile
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Votre cabinet dans votre poche</h2>
            <p className="text-slate-400 mb-6 leading-relaxed">
              Gérez vos rendez-vous, rejoignez vos téléconsultations et consultez vos dossiers patients depuis votre smartphone, où que vous soyez.
            </p>
            <ul className="space-y-3">
              {['Notifications push instantanées', 'Mode hors-ligne pour les dossiers', 'Signature électronique des ordonnances', 'Disponible iOS & Android'].map(f => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-slate-300">
                  <CheckCircle className="w-4 h-4 text-teal-400 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 flex justify-center gap-4">
            <div className="w-36 h-64 bg-slate-800 rounded-2xl border border-slate-700 p-2 shadow-xl">
              <div className="w-full h-full bg-slate-900 rounded-xl flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-600/20 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-teal-400" />
                </div>
                <div className="space-y-1.5 w-full px-2">
                  {[80, 60, 90].map((w, i) => (
                    <div key={i} className="h-1.5 bg-slate-700 rounded-full" style={{ width: `${w}%` }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="w-36 h-64 bg-slate-800 rounded-2xl border border-slate-700 p-2 shadow-xl mt-6">
              <div className="w-full h-full bg-slate-900 rounded-xl flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center">
                  <Video className="w-4 h-4 text-violet-400" />
                </div>
                <div className="space-y-1.5 w-full px-2">
                  {[70, 85, 55].map((w, i) => (
                    <div key={i} className="h-1.5 bg-slate-700 rounded-full" style={{ width: `${w}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-3">Tarifs transparents</h2>
            <p className="text-slate-400">Sans engagement, sans frais cachés.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map(({ name, price, period, features, highlight }) => (
              <div
                key={name}
                className={`rounded-2xl p-6 border transition-all ${
                  highlight
                    ? 'bg-teal-600/10 border-teal-500/40 shadow-lg shadow-teal-900/20'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                {highlight && (
                  <div className="inline-block px-2.5 py-1 bg-teal-600 text-white text-xs font-bold rounded-full mb-3">
                    Recommandé
                  </div>
                )}
                <h3 className="text-lg font-bold text-white mb-1">{name}</h3>
                <div className="flex items-baseline gap-1 mb-5">
                  <span className={`text-3xl font-bold ${highlight ? 'text-teal-400' : 'text-white'}`}>{price}</span>
                  <span className="text-slate-500 text-sm">{period}</span>
                </div>
                <ul className="space-y-2.5 mb-6">
                  {features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 ${highlight ? 'text-teal-400' : 'text-slate-500'}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/login"
                  className={`block w-full py-2.5 rounded-xl text-sm font-semibold text-center transition-colors ${
                    highlight
                      ? 'bg-teal-600 text-white hover:bg-teal-500'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  Commencer
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-3xl p-10 shadow-xl">
            <div className="w-12 h-12 bg-teal-600/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Stethoscope className="w-6 h-6 text-teal-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Prêt à moderniser votre cabinet ?</h2>
            <p className="text-slate-400 mb-7">Rejoignez des milliers de professionnels de santé qui font confiance à Health Platform.</p>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-500 transition-colors shadow-lg shadow-teal-900/40"
            >
              Accéder à mon espace <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800 py-10 px-4 bg-slate-900/40">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center">
              <Stethoscope className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">Health Platform Pro</span>
          </div>
          <p className="text-xs text-slate-600">© 2026 Health Platform. Tous droits réservés.</p>
          <div className="flex gap-5 text-xs text-slate-500">
            <a href="#" className="hover:text-slate-300 transition-colors">Confidentialité</a>
            <a href="#" className="hover:text-slate-300 transition-colors">CGU</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
