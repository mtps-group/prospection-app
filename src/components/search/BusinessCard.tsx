'use client';

import { Badge } from '@/components/ui/Badge';
import { fr } from '@/i18n/fr';
import type { SearchResultClient } from '@/types';
import {
  Phone,
  MapPin,
  Star,
  Globe,
  Lock,
  ChevronRight,
} from 'lucide-react';

interface BusinessCardProps {
  result: SearchResultClient;
  isUltra?: boolean;
  onViewDetail?: (placeId: string, name: string, city?: string) => void;
}

export function BusinessCard({ result, onViewDetail }: BusinessCardProps) {
  if (result.is_blurred) {
    return (
      <div className="relative rounded-xl border border-border bg-surface p-5 overflow-hidden">
        {/* Blurred overlay */}
        <div className="absolute inset-0 backdrop-blur-md bg-white/60 z-10 flex flex-col items-center justify-center p-4">
          <Lock className="h-8 w-8 text-primary mb-2" />
          <p className="text-sm font-semibold text-text text-center">
            {fr.blur.titre}
          </p>
          <p className="text-xs text-text-secondary text-center mt-1">
            {fr.blur.description}
          </p>
        </div>

        {/* Fake content behind blur */}
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-text">Entreprise Premium</h3>
              <p className="text-sm text-text-muted">Type d&apos;activite</p>
            </div>
            <Badge variant="error">{fr.results.pasDeSiteWeb}</Badge>
          </div>
          <div className="space-y-2 text-sm text-text-secondary">
            <p>12 Rue Exemple, 31000 Ville</p>
            <p>05 XX XX XX XX</p>
          </div>
        </div>
      </div>
    );
  }

  const isClickable = !!onViewDetail && !!result.google_place_id;

  return (
    <div
      className={`rounded-xl border border-border bg-surface p-5 transition-all ${
        isClickable
          ? 'cursor-pointer hover:shadow-md hover:border-primary/40 hover:bg-primary-light/10 active:scale-[0.99]'
          : 'hover:shadow-md'
      }`}
      onClick={isClickable ? () => {
        // Extraire la ville depuis l'adresse formatée
        const city = result.formatted_address?.split(',').slice(-2, -1)[0]?.trim().replace(/^\d{5}\s*/, '') || '';
        onViewDetail(result.google_place_id, result.business_name, city);
      } : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-text truncate">
            {result.business_name}
          </h3>
          {result.business_type && (
            <p className="text-sm text-text-muted mt-0.5">{result.business_type}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant="error">
            <Globe className="h-3 w-3 mr-1" />
            {fr.results.pasDeSiteWeb}
          </Badge>
          {isClickable && (
            <ChevronRight className="h-4 w-4 text-text-muted" />
          )}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {result.formatted_address && (
          <div className="flex items-start gap-2 text-sm text-text-secondary">
            <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5 text-text-muted" />
            <span>{result.formatted_address}</span>
          </div>
        )}

        {result.phone_national && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 flex-shrink-0 text-text-muted" />
            <span
              className="text-primary font-medium"
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `tel:${result.phone_international || result.phone_national}`;
              }}
            >
              {result.phone_national}
            </span>
          </div>
        )}

        {result.rating && (
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Star className="h-4 w-4 flex-shrink-0 text-amber-400 fill-amber-400" />
            <span>
              {result.rating.toFixed(1)}{' '}
              {result.user_rating_count && (
                <span className="text-text-muted">
                  ({result.user_rating_count} {fr.results.avis})
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      {isClickable && (
        <div className="mt-3 pt-3 border-t border-border">
          <button className="w-full text-xs font-medium text-primary flex items-center justify-center gap-1.5 hover:text-primary-hover transition-colors">
            <ChevronRight className="h-3.5 w-3.5" />
            Voir plus d&apos;informations
          </button>
        </div>
      )}
    </div>
  );
}
