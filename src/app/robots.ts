import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://prospectweb.fr';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/pricing'],
        disallow: ['/api/', '/recherche', '/historique', '/exports', '/parametres', '/abonnement', '/resultats'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
