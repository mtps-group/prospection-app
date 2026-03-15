import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SupabaseProvider } from '@/providers/SupabaseProvider';
import { ToastProvider } from '@/providers/ToastProvider';

// Force dynamic rendering - Supabase client needs env vars at runtime
export const dynamic = 'force-dynamic';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'ProspectWeb - Trouvez des entreprises sans site web',
    template: '%s | ProspectWeb',
  },
  description:
    'L\'outil de prospection automatique pour les createurs de sites web. Recherchez par type d\'activite et ville, obtenez la liste des entreprises sans presence en ligne.',
  keywords: ['prospection', 'site web', 'entreprises', 'createur de site', 'Google Maps', 'lead generation', 'freelance'],
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'ProspectWeb',
    title: 'ProspectWeb - Trouvez des entreprises sans site web',
    description: 'L\'outil de prospection automatique pour les createurs de sites web.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ProspectWeb - Trouvez des entreprises sans site web',
    description: 'L\'outil de prospection automatique pour les createurs de sites web.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
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
