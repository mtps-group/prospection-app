'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { fr } from '@/i18n/fr';
import { formatDateTime } from '@/lib/utils';
import type { Search } from '@/types';
import { History, Search as SearchIcon, Globe, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function HistoriquePage() {
  const [searches, setSearches] = useState<Search[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const response = await fetch('/api/history');
        const data = await response.json();
        setSearches(data.searches || []);
      } catch {
        console.error('Failed to fetch history');
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text flex items-center gap-2">
          <History className="h-6 w-6 text-primary" />
          {fr.history.titre}
        </h1>
        <p className="text-text-secondary mt-1">{fr.history.sousTitre}</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : searches.length === 0 ? (
        <Card className="text-center py-12">
          <SearchIcon className="mx-auto h-12 w-12 text-text-muted mb-4" />
          <h3 className="text-lg font-semibold text-text mb-1">
            {fr.history.aucuneRecherche}
          </h3>
          <p className="text-sm text-text-secondary max-w-md mx-auto mb-4">
            {fr.history.aucuneRechercheDescription}
          </p>
          <Link
            href="/recherche"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover transition-colors"
          >
            <SearchIcon className="h-4 w-4" />
            {fr.search.rechercher}
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {searches.map((search) => (
            <Link
              key={search.id}
              href={`/recherche?businessType=${encodeURIComponent(search.query_business_type)}&city=${encodeURIComponent(search.query_city)}`}
            >
              <Card className="hover:shadow-md hover:border-primary/40 cursor-pointer transition-all active:scale-[0.99]">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-text truncate capitalize">
                      {search.query_business_type} - {search.query_city}
                    </h3>
                    <div className="flex items-center gap-3 mt-1.5 text-sm text-text-secondary">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDateTime(search.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Globe className="h-3.5 w-3.5" />
                        {search.no_website_count} {fr.history.sansWebsite}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="primary">
                      {search.no_website_count}/{search.total_results}
                    </Badge>
                    <SearchIcon className="h-4 w-4 text-text-muted" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
