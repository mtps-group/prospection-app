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
  AlertCircle,
  Crown,
} from 'lucide-react';

function GoogleSheetsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="#23A566"/>
      <path d="M14 2v6h6" fill="#169E53"/>
      <path d="M8 13h8M8 16h8M8 10h3" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

function NotionIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466l1.823 1.447z" fill="#000"/>
      <path d="M5.19 6.575v13.682c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V5.414c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.16z" fill="#000"/>
      <path d="M18.45 7.415l-3.41.233v5.603l3.41-.233V7.415z" fill="white"/>
      <path d="M6.777 8.209l.047 1.12 2.567-.14v7.696l1.167-.07V9.19l2.567-.14V7.93l-6.348.28z" fill="white"/>
    </svg>
  );
}

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
              <GoogleSheetsIcon className="h-4 w-4" />
              Google Sheets
            </Button>
            <Button variant="outline" size="sm" disabled>
              <NotionIcon className="h-4 w-4" />
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
