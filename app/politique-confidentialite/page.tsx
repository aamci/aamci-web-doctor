export default function PolitiqueConfidentialite() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Politique de confidentialité</h1>
          <p className="text-slate-500 text-sm">Dernière mise à jour : mai 2026</p>
        </div>

        <div className="bg-teal-50 border border-teal-200 rounded-xl p-5 text-sm text-teal-800">
          <p className="font-semibold mb-1">Base légale</p>
          <p>Loi N° 025/2023 du 9 juillet 2023 modifiant la loi de 2011 sur la protection des données personnelles — République Gabonaise.</p>
          <p className="mt-1">Autorité de contrôle : APDPVP (Autorité pour la Protection des Données Personnelles et de la Vie Privée).</p>
        </div>

        {[
          {
            title: '1. Responsable du traitement',
            content: `Ibogha Health, société de droit gabonais, est responsable du traitement des données personnelles collectées via cette plateforme professionnelle de santé.`,
          },
          {
            title: '2. Données collectées',
            content: `Nous collectons : données d'identification (nom, email, téléphone, RPPS), données professionnelles (spécialité, établissements, tarifs), données patients traitées en tant que sous-traitant, données de facturation et de paiement, et données de connexion.`,
          },
          {
            title: '3. Finalités du traitement',
            content: `Vos données sont traitées pour : la gestion de votre compte professionnel, la gestion des rendez-vous et agendas, la communication sécurisée entre professionnels de santé, la gestion des paiements et du portefeuille, et la conformité réglementaire.`,
          },
          {
            title: '4. Données patients (données sensibles)',
            content: `En tant que professionnel de santé, vous accédez aux données médicales de vos patients. Ces données sont traitées sous votre responsabilité médicale. Ibogha Health agit comme sous-traitant et assure leur chiffrement (AES-256-GCM) et leur sécurité.`,
          },
          {
            title: '5. Durée de conservation',
            content: `Données de profil : durée de l'inscription. Données médicales : 10 ans conformément aux obligations légales. Données de paiement : 5 ans. Données de connexion : 12 mois.`,
          },
          {
            title: '6. Vos droits',
            content: `Conformément à la Loi 025/2023 :\n• Droit d'accès : exporter vos données (Paramètres → Confidentialité)\n• Droit de rectification : modifier votre profil\n• Droit à l'effacement : supprimer votre compte\n• Droit à la portabilité : export JSON de vos données\n• Droit d'opposition : refus de certains traitements`,
          },
          {
            title: '7. Sécurité',
            content: `Chiffrement AES-256-GCM des données sensibles, hachage Argon2 des mots de passe, 2FA TOTP disponible, HTTPS/TLS obligatoire, journalisation des accès aux dossiers patients, hébergement sécurisé.`,
          },
          {
            title: '8. Partage des données',
            content: `Vos données professionnelles ne sont pas vendues. Elles sont partagées avec : vos confrères via les correspondances médicales (avec votre accord), nos prestataires techniques (hébergement), et les autorités sur réquisition légale.`,
          },
          {
            title: '9. Contact',
            content: `Pour exercer vos droits ou toute question : privacy@ibogha.ga ou via le formulaire de support de l'application.`,
          },
        ].map((section) => (
          <div key={section.title} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 mb-2">{section.title}</h2>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{section.content}</p>
          </div>
        ))}

        <div className="text-center">
          <a href="/settings/confidentialite" className="text-teal-600 hover:underline text-sm">
            ← Retour aux paramètres
          </a>
        </div>
      </div>
    </div>
  );
}
