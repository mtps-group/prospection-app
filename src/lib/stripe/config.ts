export const STRIPE_PLANS = {
  premium: {
    name: 'Premium',
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID!,
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
    priceId: process.env.STRIPE_ULTRA_PRICE_ID!,
    priceMonthly: 79,
    features: [
      'Tout Premium inclus',
      'Fiche entreprise detaillee',
      'Horaires, avis, photos',
      'Generation de brouillons d\'emails (bientot)',
    ],
  },
} as const;
