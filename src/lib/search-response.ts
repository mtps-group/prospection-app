import type { SearchResult, SearchResultClient } from '@/types';

// Floute les resultats au-dela du quota visible du plan.
// Utilise par /api/search (recherche fraiche) et /api/history/[id] (relecture).
export function blurResults(
  list: SearchResult[],
  visibleCount: number,
  options: { maskWebsite?: boolean } = {}
): SearchResultClient[] {
  return list.map((r, index) => {
    if (index < visibleCount) {
      return { ...r, is_blurred: false };
    }
    return {
      ...r,
      business_name: 'Entreprise masquee',
      formatted_address: '*** Adresse masquee ***',
      phone_national: '** ** ** ** **',
      phone_international: null,
      google_maps_uri: null,
      ...(options.maskWebsite ? { website_url: null } : {}),
      rating: r.rating,
      user_rating_count: null,
      is_blurred: true,
    };
  });
}
