export const ENTREPRISE_PRICE_ID = 'price_1TRYxqHDs8WJU7Ej3gl4bJ9v';

export interface OffrePrivee {
  nomOffre: string;
  prix: number;
  priceId: string;
  features: string[];
}

export const OFFRES_PRIVEES: Record<string, OffrePrivee> = {
  'nettoyage-pro': {
    nomOffre: 'Offre Entreprise',
    prix: 159,
    priceId: ENTREPRISE_PRICE_ID,
    features: [
      'Recherches illimitées',
      'Jusqu\'à 60 prospects par recherche',
      'Coordonnées complètes (téléphone, adresse, site web)',
      'Export Excel, Google Sheets, Notion',
      'Historique illimité et cliquable',
      'Score de priorité des prospects',
      'Mini-CRM intégré (suivi des prospects)',
      'Onglet entreprises avec site web séparé',
      'Support prioritaire',
    ],
  },
};
