import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SupabaseProvider } from '@/providers/SupabaseProvider';
import { ToastProvider } from '@/providers/ToastProvider';

// Force dynamic rendering - Supabase client needs env vars at runtime
export const dynamic = 'force-dynamic';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://prospectweb.fr'),
  title: {
    default: 'ProspectWeb — Liste de prospects avec coordonnées en quelques secondes',
    template: '%s | ProspectWeb',
  },
  description:
    'ProspectWeb génère instantanément une liste de prospects qualifiés avec leurs coordonnées complètes (téléphone, adresse, site web). Idéal pour commerciaux, entrepreneurs, freelances et TPE/PME. Essai gratuit.',
  keywords: [
    'outil prospection commerciale',
    'liste de prospects',
    'trouver prospects B2B',
    'logiciel prospection commerciale',
    'trouver clients potentiels',
    'base de données prospects',
    'prospection commerciale automatique',
    'trouver entreprises locales',
    'coordonnées entreprises',
    'prospection B2B France',
    'outil commercial TPE PME',
    'générer des leads',
    'trouver entreprises sans site web',
    'prospection créateur site web',
    'lead generation France',
  ],
  authors: [{ name: 'ProspectWeb', url: 'https://prospectweb.fr' }],
  creator: 'ProspectWeb',
  publisher: 'ProspectWeb',
  alternates: {
    canonical: 'https://prospectweb.fr',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://prospectweb.fr',
    siteName: 'ProspectWeb',
    title: 'ProspectWeb — Liste de prospects avec coordonnées en quelques secondes',
    description: 'Générez instantanément une liste de prospects qualifiés avec leurs coordonnées complètes. Pour commerciaux, entrepreneurs, freelances et agences. Essai gratuit.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ProspectWeb — Générez votre liste de prospects en quelques secondes',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@prospectweb',
    title: 'ProspectWeb — Liste de prospects avec coordonnées en quelques secondes',
    description: 'Générez instantanément une liste de prospects qualifiés avec leurs coordonnées complètes. Essai gratuit.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'nZ9tdvByh1z0kyaSAH8R74mA3RpOopIfn6yy5blW3ms',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'ProspectWeb',
  url: 'https://prospectweb.fr',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: 'ProspectWeb génère en quelques secondes une liste de prospects qualifiés avec leurs coordonnées complètes : nom, téléphone, adresse, site web et note Google. Idéal pour les commerciaux, entrepreneurs, agences et freelances qui veulent trouver de nouveaux clients rapidement.',
  offers: [
    {
      '@type': 'Offer',
      name: 'Gratuit',
      price: '0',
      priceCurrency: 'EUR',
    },
    {
      '@type': 'Offer',
      name: 'Premium',
      price: '39.99',
      priceCurrency: 'EUR',
      billingIncrement: 'P1M',
    },
    {
      '@type': 'Offer',
      name: 'Ultra',
      price: '59.99',
      priceCurrency: 'EUR',
      billingIncrement: 'P1M',
    },
  ],
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: '127',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={inter.className}>
        <SupabaseProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
