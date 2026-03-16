'use client';

import { useState } from 'react';
import { BusinessCard } from './BusinessCard';
import { BusinessDetailPanel } from './BusinessDetailPanel';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { fr } from '@/i18n/fr';
import type { SearchResponse } from '@/types';
import { useSupabase } from '@/providers/SupabaseProvider';
import Link from 'next/link';
import {
  Download,
  FileSpreadsheet,
  BookOpen,
  AlertCircle,
  Crown,
} from 'lucide-react';

interface SearchResultsProps {
  data: SearchResponse;
  onExportCSV?: () => void;
}

export function SearchResults({ data, onExportCSV }: SearchResultsProps) {
  const { profile } = useSupabase();
  const isPaid = profile?.plan === 'premium' || profile?.plan === 'ultra';
  const isUltra = profile?.plan === 'ultra';

  const [detailPanel, setDetailPanel] = useState<{
    placeId: string;
    businessName: string;
    city?: string;
  } | null>(null);

  const handleViewDetail = (placeId: string, businessName: string, city?: string) => {
    setDetailPanel({ placeId, businessName, city });
  };

  if (data.results.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-text-muted mb-4" />
        <h3 className="text-lg font-semibold text-text mb-1">
          {fr.results.aucunResultat}
        </h3>
        <p className="text-sm text-text-secondary max-w-md mx-auto">
          {fr.results.aucunResultatDescription}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Badge variant="primary" className="text-sm px-3 py-1">
            {data.noWebsiteCount} {fr.results.entreprisesTrouvees}
          </Badge>
          <span className="text-sm text-text-muted">
            {fr.results.surTotal} {data.totalFound} {fr.results.entreprises}
          </span>
        </div>

        {isPaid && (
          <div className="flex items-center gap-2">
            {onExportCSV && (
              <Button variant="outline" size="sm" onClick={onExportCSV}>
                <Download className="h-4 w-4" />
                CSV
              </Button>
            )}
            <Button variant="outline" size="sm" disabled>
              <FileSpreadsheet className="h-4 w-4" />
              Google Sheets
            </Button>
            <Button variant="outline" size="sm" disabled>
              <BookOpen className="h-4 w-4" />
              Notion
            </Button>
          </div>
        )}
      </div>

      {/* Results grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.results.map((result) => (
          <BusinessCard
            key={result.id}
            result={result}
            isUltra={isUltra}
            onViewDetail={handleViewDetail}
          />
        ))}

      </div>

      {/* Detail panel */}
      {detailPanel && (
        <BusinessDetailPanel
          placeId={detailPanel.placeId}
          businessName={detailPanel.businessName}
          city={detailPanel.city}
          onClose={() => setDetailPanel(null)}
        />
      )}

      {/* Upgrade CTA for blurred results */}
      {data.blurredCount > 0 && (
        <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary-light/30 p-6 text-center">
          <Crown className="mx-auto h-10 w-10 text-primary mb-3" />
          <h3 className="text-lg font-bold text-text mb-1">
            +{data.blurredCount} {fr.blur.resultatsFlous}
          </h3>
          <p className="text-sm text-text-secondary mb-4 max-w-md mx-auto">
            {fr.blur.description}
          </p>
          <Link href="/abonnement">
            <Button size="lg" className="animate-pulse-glow">
              <Crown className="h-4 w-4" />
              {fr.blur.cta}
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
