'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { SearchForm } from '@/components/search/SearchForm';
import { SearchResults } from '@/components/search/SearchResults';
import { useSupabase } from '@/providers/SupabaseProvider';
import { useToast } from '@/providers/ToastProvider';
import { getPlanConfig } from '@/lib/constants';
import { fr } from '@/i18n/fr';
import type { SearchResponse } from '@/types';
import type { PlanSlug } from '@/lib/constants';
import { Search, Sparkles, ExternalLink, AlertCircle } from 'lucide-react';

function GoogleSheetsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="#23A566"/>
      <path d="M14 2v6h6" fill="#169E53"/>
      <path d="M8 13h8M8 16h8M8 10h3" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

export default function RecherchePage() {
  const [loading, setLoading] = useState(false);
  const [searchData, setSearchData] = useState<SearchResponse | null>(null);
  const [currentQuery, setCurrentQuery] = useState('');
  const { profile, refreshProfile } = useSupabase();
  const { addToast } = useToast();
  const searchParams = useSearchParams();

  const sheetsUrlParam = searchParams.get('sheets_url');
  const exportErrorParam = searchParams.get('export_error');

  const [sheetsUrlFromOAuth, setSheetsUrlFromOAuth] = useState<string | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);

  // Auto-lancer la recherche depuis l'historique
  const businessTypeParam = searchParams.get('businessType');
  const cityParam = searchParams.get('city');

  useEffect(() => {
    if (sheetsUrlParam) {
      setSheetsUrlFromOAuth(decodeURIComponent(sheetsUrlParam));
      window.open(decodeURIComponent(sheetsUrlParam), '_blank');
      window.history.replaceState({}, '', '/recherche');
    }
    if (exportErrorParam) {
      const messages: Record<string, string> = {
        params_missing: 'Paramètres manquants lors de l\'export Google Sheets.',
        expired: 'La session d\'export a expiré. Veuillez réessayer.',
        failed: 'Erreur lors de la création du Google Sheet. Veuillez réessayer.',
      };
      setOauthError(messages[exportErrorParam] || 'Erreur lors de l\'export Google Sheets.');
      window.history.replaceState({}, '', '/recherche');
    }
    if (businessTypeParam && cityParam) {
      handleSearch(businessTypeParam, cityParam);
      window.history.replaceState({}, '', '/recherche');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const plan = getPlanConfig((profile?.plan || 'free') as PlanSlug);
  const searchesRemaining =
    profile?.plan === 'free'
      ? Math.max(0, plan.maxSearchesLifetime - (profile?.total_searches_used || 0))
      : null;

  const handleSearch = async (businessType: string, city: string) => {
    setLoading(true);
    setSearchData(null);
    setCurrentQuery(`${businessType} ${city}`);

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
        `${data.noWebsiteCount} entreprises sans site web trouvées !`,
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

    addToast('Export CSV téléchargé !', 'success');
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

      {/* Google Sheets OAuth success banner */}
      {sheetsUrlFromOAuth && (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          <div className="flex items-center gap-2">
            <GoogleSheetsIcon className="h-5 w-5 flex-shrink-0" />
            <span>Votre Google Sheet a été créé avec succès !</span>
          </div>
          <a
            href={sheetsUrlFromOAuth}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 font-semibold underline whitespace-nowrap hover:text-green-900"
          >
            Ouvrir le Sheet <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}

      {/* Google Sheets OAuth error banner */}
      {oauthError && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{oauthError}</span>
        </div>
      )}

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
              Vous avez utilisé toutes vos recherches gratuites.{' '}
              <a href="/abonnement" className="font-semibold underline">
                Passer à Premium
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
          initialBusinessType={businessTypeParam || ''}
          initialCity={cityParam || ''}
        />
      </Card>

      {/* Results */}
      {searchData && (
        <SearchResults
          data={searchData}
          query={currentQuery}
          onExportCSV={handleExportCSV}
        />
      )}
    </div>
  );
}
