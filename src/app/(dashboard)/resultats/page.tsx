'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { fr } from '@/i18n/fr';
import { Search, ArrowLeft } from 'lucide-react';

export default function ResultatsPage() {
  const searchParams = useSearchParams();
  const searchId = searchParams.get('id');

  // This page can be used to view saved results from history
  // For now, redirect to search page
  return (
    <div className="max-w-6xl mx-auto text-center py-12">
      <Search className="mx-auto h-12 w-12 text-text-muted mb-4" />
      <h2 className="text-xl font-semibold text-text mb-2">
        {searchId
          ? 'Resultats de la recherche'
          : 'Effectuez une recherche'}
      </h2>
      <p className="text-sm text-text-secondary mb-6">
        Utilisez la page de recherche pour trouver des entreprises sans site web
      </p>
      <Link href="/recherche">
        <Button>
          <ArrowLeft className="h-4 w-4" />
          {fr.search.rechercher}
        </Button>
      </Link>
    </div>
  );
}
