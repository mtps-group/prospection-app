export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Politique de confidentialité</h1>
      <p className="text-sm text-gray-500 mb-10">Dernière mise à jour : mars 2025</p>

      <div className="prose prose-gray max-w-none space-y-8 text-gray-700">

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Qui sommes-nous ?</h2>
          <p>
            ProspectWeb est une application SaaS permettant aux créateurs de sites web de trouver
            des entreprises sans site internet. L&apos;application est accessible à l&apos;adresse{' '}
            <a href="https://prospection-saas-fr.vercel.app" className="text-indigo-600 underline">
              https://prospection-saas-fr.vercel.app
            </a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Données collectées</h2>
          <p>Nous collectons les données suivantes :</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Adresse email et nom (lors de l&apos;inscription)</li>
            <li>Données de recherche (types d&apos;entreprises, villes recherchées)</li>
            <li>Données de paiement (gérées par Stripe, nous ne stockons pas vos données bancaires)</li>
            <li>Token d&apos;accès Google Sheets (si vous autorisez l&apos;intégration)</li>
            <li>Token d&apos;intégration Notion (si vous le renseignez manuellement)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Utilisation des données</h2>
          <p>Vos données sont utilisées uniquement pour :</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Fournir le service de recherche de prospects</li>
            <li>Gérer votre compte et votre abonnement</li>
            <li>Exporter vos résultats vers Google Sheets ou Notion si vous en faites la demande</li>
            <li>Améliorer l&apos;application</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Intégration Google Sheets</h2>
          <p>
            Lorsque vous connectez votre compte Google, nous demandons l&apos;accès en lecture/écriture
            à Google Sheets uniquement pour créer des fichiers d&apos;export à votre demande. Nous ne
            lisons ni ne modifions aucun fichier existant dans votre Google Drive. Vous pouvez
            révoquer cet accès à tout moment depuis{' '}
            <a href="https://myaccount.google.com/permissions" className="text-indigo-600 underline" target="_blank" rel="noopener noreferrer">
              myaccount.google.com/permissions
            </a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Partage des données</h2>
          <p>
            Nous ne vendons ni ne partageons vos données personnelles avec des tiers, sauf avec
            nos prestataires techniques nécessaires au fonctionnement du service (Supabase pour
            la base de données, Stripe pour les paiements, Vercel pour l&apos;hébergement).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Conservation des données</h2>
          <p>
            Vos données sont conservées tant que votre compte est actif. Vous pouvez demander
            la suppression de votre compte et de toutes vos données en nous contactant.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Vos droits</h2>
          <p>
            Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification,
            de suppression et de portabilité de vos données. Pour exercer ces droits, contactez-nous.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Contact</h2>
          <p>
            Pour toute question concernant cette politique de confidentialité, contactez-nous à
            l&apos;adresse email disponible sur l&apos;application.
          </p>
        </section>

      </div>
    </div>
  );
}
