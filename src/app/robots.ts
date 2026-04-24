import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/signup', '/login'],
        disallow: [
          '/api/',
          '/recherche',
          '/historique',
          '/exports',
          '/parametres',
          '/abonnement',
          '/resultats',
          '/compte',
          '/appels',
          '/prospects',
        ],
      },
    ],
    sitemap: 'https://prospectweb.fr/sitemap.xml',
  };
}
