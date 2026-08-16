export default function PolitiqueConfidentialite() {
  const sections = [
    {
      title: '1. Responsable du traitement',
      content: `La plateforme Ibogha est éditée et exploitée par Ibogha SAS, responsable du traitement de vos données personnelles au sens du Règlement Général sur la Protection des Données (RGPD — Règlement UE 2016/679).

La présente politique s'applique à l'ensemble des applications et services Ibogha : portail web patient, portail web professionnel, application mobile patient et application mobile professionnelle (iOS & Android).`,
    },
    {
      title: '2. Données collectées',
      content: `Nous collectons les données suivantes selon votre utilisation du service :

• Identité : nom, prénom, date de naissance, photo de profil
• Contact : adresse e-mail, numéro de téléphone
• Données médicales : notes médicales, ordonnances, dossiers de santé, antécédents (chiffrées au repos)
• Rendez-vous : historique de consultations, créneaux réservés
• Paiements : historique des transactions (sans stockage des numéros de carte)
• Navigation : adresse IP, type d'appareil, logs de connexion`,
    },
    {
      title: '3. Finalités du traitement',
      content: `Vos données sont traitées pour les finalités suivantes :

• Fourniture du service : gestion de votre compte, prise de rendez-vous, téléconsultation
• Suivi médical : transmission des informations de santé entre patient et praticien
• Paiements : traitement des honoraires via Stripe et Airtel Money
• Sécurité : prévention des fraudes, journalisation des accès
• Amélioration du service : statistiques d'usage anonymisées
• Obligations légales : conservation des documents médicaux`,
    },
    {
      title: '4. Base légale',
      content: `Les traitements reposent sur :

• Exécution du contrat — pour la fourniture du service (compte, rendez-vous, paiements)
• Consentement explicite — pour le traitement des données de santé (article 9 RGPD)
• Intérêt légitime — pour la sécurité de la plateforme et la prévention des fraudes
• Obligation légale — pour la conservation des dossiers médicaux selon le Code de la santé publique`,
    },
    {
      title: '5. Durée de conservation',
      content: `• Données de compte : durée d'activité du compte + 3 ans
• Dossiers médicaux : 20 ans à compter du dernier acte (obligation légale)
• Données de paiement : 5 ans (obligation comptable)
• Logs de connexion : 12 mois
• Données anonymisées : durée illimitée`,
    },
    {
      title: '6. Partage des données',
      content: `Vos données ne sont jamais vendues à des tiers. Elles peuvent être partagées uniquement avec :

• Professionnels de santé : votre médecin ou praticien consulté via la plateforme accède aux informations nécessaires à votre prise en charge
• Prestataires techniques : hébergement sécurisé, traitement des paiements (Stripe, Airtel Money), envoi d'e-mails. Ces prestataires agissent en tant que sous-traitants et sont contractuellement tenus de protéger vos données
• Autorités compétentes : uniquement en cas d'obligation légale ou judiciaire

Les données médicales sont hébergées sur des serveurs conformes aux exigences HDS (Hébergeur de Données de Santé).`,
    },
    {
      title: '7. Sécurité des données',
      content: `Ibogha met en œuvre les mesures suivantes pour protéger vos données :

• Chiffrement en transit : toutes les communications via TLS 1.2+ (HTTPS)
• Chiffrement au repos : données médicales chiffrées avec AES-256-GCM
• Authentification sécurisée : mots de passe hachés avec Argon2, tokens JWT, authentification à deux facteurs (2FA) disponible
• Contrôle d'accès : strictement limité selon le rôle de l'utilisateur`,
    },
    {
      title: '8. Vos droits (RGPD)',
      content: `Conformément au RGPD, vous disposez des droits suivants :

• Accès : obtenir une copie de toutes les données vous concernant
• Rectification : corriger des données inexactes ou incomplètes
• Effacement : demander la suppression, sous réserve des obligations légales
• Limitation : restreindre le traitement dans certains cas
• Portabilité : recevoir vos données dans un format structuré
• Opposition : vous opposer au traitement fondé sur l'intérêt légitime

Pour exercer ces droits, contactez-nous à privacy@ibogha241.ga. Vous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr).`,
    },
    {
      title: '9. Cookies',
      content: `La plateforme web utilise uniquement des cookies strictement nécessaires au fonctionnement du service (session, préférences). Aucun cookie publicitaire ou de tracking tiers n'est déposé.

Les applications mobiles n'utilisent pas de cookies. L'authentification est gérée par token JWT stocké de façon sécurisée sur l'appareil.`,
    },
    {
      title: '10. Mineurs',
      content: `La plateforme Ibogha est destinée aux personnes majeures. Les mineurs peuvent être pris en charge via le compte d'un représentant légal. Si vous constatez qu'un mineur a créé un compte directement, contactez-nous pour procéder à sa suppression.`,
    },
    {
      title: '11. Modifications',
      content: `Cette politique peut être mise à jour pour refléter des évolutions légales ou fonctionnelles. En cas de modification substantielle, vous serez informé par e-mail ou notification dans l'application au moins 30 jours avant l'entrée en vigueur des changements.`,
    },
    {
      title: '12. Contact',
      content: `Pour toute question relative à vos données personnelles :

E-mail : privacy@ibogha241.ga
Objet : Demande RGPD — [votre nom]

Nous répondons dans un délai d'un mois à compter de la réception de votre demande.`,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Politique de confidentialité</h1>
          <p className="text-slate-400 text-sm">Dernière mise à jour : août 2026</p>
        </div>

        <div className="bg-teal-900/30 border border-teal-500/30 rounded-xl p-5 text-sm text-teal-300">
          Ibogha collecte uniquement les données nécessaires à la mise en relation entre patients et
          professionnels de santé. Vos données médicales sont chiffrées et ne sont jamais revendues à des tiers.
        </div>

        {sections.map((section) => (
          <div key={section.title} className="space-y-3">
            <h2 className="text-xl font-semibold text-white">{section.title}</h2>
            <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
              {section.content}
            </div>
          </div>
        ))}

        <div className="border-t border-slate-700 pt-6 text-slate-500 text-xs">
          © 2026 Ibogha SAS — Tous droits réservés
        </div>
      </div>
    </div>
  );
}
