'use client';

import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { fr } from '@/i18n/fr';
import { formatDateTime } from '@/lib/utils';
import type { Search } from '@/types';
import { History, Search as SearchIcon, Globe, Calendar, TrendingUp, ArrowRight, Clock, BarChart3 } from 'lucide-react';
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

  const totalProspects = searches.reduce((acc, s) => acc + (s.no_website_count || 0), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <History className="h-5 w-5 text-white" />
            </div>
            {fr.history.titre}
          </h1>
          <p className="text-text-secondary mt-2">{fr.history.sousTitre}</p>
        </div>
      </div>

      {/* Stats bar */}
      {!loading && searches.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-white border border-gray-100 p-4 text-center">
            <div className="text-2xl font-black text-text">{searches.length}</div>
            <div className="text-xs font-medium text-text-muted mt-0.5">Recherches</div>
          </div>
          <div className="rounded-2xl bg-white border border-gray-100 p-4 text-center">
            <div className="text-2xl font-black text-text">{totalProspects}</div>
            <div className="text-xs font-medium text-text-muted mt-0.5">Prospects trouvés</div>
          </div>
          <div className="rounded-2xl bg-white border border-gray-100 p-4 text-center">
            <div className="text-2xl font-black text-text">
              {searches.length > 0 ? Math.round(totalProspects / searches.length) : 0}
            </div>
            <div className="text-xs font-medium text-text-muted mt-0.5">Moy. / recherche</div>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : searches.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-blue-500/10 flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-indigo-500" />
          </div>
          <h3 className="text-lg font-bold text-text mb-2">
            {fr.history.aucuneRecherche}
          </h3>
          <p className="text-sm text-text-secondary max-w-sm mx-auto mb-6">
            {fr.history.aucuneRechercheDescription}
          </p>
          <Link
            href="/recherche"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-purple-500 px-6 py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
          >
            <SearchIcon className="h-4 w-4" />
            {fr.search.rechercher}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {searches.map((search, index) => (
            <Link
              key={search.id}
              href={`/recherche?businessType=${encodeURIComponent(search.query_business_type)}&city=${encodeURIComponent(search.query_city)}`}
            >
              <div className="group rounded-2xl border border-gray-100 bg-white p-5 hover:shadow-xl hover:border-gray-200 hover:-translate-y-0.5 cursor-pointer transition-all duration-300">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500/10 to-blue-500/10 flex items-center justify-center flex-shrink-0 group-hover:from-indigo-500/20 group-hover:to-blue-500/20 transition-colors">
                      <SearchIcon className="h-5 w-5 text-indigo-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-text truncate capitalize group-hover:text-primary transition-colors">
                        {search.query_business_type} — {search.query_city}
                      </h3>
                      <div className="flex items-center gap-4 mt-1.5 text-sm text-text-secondary">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-text-muted" />
                          {formatDateTime(search.created_at)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <BarChart3 className="h-3.5 w-3.5 text-text-muted" />
                          {search.total_results} résultats
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 px-3 py-1">
                        <Globe className="h-3.5 w-3.5 text-orange-500" />
                        <span className="text-xs font-bold text-orange-700">
                          {search.no_website_count} sans site
                        </span>
                      </div>
                    </div>
                    <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <ArrowRight className="h-4 w-4 text-text-muted group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
