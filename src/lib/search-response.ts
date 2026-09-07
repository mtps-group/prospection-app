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
      business_name: 'Entreprise masquée',
      formatted_address: '*** Adresse masquée ***',
      phone_national: '** ** ** ** **',
      phone_international: null,
      google_maps_uri: null,
      // Sans ces champs, une ligne masquée ne permet plus de retrouver
      // l'entreprise via /api/place-details ou ses coordonnées GPS.
      google_place_id: '',
      latitude: null,
      longitude: null,
      social_profiles: null,
      ...(options.maskWebsite ? { website_url: null } : {}),
      rating: r.rating,
      user_rating_count: null,
      is_blurred: true,
    };
  });
}
