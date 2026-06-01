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
  /** Debug : nombre brut renvoye par l'API avant filtrage */
  rawCount?: number;
  /** Debug : pages trouvees (pour comprendre les faux negatifs) */
  rawPageNames?: string[];
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

async function fetchAds(token: string, searchTerms: string): Promise<{ ok: boolean; ads: RawAd[]; error?: string }> {
  const params = new URLSearchParams({
    access_token: token,
    search_terms: searchTerms,
    ad_reached_countries: 'FR',
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
    if (!response.ok) {
      const text = await response.text();
      console.error('[meta-ads] HTTP error', response.status, text.slice(0, 300));
      return { ok: false, ads: [], error: `HTTP ${response.status}` };
    }
    const data = (await response.json()) as ApiResponse;
    if (data.error) {
      console.error('[meta-ads] API error', data.error);
      return { ok: false, ads: [], error: data.error.message };
    }
    return { ok: true, ads: data.data || [] };
  } catch (err) {
    clearTimeout(timeout);
    console.error('[meta-ads] fetch threw', err);
    return { ok: false, ads: [], error: String(err) };
  }
}

export async function checkMetaAds(
  businessName: string,
  city?: string,
): Promise<MetaAdsCheckResult> {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) {
    throw new Error('META_ACCESS_TOKEN manquant dans les env vars Vercel');
  }

  // Strategie : 1ere tentative avec ville (precis), 2eme sans ville (large)
  // car la ville Google Maps != ville affichee sur la page Meta dans plein de cas
  // (ex: business a Mesanger, page Facebook = "... | Ancenis")
  console.log('[meta-ads] check', { businessName, city });
  let attempt = await fetchAds(token, city ? `${businessName} ${city}` : businessName);
  console.log('[meta-ads] attempt1', { count: attempt.ads.length, ok: attempt.ok });

  // Fallback : si la 1ere tentative renvoie 0, on retente sans ville
  if (attempt.ok && attempt.ads.length === 0 && city) {
    attempt = await fetchAds(token, businessName);
    console.log('[meta-ads] attempt2 (no city)', { count: attempt.ads.length, ok: attempt.ok });
  }

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
    rawCount: 0,
    rawPageNames: [],
  };

  if (!attempt.ok) return EMPTY_RESULT;

  try {
    const rawAds = attempt.ads;
    const rawPageNames = Array.from(
      new Set(rawAds.map((a) => a.page_name).filter((n): n is string => !!n)),
    );

    // Filtre tolerant : on tokenize le nom du business et on accepte
    // toute page dont le nom partage au moins un token significatif (>= 4 chars)
    // ou qui matche en substring dans un sens ou l'autre.
    const STOP_WORDS = new Set([
      'le', 'la', 'les', 'l', 'un', 'une', 'des', 'de', 'du', 'd', 'a', 'au', 'aux',
      'et', 'ou', 'mr', 'mme', 'sas', 'sarl', 'eurl', 'sa', 'sci', 'snc',
      'restaurant', 'boulangerie', 'patisserie', 'cafe', 'bar', 'salon', 'garage',
      'pharmacie', 'boucherie', 'coiffeur', 'magasin', 'maison', 'chez',
    ]);
    const tokenize = (s: string) =>
      s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((t) => t.length >= 4 && !STOP_WORDS.has(t));

    const businessTokens = new Set(tokenize(businessName));
    const businessLower = businessName.toLowerCase();

    const matchingAds = rawAds.filter((ad) => {
      if (!ad.page_name) return false;
      const pageLower = ad.page_name.toLowerCase();
      if (pageLower.includes(businessLower) || businessLower.includes(pageLower)) {
        return true;
      }
      const pageTokens = tokenize(ad.page_name);
      return pageTokens.some((t) => businessTokens.has(t));
    });

    if (matchingAds.length === 0) {
      return {
        ...EMPTY_RESULT,
        rawCount: rawAds.length,
        rawPageNames: rawPageNames.slice(0, 10),
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
      rawCount: rawAds.length,
      rawPageNames: rawPageNames.slice(0, 10),
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
      rawCount: 0,
      rawPageNames: [],
    };
  }
}
