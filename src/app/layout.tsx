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
    default: 'ProspectWeb — Trouvez des entreprises sans site web',
    template: '%s | ProspectWeb',
  },
  description:
    'ProspectWeb est l\'outil de prospection n°1 pour les créateurs de sites web et agences web. Trouvez instantanément les entreprises sans site internet près de chez vous et décrochez de nouveaux clients.',
  keywords: [
    'prospection créateur site web',
    'trouver entreprises sans site web',
    'outil prospection agence web',
    'logiciel prospection freelance web',
    'entreprises sans présence en ligne',
    'trouver clients freelance web',
    'lead generation site web',
    'prospection automatique',
    'Google Maps entreprises',
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
    title: 'ProspectWeb — Trouvez des entreprises sans site web',
    description: 'L\'outil de prospection n°1 pour les créateurs de sites web. Trouvez instantanément les entreprises sans site internet et décrochez de nouveaux clients.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ProspectWeb — Trouvez des entreprises sans site web',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@prospectweb',
    title: 'ProspectWeb — Trouvez des entreprises sans site web',
    description: 'L\'outil de prospection n°1 pour les créateurs de sites web.',
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
  description: 'Outil de prospection automatique pour créateurs de sites web et agences web. Trouvez les entreprises sans site internet par ville et secteur d\'activité.',
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
