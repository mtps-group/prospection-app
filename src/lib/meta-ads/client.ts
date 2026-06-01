/**
 * Client pour la Meta Ad Library API (https://www.facebook.com/ads/library/api)
 * Permet de detecter si une entreprise diffuse activement des annonces Meta
 * (Facebook + Instagram + WhatsApp + Messenger).
 *
 * Auth : App Access Token (META_ACCESS_TOKEN)
 * API : https://graph.facebook.com/v18.0/ads_archive
 */

const API_VERSION = 'v18.0';
const API_BASE = `https://graph.facebook.com/${API_VERSION}/ads_archive`;

export interface MetaAdItem {
  id: string;
  pageName: string | null;
  bodies: string[];
  publisherPlatforms: string[];
  startTime: string | null;
  url: string | null;
}

export interface MetaAdsCheckResult {
  hasEverAdvertised: boolean;
  hasActiveAds: boolean;
  activeCount: number;
  inactiveCount: number;
  totalCount: number;
  pageName: string | null;
  ads: MetaAdItem[];
  platforms: string[];
  /** Date la plus recente d'activite (ISO) */
  latestActivity: string | null;
  /** Date la plus ancienne d'activite (ISO) */
  earliestActivity: string | null;
}

interface RawAd {
  id: string;
  page_name?: string;
  ad_creative_bodies?: string[];
  ad_creative_link_titles?: string[];
  publisher_platforms?: string[];
  ad_delivery_start_time?: string;
  ad_delivery_stop_time?: string;
  ad_snapshot_url?: string;
}

interface ApiResponse {
  data?: RawAd[];
  error?: { message: string; code: number };
}

export async function checkMetaAds(
  businessName: string,
  city?: string,
): Promise<MetaAdsCheckResult> {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) {
    throw new Error('META_ACCESS_TOKEN manquant dans les env vars Vercel');
  }

  // Construire la query : nom + ville pour reduire les faux positifs
  // (ex: 'Boulangerie Dupont Angers' est plus precis que 'Boulangerie Dupont')
  const searchTerms = city ? `${businessName} ${city}` : businessName;

  // ALL = on recupere actives + inactives (historique complet)
  const params = new URLSearchParams({
    access_token: token,
    search_terms: searchTerms,
    ad_reached_countries: '["FR"]',
    ad_active_status: 'ALL',
    ad_type: 'ALL',
    fields: 'id,page_name,ad_creative_bodies,ad_creative_link_titles,publisher_platforms,ad_delivery_start_time,ad_delivery_stop_time,ad_snapshot_url',
    limit: '50',
  });

  const url = `${API_BASE}?${params.toString()}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    const EMPTY_RESULT: MetaAdsCheckResult = {
      hasEverAdvertised: false,
      hasActiveAds: false,
      activeCount: 0,
      inactiveCount: 0,
      totalCount: 0,
      pageName: null,
      ads: [],
      platforms: [],
      latestActivity: null,
      earliestActivity: null,
    };

    if (!response.ok) {
      const text = await response.text();
      console.error('Meta Ads API error:', response.status, text.slice(0, 200));
      return EMPTY_RESULT;
    }

    const data = (await response.json()) as ApiResponse;

    if (data.error) {
      console.error('Meta Ads API error response:', data.error);
      return EMPTY_RESULT;
    }

    const rawAds = data.data || [];

    // Filtre : on garde uniquement les ads dont le page_name match raisonnablement
    // pour eviter les faux positifs (ex: "Boulangerie Dupont" tape large)
    const businessLower = businessName.toLowerCase();
    const matchingAds = rawAds.filter((ad) => {
      if (!ad.page_name) return false;
      const pageLower = ad.page_name.toLowerCase();
      // Match si le page_name contient le nom ou inversement
      return pageLower.includes(businessLower) || businessLower.includes(pageLower.split(' ')[0]);
    });

    if (matchingAds.length === 0) {
      return {
        hasEverAdvertised: false,
        hasActiveAds: false,
        activeCount: 0,
        inactiveCount: 0,
        totalCount: 0,
        pageName: null,
        ads: [],
        platforms: [],
        latestActivity: null,
        earliestActivity: null,
      };
    }

    // Active = pas de date de fin
    const now = Date.now();
    const activeAds = matchingAds.filter((a) => {
      if (!a.ad_delivery_stop_time) return true;
      const stop = new Date(a.ad_delivery_stop_time).getTime();
      return isNaN(stop) || stop > now;
    });
    const inactiveAds = matchingAds.filter((a) => {
      if (!a.ad_delivery_stop_time) return false;
      const stop = new Date(a.ad_delivery_stop_time).getTime();
      return !isNaN(stop) && stop <= now;
    });

    // Plateformes uniques (de toutes les pubs)
    const platforms = new Set<string>();
    for (const ad of matchingAds) {
      for (const p of ad.publisher_platforms || []) {
        platforms.add(p);
      }
    }

    // Dates min/max d'activite
    const dates = matchingAds
      .map((a) => a.ad_delivery_start_time)
      .filter((d): d is string => !!d)
      .map((d) => new Date(d).getTime())
      .filter((t) => !isNaN(t));
    const latestActivity = dates.length ? new Date(Math.max(...dates)).toISOString() : null;
    const earliestActivity = dates.length ? new Date(Math.min(...dates)).toISOString() : null;

    // On retourne en priorite les pubs ACTIVES dans la liste detail
    const orderedAds = [...activeAds, ...inactiveAds];
    const ads: MetaAdItem[] = orderedAds.slice(0, 5).map((ad) => ({
      id: ad.id,
      pageName: ad.page_name || null,
      bodies: ad.ad_creative_bodies || [],
      publisherPlatforms: ad.publisher_platforms || [],
      startTime: ad.ad_delivery_start_time || null,
      url: ad.ad_snapshot_url || null,
    }));

    return {
      hasEverAdvertised: true,
      hasActiveAds: activeAds.length > 0,
      activeCount: activeAds.length,
      inactiveCount: inactiveAds.length,
      totalCount: matchingAds.length,
      pageName: matchingAds[0].page_name || null,
      ads,
      platforms: Array.from(platforms),
      latestActivity,
      earliestActivity,
    };
  } catch (err) {
    console.error('checkMetaAds error:', err);
    return {
      hasEverAdvertised: false,
      hasActiveAds: false,
      activeCount: 0,
      inactiveCount: 0,
      totalCount: 0,
      pageName: null,
      ads: [],
      platforms: [],
      latestActivity: null,
      earliestActivity: null,
    };
  }
}
