export const STRIPE_PLANS = {
  premium: {
    name: 'Premium',
    priceId: 'price_1TRxJSHDs8WJU7Ej4z4HW7bl',
    priceMonthly: 49,
    features: [
      'Recherches illimitees',
      'Jusqu\'a 60 resultats par recherche',
      'Export CSV, Google Sheets, Notion',
      'Historique illimite',
    ],
  },
  ultra: {
    name: 'Ultra',
    priceId: 'price_1TRweJHDs8WJU7EjzlfLQX9W',
    priceMonthly: 79,
    features: [
      'Tout Premium inclus',
      'Fiche entreprise detaillee',
      'Horaires, avis, photos',
      'Generation de brouillons d\'emails (bientot)',
    ],
  },
  agence: {
    name: 'Agence',
    // Créer ce produit dans Stripe Dashboard puis remplacer cet ID
    priceId: process.env.STRIPE_AGENCE_PRICE_ID || 'price_1TRwdHHDs8WJU7Ejol83tg4s',
    priceMonthly: 159,
    features: [
      'Tout Ultra inclus',
      'Analyse IA des appels de prospection',
      'Score appel + score prospect /10',
      'Transcription + résumé complet',
      'Email de suivi généré automatiquement',
    ],
  },
} as const;
