export default function ConditionsUtilisation() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Conditions générales d&apos;utilisation</h1>
          <p className="text-slate-500 text-sm">Version 1.0 — en vigueur depuis mai 2026 · Réservé aux professionnels de santé</p>
        </div>

        <div className="bg-teal-50 border border-teal-200 rounded-xl p-5 text-sm text-teal-800">
          En accédant à l&apos;espace professionnel Ibogha Health, vous confirmez votre qualité de professionnel de santé agréé
          et acceptez les présentes conditions spécifiques aux praticiens.
        </div>

        {[
          {
            title: '1. Accès à l\'espace professionnel',
            content: `L'espace professionnel Ibogha Health est exclusivement réservé aux professionnels de santé légalement autorisés à exercer sur le territoire gabonais (médecins, spécialistes, pharmaciens, établissements de santé).

L'inscription nécessite la fourniture de votre numéro d'identification professionnelle. Ibogha Health se réserve le droit de vérifier votre accréditation auprès des autorités compétentes (Ordre des Médecins du Gabon).`,
          },
          {
            title: '2. Obligations du professionnel',
            content: `En tant que professionnel inscrit, vous vous engagez à :
• Exercer dans le strict respect des règles déontologiques de votre profession
• Maintenir vos informations de profil à jour (spécialité, tarifs, disponibilités)
• Honorer les rendez-vous confirmés ou annuler dans un délai raisonnable
• Traiter les données patients avec la plus grande confidentialité
• Ne pas utiliser la plateforme à des fins contraires à l'éthique médicale
• Informer Ibogha Health de tout changement de situation professionnelle (suspension, radiation)`,
          },
          {
            title: '3. Données patients',
            content: `En tant que professionnel de santé, vous avez accès aux données médicales de vos patients dans le cadre strict de la relation de soins. Vous êtes responsable du traitement de ces données conformément au secret médical et à la Loi N° 025/2023.

Les données patients ne peuvent être utilisées qu'à des fins thérapeutiques. Tout accès non justifié aux dossiers patients constitue une violation des présentes CGU et du secret médical.`,
          },
          {
            title: '4. Tarifs et paiements',
            content: `Vous êtes libre de fixer vos tarifs de consultation. Ibogha Health prélève une commission sur les paiements effectués via la plateforme, dont le taux vous est communiqué lors de votre inscription.

Les paiements sont versés sur votre portefeuille Ibogha Health selon les délais convenus. Des justificatifs de paiement sont disponibles dans votre espace administratif.`,
          },
          {
            title: '5. Téléconsultation',
            content: `L'utilisation de la fonctionnalité de téléconsultation est soumise au respect des recommandations des autorités sanitaires gabonaises sur la pratique de la médecine à distance.

Vous êtes responsable de la qualité de la connexion et de l'environnement lors des téléconsultations. Ibogha Health fournit l'infrastructure technique mais ne peut garantir la qualité du réseau tiers.`,
          },
          {
            title: '6. Responsabilité médicale',
            content: `Ibogha Health est un outil facilitant la mise en relation entre patients et professionnels. La responsabilité médicale reste entièrement celle du praticien.

Ibogha Health ne saurait être tenu responsable des actes médicaux réalisés via sa plateforme. Votre couverture en responsabilité civile professionnelle doit rester à jour.`,
          },
          {
            title: '7. Suspension et résiliation',
            content: `Ibogha Health peut suspendre ou résilier votre accès en cas de :
• Violation des présentes CGU ou des règles déontologiques
• Suspension ou radiation par l'Ordre des Médecins
• Comportement préjudiciable aux patients ou à la plateforme
• Non-paiement des commissions dues

En cas de résiliation, vos données sont conservées conformément aux obligations légales.`,
          },
          {
            title: '8. Propriété des données',
            content: `Les données médicales générées via Ibogha Health appartiennent aux patients. En tant que praticien, vous bénéficiez d'un droit d'accès dans le cadre de la relation de soins.

Vous conservez la propriété de vos ordonnances, comptes-rendus et notes médicales. Ibogha Health en assure le stockage sécurisé.`,
          },
          {
            title: '9. Droit applicable',
            content: `Les présentes CGU sont soumises au droit gabonais. Tout litige relève de la compétence exclusive des tribunaux de Libreville.

Contact : contact@ibogha241.ga`,
          },
        ].map((section) => (
          <div key={section.title} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 mb-2">{section.title}</h2>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{section.content}</p>
          </div>
        ))}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
          <a href="/politique-confidentialite" className="text-teal-600 hover:underline">
            Politique de confidentialité
          </a>
          <span className="text-slate-400 hidden sm:block">·</span>
          <a href="/auth/login" className="text-teal-600 hover:underline">
            ← Retour à la connexion
          </a>
        </div>
      </div>
    </div>
  );
}
