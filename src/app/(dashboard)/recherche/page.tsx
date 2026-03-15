'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { SearchForm } from '@/components/search/SearchForm';
import { SearchResults } from '@/components/search/SearchResults';
import { useSupabase } from '@/providers/SupabaseProvider';
import { useToast } from '@/providers/ToastProvider';
import { getPlanConfig } from '@/lib/constants';
import { fr } from '@/i18n/fr';
import type { SearchResponse } from '@/types';
import type { PlanSlug } from '@/lib/constants';
import { Search, Sparkles } from 'lucide-react';

export default function RecherchePage() {
  const [loading, setLoading] = useState(false);
  const [searchData, setSearchData] = useState<SearchResponse | null>(null);
  const { profile, refreshProfile } = useSupabase();
  const { addToast } = useToast();

  const plan = getPlanConfig((profile?.plan || 'free') as PlanSlug);
  const searchesRemaining =
    profile?.plan === 'free'
      ? Math.max(0, plan.maxSearchesLifetime - (profile?.total_searches_used || 0))
      : null;

  const handleSearch = async (businessType: string, city: string) => {
    setLoading(true);
    setSearchData(null);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessType, city }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.upgradeRequired) {
          addToast(data.message, 'error');
        } else {
          addToast(data.error || 'Erreur lors de la recherche', 'error');
        }
        setLoading(false);
        return;
      }

      setSearchData(data);
      await refreshProfile();
      addToast(
        `${data.noWebsiteCount} entreprises sans site web trouvees !`,
        'success'
      );
    } catch {
      addToast('Erreur de connexion au serveur', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!searchData) return;

    const visibleResults = searchData.results.filter((r) => !r.is_blurred);
    const headers = ['Nom', 'Type', 'Adresse', 'Telephone', 'Google Maps', 'Note'];
    const rows = visibleResults.map((r) => [
      r.business_name,
      r.business_type || '',
      r.formatted_address || '',
      r.phone_national || '',
      r.google_maps_uri || '',
      r.rating?.toString() || '',
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `prospection-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    addToast('Export CSV telecharge !', 'success');
  };

  const isLimitReached =
    profile?.plan === 'free' &&
    (profile?.total_searches_used || 0) >= plan.maxSearchesLifetime;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text flex items-center gap-2">
          <Search className="h-6 w-6 text-primary" />
          {fr.search.titre}
        </h1>
        <p className="text-text-secondary mt-1">{fr.search.sousTitre}</p>
      </div>

      {/* Search usage indicator for free plan */}
      {searchesRemaining !== null && (
        <div
          className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
            isLimitReached
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-blue-50 text-blue-700 border border-blue-200'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          {isLimitReached ? (
            <span>
              Vous avez utilise toutes vos recherches gratuites.{' '}
              <a href="/abonnement" className="font-semibold underline">
                Passer a Premium
              </a>
            </span>
          ) : (
            <span>
              <strong>{searchesRemaining}</strong> {fr.billing.recherchesRestantes} (plan gratuit)
            </span>
          )}
        </div>
      )}

      {/* Search form */}
      <Card>
        <SearchForm
          onSearch={handleSearch}
          loading={loading}
          disabled={isLimitReached}
        />
      </Card>

      {/* Results */}
      {searchData && (
        <SearchResults
          data={searchData}
          onExportCSV={
            profile?.plan !== 'free' ? handleExportCSV : undefined
          }
        />
      )}
    </div>
  );
}
