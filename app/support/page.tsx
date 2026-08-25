import { Mail, MessageCircle, Clock, ChevronDown, Phone } from 'lucide-react';

export const metadata = {
  title: 'Support — Ibogha241 Pro',
  description: 'Aide et assistance pour les professionnels de santé Ibogha241',
};

const faqs = [
  {
    q: 'Comment configurer mes créneaux de disponibilité ?',
    a: "Accédez à « Planning » → « Règles de disponibilité ». Définissez vos jours et heures de consultation, la durée des créneaux et les types de rendez-vous acceptés.",
  },
  {
    q: 'Comment rédiger et envoyer une ordonnance ?',
    a: "Dans le dossier d'un patient, cliquez sur « Nouvelle ordonnance ». Rédigez l'ordonnance, puis validez. Le patient reçoit une notification et peut y accéder depuis son espace.",
  },
  {
    q: 'Comment demander un virement depuis mon wallet ?',
    a: "Accédez à « Wallet » → « Demander un virement ». Renseignez le montant et votre IBAN. Les virements sont traités sous 2 à 5 jours ouvrés.",
  },
  {
    q: 'Un patient n\'apparaît pas dans ma liste.',
    a: "Un patient apparaît dans votre liste après avoir pris au moins un rendez-vous confirmé avec vous. Vérifiez dans « Rendez-vous » que la réservation est bien confirmée.",
  },
  {
    q: 'Comment lancer une téléconsultation ?',
    a: "Depuis la fiche du rendez-vous, cliquez sur « Démarrer la consultation vidéo » à l'heure prévue. Le patient reçoit une invitation automatique.",
  },
  {
    q: 'Comment ajouter un établissement à mon profil ?',
    a: "Dans « Mon profil » → « Établissements », recherchez et associez votre cabinet ou hôpital. Si l'établissement n'existe pas encore, contactez le support.",
  },
  {
    q: 'Mon compte est bloqué ou non vérifié.',
    a: "La vérification de votre compte professionnel peut prendre 24 à 48h. Vous recevrez un e-mail de confirmation. Pour accélérer le processus, contactez-nous avec une copie de votre diplôme.",
  },
];

export default function SupportProPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-10">

        {/* Header */}
        <div>
          <p className="text-teal-400 text-xs font-semibold tracking-widest uppercase mb-2">IBOGHA241 PRO</p>
          <h1 className="text-3xl font-bold text-white mb-2">Centre d&apos;aide</h1>
          <p className="text-slate-400">Support dédié aux professionnels de santé. Réponse garantie sous 24h.</p>
        </div>

        {/* Contact cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a
            href="mailto:pro@ibogha241.ga"
            className="flex flex-col items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-teal-500/40 transition-colors text-center"
          >
            <div className="w-10 h-10 rounded-full bg-teal-900/30 flex items-center justify-center">
              <Mail className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">E-mail Pro</p>
              <p className="text-slate-500 text-xs mt-0.5">pro@ibogha241.ga</p>
            </div>
          </a>

          <a
            href="https://wa.me/24100000000"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-teal-500/40 transition-colors text-center"
          >
            <div className="w-10 h-10 rounded-full bg-teal-900/30 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">WhatsApp</p>
              <p className="text-slate-500 text-xs mt-0.5">Priorité Pro</p>
            </div>
          </a>

          <div className="flex flex-col items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl p-5 text-center">
            <div className="w-10 h-10 rounded-full bg-teal-900/30 flex items-center justify-center">
              <Clock className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Horaires</p>
              <p className="text-slate-500 text-xs mt-0.5">Lun–Sam · 8h–20h</p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Questions fréquentes</h2>
          <div className="space-y-3">
            {faqs.map((item, i) => (
              <details
                key={i}
                className="group bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"
              >
                <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none">
                  <span className="font-medium text-white text-sm">{item.q}</span>
                  <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-5 pb-4 text-slate-300 text-sm leading-relaxed border-t border-slate-800 pt-3">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Ticket */}
        <div className="bg-teal-900/20 border border-teal-500/30 rounded-xl p-5">
          <p className="text-teal-300 text-sm">
            Problème non résolu ?{' '}
            <a href="/settings?tab=support" className="underline font-medium hover:text-teal-200">
              Ouvrez un ticket de support
            </a>{' '}
            depuis vos paramètres. Notre équipe Pro vous répond en priorité sous 24h.
          </p>
        </div>

        <p className="text-slate-700 text-xs text-center">
          © {new Date().getFullYear()} Ibogha241 — Gabon
        </p>
      </div>
    </div>
  );
}
