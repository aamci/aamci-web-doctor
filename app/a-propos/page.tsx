import { Calendar, Users, BarChart2, FileText, Video, Wallet, Shield, Smartphone, Check, X, Zap, Crown, Star } from 'lucide-react';
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

const plans = [
  {
    key: 'FREE',
    label: 'Gratuit',
    price: 0,
    icon: Star,
    color: 'border-slate-700',
    iconBg: 'bg-slate-800',
    iconColor: 'text-slate-300',
    buttonClass: 'bg-slate-700 hover:bg-slate-600 text-white',
    loginHref: '/auth/login?tab=register&redirect=%2Fabonnement%3Fplan%3DFREE',
    included: [
      '5 rendez-vous / mois',
      '1 type de consultation',
      'Profil public',
      'Application mobile',
    ],
    excluded: [
      'Messagerie patients',
      'Ordonnances',
      'Statistiques',
      'Options avancées',
    ],
  },
  {
    key: 'STARTER',
    label: 'Starter',
    price: 20000,
    icon: Zap,
    color: 'border-blue-500 ring-1 ring-blue-500/30',
    iconBg: 'bg-blue-900/40',
    iconColor: 'text-blue-400',
    badge: 'Populaire',
    buttonClass: 'bg-blue-500 hover:bg-blue-400 text-white',
    loginHref: '/auth/login?tab=register&redirect=%2Fabonnement%3Fplan%3DSTARTER',
    included: [
      '50 rendez-vous / mois',
      '3 types de consultation',
      'Messagerie patients',
      'Ordonnances numériques',
      'Statistiques',
      'Application mobile',
    ],
    excluded: [],
  },
  {
    key: 'PRO',
    label: 'Pro',
    price: 50000,
    icon: Crown,
    color: 'border-violet-500 ring-1 ring-violet-500/30',
    iconBg: 'bg-violet-900/40',
    iconColor: 'text-violet-400',
    buttonClass: 'bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 text-white',
    loginHref: '/auth/login?tab=register&redirect=%2Fabonnement%3Fplan%3DPRO',
    included: [
      'Rendez-vous illimités',
      'Types de consultation illimités',
      'Messagerie patients',
      'Ordonnances numériques',
      'Statistiques avancées',
      'Support prioritaire',
      'Application mobile',
    ],
    excluded: [],
  },
];

const addons = [
  { label: 'Téléconsultation vidéo', price: 15000, desc: 'Consultations vidéo intégrées' },
  { label: 'Gestion d\'équipe', price: 20000, desc: 'Assistants et secrétaires médicaux' },
  { label: 'Priorité recherche', price: 10000, desc: 'En tête des résultats de recherche' },
  { label: 'Correspondances', price: 8000, desc: 'Échanges entre professionnels de santé' },
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
              href={"/auth/login?tab=register&redirect=/abonnement" as never}
              className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-xl transition-colors"
            >
              Rejoindre la plateforme
            </Link>
            <Link
              href={"/auth/login?redirect=/abonnement" as never}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold rounded-xl border border-slate-700 transition-colors"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-14 px-4 bg-slate-900/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-2">Conçu pour les praticiens</h2>
          <p className="text-slate-500 text-center text-sm mb-10">Tous les outils dont vous avez besoin pour exercer sereinement</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 hover:border-slate-700 transition-colors">
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

      {/* Pricing */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-white mb-3">Tarifs simples et transparents</h2>
            <p className="text-slate-400 max-w-lg mx-auto">Commencez gratuitement, évoluez selon vos besoins. Aucune surprise, aucun engagement.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {plans.map((plan) => {
              const PlanIcon = plan.icon;
              return (
                <div
                  key={plan.key}
                  className={`relative rounded-2xl border bg-slate-900 p-7 flex flex-col gap-5 ${plan.color}`}
                >
                  {plan.badge && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      {plan.badge}
                    </span>
                  )}
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${plan.iconBg}`}>
                      <PlanIcon className={`w-5 h-5 ${plan.iconColor}`} />
                    </div>
                    <div className="font-bold text-white">{plan.label}</div>
                  </div>

                  <div>
                    <div className="text-3xl font-extrabold text-white">
                      {plan.price === 0 ? 'Gratuit' : `${plan.price.toLocaleString('fr-FR')} FCFA`}
                    </div>
                    {plan.price > 0 && <div className="text-xs text-slate-500 mt-0.5">par mois · sans engagement</div>}
                  </div>

                  <ul className="flex flex-col gap-2 flex-1">
                    {plan.included.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                        <Check className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                    {plan.excluded.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                        <X className="w-4 h-4 mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={plan.loginHref as never}
                    className={`text-center py-2.5 rounded-xl text-sm font-semibold transition-all ${plan.buttonClass}`}
                  >
                    {plan.price === 0 ? 'Démarrer gratuitement' : `Choisir ${plan.label}`}
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Add-ons */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-7">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h3 className="font-bold text-white">Options complémentaires</h3>
                <p className="text-slate-500 text-sm mt-0.5">Disponibles avec Starter ou Pro</p>
              </div>
              <span className="text-xs text-slate-600 border border-slate-700 rounded-lg px-3 py-1.5">Ajoutables à tout moment</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {addons.map(a => (
                <div key={a.label} className="flex items-center justify-between gap-4 py-3 border-b border-slate-800/60 last:border-0">
                  <div>
                    <div className="text-sm font-medium text-slate-200">{a.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{a.desc}</div>
                  </div>
                  <div className="text-sm font-semibold text-teal-400 shrink-0">+{a.price.toLocaleString('fr-FR')} FCFA/mois</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 px-4">
        <div className="max-w-2xl mx-auto text-center bg-teal-900/20 border border-teal-500/30 rounded-2xl p-8 space-y-4">
          <h2 className="text-2xl font-bold text-white">Rejoignez Ibogha241 Pro</h2>
          <p className="text-slate-400">Inscription gratuite. Votre cabinet numérique opérationnel en moins de 10 minutes.</p>
          <Link
            href={"/auth/login?tab=register&redirect=/abonnement" as never}
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
            <Link href={"/politique-confidentialite" as never} className="hover:text-slate-400 transition-colors">Confidentialité</Link>
            <Link href={"/conditions-utilisation" as never} className="hover:text-slate-400 transition-colors">CGU</Link>
            <Link href={"/support" as never} className="hover:text-slate-400 transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
