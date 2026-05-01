'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from './_providers/AuthProvider';
import {
  Calendar, Video, Wallet, BarChart2, Users, Shield,
  Bell, FileText, Clock, ChevronRight, ArrowRight,
  CheckCircle, Stethoscope, Building2, MessageSquare,
  Star, Lock, Smartphone, Settings, Search,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Calendar, color: 'blue',
    title: 'Gestion du planning',
    desc: 'Définissez vos disponibilités, gérez vos créneaux et synchronisez votre agenda en temps réel.',
  },
  {
    icon: Video, color: 'purple',
    title: 'Téléconsultation intégrée',
    desc: 'Lancez des consultations vidéo HD directement depuis la plateforme. Salle d\'attente virtuelle incluse.',
  },
  {
    icon: Users, color: 'teal',
    title: 'Dossier patient complet',
    desc: 'Accédez à l\'historique, aux notes médicales, ordonnances et correspondances de chaque patient.',
  },
  {
    icon: Wallet, color: 'green',
    title: 'Portefeuille & paiements',
    desc: 'Suivez vos revenus, consultez vos paiements reçus et effectuez des retraits en un clic.',
  },
  {
    icon: BarChart2, color: 'orange',
    title: 'Tableau de bord analytique',
    desc: 'Visualisez vos statistiques : taux d\'occupation, revenus, profil des patients, évolution mensuelle.',
  },
  {
    icon: FileText, color: 'red',
    title: 'Ordonnances & prescriptions',
    desc: 'Créez et gérez vos ordonnances depuis des modèles. Envoi automatique au patient.',
  },
  {
    icon: MessageSquare, color: 'cyan',
    title: 'Messagerie sécurisée',
    desc: 'Communiquez avec vos patients et confrères via une messagerie médicale confidentielle.',
  },
  {
    icon: Building2, color: 'indigo',
    title: 'Multi-établissements',
    desc: 'Gérez votre activité sur plusieurs cliniques ou cabinets depuis un seul compte.',
  },
  {
    icon: Bell, color: 'yellow',
    title: 'Notifications en temps réel',
    desc: 'Recevez des alertes pour chaque nouveau rendez-vous, message ou transfert de dossier.',
  },
];

const colorMap: Record<string, { bg: string; icon: string }> = {
  blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600' },
  teal:   { bg: 'bg-teal-50',   icon: 'text-teal-600' },
  green:  { bg: 'bg-green-50',  icon: 'text-green-600' },
  orange: { bg: 'bg-orange-50', icon: 'text-orange-500' },
  red:    { bg: 'bg-red-50',    icon: 'text-red-500' },
  cyan:   { bg: 'bg-cyan-50',   icon: 'text-cyan-600' },
  indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600' },
  yellow: { bg: 'bg-yellow-50', icon: 'text-yellow-600' },
};

const PLANS = [
  {
    name: 'Solo',
    price: 'Gratuit',
    period: '',
    desc: 'Pour démarrer',
    features: ['Jusqu\'à 30 RDV/mois', 'Planning en ligne', 'Notifications', 'Support email'],
    cta: 'Commencer gratuitement',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '29€',
    period: '/ mois',
    desc: 'Le plus populaire',
    features: ['RDV illimités', 'Téléconsultation', 'Dossiers patients', 'Portefeuille', 'Statistiques', 'Support prioritaire'],
    cta: 'Essai gratuit 30 jours',
    highlight: true,
  },
  {
    name: 'Clinique',
    price: 'Sur devis',
    period: '',
    desc: 'Pour les équipes',
    features: ['Tout du plan Pro', 'Multi-médecins', 'Multi-établissements', 'API d\'intégration', 'Manager dédié'],
    cta: 'Nous contacter',
    highlight: false,
  },
];

