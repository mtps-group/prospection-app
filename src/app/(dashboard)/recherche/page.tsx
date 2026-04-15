'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { SearchForm } from '@/components/search/SearchForm';
import { SearchResults } from '@/components/search/SearchResults';
import { useSupabase } from '@/providers/SupabaseProvider';
import { useToast } from '@/providers/ToastProvider';
import { getPlanConfig } from '@/lib/constants';
import { fr } from '@/i18n/fr';
import type { SearchResponse } from '@/types';
import type { PlanSlug } from '@/lib/constants';
import { Search, Sparkles, ExternalLink, AlertCircle, Zap, ArrowRight, TrendingUp } from 'lucide-react';
import * as XLSX from 'xlsx';
import Link from 'next/link';

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
      refreshProfile(); // fire and forget, ne bloque pas le loading
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

    const allVisible = [
      ...searchData.results.filter((r) => !r.is_blurred),
      ...(searchData.withWebsiteResults ?? []).filter((r) => !r.is_blurred),
    ];

    if (allVisible.length === 0) {
      addToast('Aucun résultat à exporter', 'error');
      return;
    }

    // ── Données ──────────────────────────────────────────────
    const rows = allVisible.map((r, i) => ({
      '#': i + 1,
      'Nom de l\'établissement': r.business_name,
      'Catégorie': r.business_type || '',
      'A un site web': r.has_website ? 'Oui' : 'Non',
      'Site web': r.website_url || '',
      'Téléphone': r.phone_national || '',
      'Adresse complète': r.formatted_address || '',
      'Note Google': r.rating ?? '',
      'Nombre d\'avis': r.user_rating_count ?? '',
      'Google Maps': r.google_maps_uri || '',
      'Date d\'export': new Date().toLocaleDateString('fr-FR'),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);

    // ── Largeurs de colonnes ──────────────────────────────────
    ws['!cols'] = [
      { wch: 4 },   // #
      { wch: 35 },  // Nom
      { wch: 22 },  // Catégorie
      { wch: 14 },  // A un site web
      { wch: 30 },  // Site web
      { wch: 16 },  // Téléphone
      { wch: 40 },  // Adresse
      { wch: 12 },  // Note
      { wch: 14 },  // Nb avis
      { wch: 40 },  // Google Maps
      { wch: 14 },  // Date
    ];

    // ── Style en-têtes (ligne 1) ──────────────────────────────
    const headerStyle = {
      font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
      fill: { fgColor: { rgb: '4F46E5' } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: false },
      border: {
        bottom: { style: 'medium', color: { rgb: '3730A3' } },
      },
    };

    const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1');
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddr = XLSX.utils.encode_cell({ r: 0, c: col });
      if (ws[cellAddr]) ws[cellAddr].s = headerStyle;
    }

    // ── Style lignes de données (alternées) ──────────────────
    for (let row = 1; row <= range.e.r; row++) {
      const isEven = row % 2 === 0;
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddr = XLSX.utils.encode_cell({ r: row, c: col });
        if (!ws[cellAddr]) continue;

        // Colonne "A un site web" → couleur rouge/vert
        if (col === 3) {
          const val = ws[cellAddr].v;
          ws[cellAddr].s = {
            font: { bold: true, color: { rgb: val === 'Non' ? 'DC2626' : '16A34A' } },
            fill: { fgColor: { rgb: isEven ? 'F8F7FF' : 'FFFFFF' } },
            alignment: { horizontal: 'center' },
          };
        } else {
          ws[cellAddr].s = {
            fill: { fgColor: { rgb: isEven ? 'F8F7FF' : 'FFFFFF' } },
            alignment: { horizontal: col === 0 ? 'center' : 'left', vertical: 'center' },
          };
        }
      }
    }

    // ── Figer la ligne d'en-tête ──────────────────────────────
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };

    // ── Hauteur de ligne d'en-tête ────────────────────────────
    ws['!rows'] = [{ hpt: 22 }];

    // ── Workbook ─────────────────────────────────────────────
    const wb = XLSX.utils.book_new();
    const date = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
    const sheetName = `Prospects ${date}`;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // ── Métadonnées ───────────────────────────────────────────
    wb.Props = {
      Title: 'Liste de prospects – ProspectWeb',
      Author: 'ProspectWeb',
      CreatedDate: new Date(),
    };

    const fileName = `prospects-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);

    addToast(`${allVisible.length} prospects exportés en Excel !`, 'success');
  };

  const isLimitReached =
    profile?.plan === 'free' &&
    (profile?.total_searches_used || 0) >= plan.maxSearchesLifetime;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-lg shadow-primary/20">
              <Search className="h-5 w-5 text-white" />
            </div>
            {fr.search.titre}
          </h1>
          <p className="text-text-secondary mt-2">{fr.search.sousTitre}</p>
        </div>
      </div>

      {/* Google Sheets OAuth success banner */}
      {sheetsUrlFromOAuth && (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 px-5 py-4 text-sm text-green-800">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
              <GoogleSheetsIcon className="h-4 w-4" />
            </div>
            <span className="font-medium">Votre Google Sheet a été créé avec succès !</span>
          </div>
          <a
            href={sheetsUrlFromOAuth}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 font-bold text-green-700 hover:text-green-800 whitespace-nowrap bg-white rounded-lg px-3 py-1.5 border border-green-200 hover:border-green-300 transition-colors"
          >
            Ouvrir le Sheet <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      )}

      {/* Google Sheets OAuth error banner */}
      {oauthError && (
        <div className="flex items-center gap-3 rounded-2xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700">
          <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
          <span className="font-medium">{oauthError}</span>
        </div>
      )}

      {/* Search usage indicator for free plan */}
      {searchesRemaining !== null && (
        <div
          className={`flex items-center gap-3 rounded-2xl px-5 py-4 text-sm ${
            isLimitReached
              ? 'bg-gradient-to-r from-red-50 to-orange-50 text-red-700 border border-red-200'
              : 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200'
          }`}
        >
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isLimitReached ? 'bg-red-100' : 'bg-blue-100'
          }`}>
            <Sparkles className={`h-4 w-4 ${isLimitReached ? 'text-red-500' : 'text-blue-500'}`} />
          </div>
          {isLimitReached ? (
            <span>
              Vous avez utilisé toutes vos recherches gratuites.{' '}
              <Link href="/abonnement" className="font-bold underline inline-flex items-center gap-1">
                Passer à Premium <ArrowRight className="h-3 w-3" />
              </Link>
            </span>
          ) : (
            <span>
              <strong>{searchesRemaining}</strong> {fr.billing.recherchesRestantes} (plan gratuit)
            </span>
          )}
        </div>
      )}

      {/* Search form */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <SearchForm
          onSearch={handleSearch}
          loading={loading}
          disabled={isLimitReached}
          initialBusinessType={businessTypeParam || ''}
          initialCity={cityParam || ''}
        />
      </div>

      {/* Quick tips when no results yet */}
      {!searchData && !loading && (
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Search,
              title: 'Recherche intelligente',
              desc: 'Tapez un métier et une ville pour trouver les entreprises sans site web',
              gradient: 'from-blue-500 to-cyan-500',
              bgLight: 'from-blue-50 to-cyan-50',
            },
            {
              icon: TrendingUp,
              title: 'Score de priorité',
              desc: 'Chaque résultat est noté pour vous aider à cibler les meilleurs prospects',
              gradient: 'from-orange-500 to-amber-500',
              bgLight: 'from-orange-50 to-amber-50',
            },
            {
              icon: Zap,
              title: 'Export en 1 clic',
              desc: 'Téléchargez vos résultats en CSV, Google Sheets ou Notion instantanément',
              gradient: 'from-green-500 to-emerald-500',
              bgLight: 'from-green-50 to-emerald-50',
            },
          ].map((tip) => (
            <div key={tip.title} className="group rounded-2xl border border-gray-100 bg-white p-5 hover:shadow-lg hover:border-gray-200 transition-all duration-300">
              <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${tip.gradient} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                <tip.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-bold text-text text-sm mb-1">{tip.title}</h3>
              <p className="text-xs text-text-secondary leading-relaxed">{tip.desc}</p>
            </div>
          ))}
        </div>
      )}

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
