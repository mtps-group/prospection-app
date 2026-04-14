export const STRIPE_PLANS = {
  premium: {
    name: 'Premium',
    priceId: 'price_1TAViSHDs8WJU7EjvR0QSe5X',
    priceMonthly: 39.99,
    features: [
      'Recherches illimitees',
      'Jusqu\'a 60 resultats par recherche',
      'Export CSV, Google Sheets, Notion',
      'Historique illimite',
    ],
  },
  ultra: {
    name: 'Ultra',
    priceId: 'price_1TAVlGHDs8WJU7EjO2KSxbOK',
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
    priceId: process.env.STRIPE_AGENCE_PRICE_ID || 'price_AGENCE_TODO',
    priceMonthly: 179,
    features: [
      'Tout Ultra inclus',
      'Analyse IA des appels de prospection',
      'Score appel + score prospect /10',
      'Transcription + résumé complet',
      'Email de suivi généré automatiquement',
    ],
  },
} as const;