export default function ProLandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [user, loading, router]);

  if (!loading && user) return null;

  return (
    <div className="min-h-screen bg-white">

      {/* ── Navbar ────────────────────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Stethoscope className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Ibogha</span>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full ml-1">Pro</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Fonctionnalités</a>
            <a href="#how" className="hover:text-blue-600 transition-colors">Comment ça marche</a>
            <a href="#pricing" className="hover:text-blue-600 transition-colors">Tarifs</a>
            <Link href="https://patient.ibogha.elowe.fr" className="hover:text-blue-600 transition-colors text-gray-400">
              Espace patient →
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm text-gray-700 hover:text-blue-600 font-medium transition-colors">
              Connexion
            </Link>
            <Link href="/auth/register" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
              Inscription gratuite
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative pt-16 overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 right-20 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-72 h-72 bg-indigo-500 rounded-full blur-3xl" />
        </div>
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

        <div className="relative max-w-6xl mx-auto px-4 py-28 sm:py-36">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 backdrop-blur-sm rounded-full text-blue-300 text-sm mb-8 border border-blue-500/30">
                <Shield className="w-4 h-4" />
                <span>Plateforme médicale certifiée — RGPD & HDS</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
                La plateforme qui<br />
                <span className="text-blue-400">simplifie votre cabinet</span>
              </h1>
              <p className="text-lg text-slate-300 mb-8 leading-relaxed">
                Gérez vos rendez-vous, conduisez des téléconsultations, suivez vos patients
                et pilotez votre activité — tout depuis Ibogha Pro.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Link href="/auth/register" className="px-6 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-900/50">
                  Commencer gratuitement
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/auth/login" className="px-6 py-4 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-colors border border-white/20 flex items-center justify-center">
                  Se connecter
                </Link>
              </div>
              <div className="flex flex-wrap gap-6 text-sm text-slate-400">
                {['Aucune carte requise', 'Essai 30 jours gratuit', 'Résiliation à tout moment'].map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dashboard mockup */}
            <div className="hidden lg:block">
              <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-700 p-4 shadow-2xl">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                      <Stethoscope className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-white text-sm font-medium">Tableau de bord</span>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: 'RDV aujourd\'hui', value: '12' },
                    { label: 'Revenus du mois', value: '3 240€' },
                    { label: 'Patients actifs', value: '247' },
                  ].map((s, i) => (
                    <div key={i} className="bg-slate-700/50 rounded-xl p-3">
                      <div className="text-slate-400 text-xs mb-1">{s.label}</div>
                      <div className="text-white font-bold text-lg">{s.value}</div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {[
                    { name: 'Amara K.', time: '09:00', type: 'Consultation', visio: false },
                    { name: 'Thierry M.', time: '10:30', type: 'Téléconsultation', visio: true },
                    { name: 'Fatou D.', time: '14:00', type: 'Suivi', visio: false },
                  ].map((apt, i) => (
                    <div key={i} className="flex items-center gap-3 bg-slate-700/30 rounded-xl p-3">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-blue-400 text-xs font-bold">{apt.name[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium">{apt.name}</div>
                        <div className="text-slate-400 text-xs">{apt.type}</div>
                      </div>
                      <div className="text-slate-300 text-sm">{apt.time}</div>
                      {apt.visio && (
                        <div className="px-2 py-1 bg-purple-500/20 rounded-lg">
                          <Video className="w-3 h-3 text-purple-400" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 inset-x-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60L1440 60L1440 0C1200 40 900 60 720 60C540 60 240 40 0 0L0 60Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ── Social proof ──────────────────────────────────────────────────── */}
      <section className="py-10 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm mb-6">Rejoignez des centaines de praticiens qui font confiance à Ibogha</p>
          <div className="flex flex-wrap justify-center gap-8 items-center text-gray-300 font-semibold text-sm">
            {['Clinique du Soleil', 'Cabinet Médical Nord', 'Polyclinique Centrale', 'Centre de Santé Est', 'Hôpital Privé Lumière'].map((name, i) => (
              <span key={i}>{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Tout ce dont vous avez besoin pour exercer</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">Ibogha Pro est conçu avec et pour les professionnels de santé.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => {
              const c = colorMap[f.color];
              return (
                <div key={i} className="rounded-2xl p-7 border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all group">
                  <div className={`w-12 h-12 ${c.bg} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                    <f.icon className={`w-6 h-6 ${c.icon}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Teleconsultation highlight ─────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-gray-900 text-sm">Salle d'attente virtuelle</h3>
                <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  2 patients en attente
                </div>
              </div>
              <div className="space-y-3 mb-5">
                {[
                  { name: 'Jean P.', wait: '5 min', ready: true },
                  { name: 'Marie L.', wait: '18 min', ready: false },
                ].map((p, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-blue-600 font-bold text-sm">{p.name[0]}</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{p.name}</div>
                      <div className="text-xs text-gray-500">Attente : {p.wait}</div>
                    </div>
                    {p.ready && (
                      <div className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg font-medium flex items-center gap-1">
                        <Video className="w-3 h-3" />
                        Appeler
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
                {[{ label: 'Aujourd\'hui', value: '8' }, { label: 'En cours', value: '1' }, { label: 'Terminées', value: '5' }].map((s, i) => (
                  <div key={i} className="text-center">
                    <div className="text-lg font-bold text-gray-900">{s.value}</div>
                    <div className="text-xs text-gray-400">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 rounded-full text-blue-700 text-sm font-medium mb-6">
                <Video className="w-4 h-4" />
                Téléconsultation Pro
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">Votre cabinet virtuel, toujours disponible</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Gérez votre file d'attente virtuelle, lancez des consultations vidéo HD
                et envoyez les ordonnances directement depuis l'interface.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Salle d\'attente virtuelle avec temps d\'attente en direct',
                  'Vidéo HD chiffrée bout en bout',
                  'Chat et partage de documents pendant la séance',
                  'Ordonnance générée et envoyée automatiquement',
                  'Facturation intégrée à la fin de chaque séance',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/auth/register" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
                Essayer la téléconsultation
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section id="how" className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Opérationnel en moins de 10 minutes</h2>
            <p className="text-gray-500 text-lg">Aucune installation requise — tout fonctionne depuis votre navigateur</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { n: '1', icon: Users, title: 'Créez votre profil', desc: 'Renseignez votre spécialité, vos tarifs et vos établissements en quelques minutes.' },
              { n: '2', icon: Settings, title: 'Configurez vos disponibilités', desc: 'Définissez vos jours et horaires de consultation. Ibogha gère le reste.' },
              { n: '3', icon: Search, title: 'Vos patients vous trouvent', desc: 'Votre profil apparaît dans l\'annuaire Ibogha accessible aux patients.' },
              { n: '4', icon: BarChart2, title: 'Pilotez votre activité', desc: 'Tableaux de bord, revenus, statistiques — tout sous un seul regard.' },
            ].map((step, i) => (
              <div key={i} className="text-center relative">
                {i < 3 && (
                  <div className="hidden md:block absolute top-5 left-[65%] w-full h-0.5 bg-gray-100">
                    <ChevronRight className="absolute -top-2.5 right-0 text-gray-300 w-5 h-5" />
                  </div>
                )}
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md shadow-blue-100 relative z-10">
                  <step.icon className="w-6 h-6 text-white" />
                </div>
                <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-bold mx-auto mb-3">{step.n}</div>
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">{step.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Des tarifs simples et transparents</h2>
            <p className="text-gray-500 text-lg">Commencez gratuitement, évoluez à votre rythme</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((plan, i) => (
              <div key={i} className={`rounded-2xl p-8 border-2 relative ${plan.highlight ? 'border-blue-600 bg-blue-600 text-white shadow-xl shadow-blue-200' : 'border-gray-200 bg-white'}`}>
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-orange-400 text-white text-xs font-bold rounded-full">
                    Le plus populaire
                  </div>
                )}
                <div className={`text-sm font-medium mb-2 ${plan.highlight ? 'text-blue-200' : 'text-gray-500'}`}>{plan.name}</div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className={`text-3xl font-bold ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>{plan.price}</span>
                  <span className={`text-sm ${plan.highlight ? 'text-blue-200' : 'text-gray-400'}`}>{plan.period}</span>
                </div>
                <p className={`text-sm mb-6 ${plan.highlight ? 'text-blue-200' : 'text-gray-500'}`}>{plan.desc}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className={`flex items-center gap-2 text-sm ${plan.highlight ? 'text-white' : 'text-gray-700'}`}>
                      <CheckCircle className={`w-4 h-4 shrink-0 ${plan.highlight ? 'text-blue-300' : 'text-blue-500'}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/register" className={`block w-full py-3 rounded-xl font-semibold text-center text-sm transition-colors ${plan.highlight ? 'bg-white text-blue-600 hover:bg-blue-50' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust ─────────────────────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { icon: Shield, color: 'text-blue-500', title: 'RGPD & HDS', desc: 'Conforme aux réglementations de santé européennes' },
              { icon: Lock, color: 'text-green-500', title: 'Chiffrement AES-256', desc: 'Toutes les données patients chiffrées' },
              { icon: Star, color: 'text-yellow-500', title: '4.8/5', desc: 'Note moyenne par nos praticiens' },
              { icon: Smartphone, color: 'text-purple-500', title: 'iOS & Android', desc: 'Application mobile disponible' },
            ].map((t, i) => (
              <div key={i} className="flex flex-col items-center">
                <t.icon className={`w-10 h-10 ${t.color} mb-3`} />
                <h3 className="font-semibold text-gray-900 mb-1 text-sm">{t.title}</h3>
                <p className="text-xs text-gray-500">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Prêt à moderniser votre cabinet ?</h2>
          <p className="text-blue-100 text-lg mb-8">Rejoignez Ibogha Pro — gratuit pendant 30 jours, sans engagement.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register" className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
              Commencer gratuitement
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/auth/login" className="px-8 py-4 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-400 transition-colors border-2 border-white/20 flex items-center justify-center">
              J'ai déjà un compte
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 py-14">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Stethoscope className="w-4 h-4 text-white" />
                </div>
                <span className="text-white text-lg font-bold">Ibogha Pro</span>
              </div>
              <p className="text-sm leading-relaxed">La plateforme qui simplifie l'exercice médical et améliore la relation patient-médecin.</p>
              <div className="mt-4">
                <Link href="https://patient.ibogha.elowe.fr" className="text-blue-400 text-sm hover:text-blue-300">
                  Espace patient →
                </Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Fonctionnalités</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/planning" className="hover:text-white transition-colors">Planning</Link></li>
                <li><Link href="/teleconsultation" className="hover:text-white transition-colors">Téléconsultation</Link></li>
                <li><Link href="/patients" className="hover:text-white transition-colors">Patients</Link></li>
                <li><Link href="/wallet" className="hover:text-white transition-colors">Portefeuille</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Informations</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">À propos</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">FAQ</Link></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Tarifs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Légal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">Mentions légales</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Confidentialité</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">CGU</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Cookies</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
            <p>&copy; 2026 Ibogha. Tous droits réservés.</p>
            <p className="text-slate-600">Plateforme médicale certifiée RGPD</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
