import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { searchSireneWithCity, type SireneResult } from '@/lib/insee/client';
import { extractSocialLinks } from '@/lib/social-scraper';
import type { SearchResultClient, SocialProfiles } from '@/types';

// Alias type pour minimiser les changements dans le reste du fichier
type CompanyResult = SireneResult;

interface SearchRequestBody {
  businessType?: string;
  city?: string;
  creationMaxMonths?: number;
  natureJuridique?: string;
  nameQuery?: string;
}

interface PlaceEnrichment {
  placeId: string | null;
  phone: string | null;
  website: string | null;
  googleMapsUri: string | null;
  rating: number | null;
  userRatingCount: number | null;
  socials: SocialProfiles | null;
}

/**
 * Enrichit une entreprise SIRENE avec les donnees Google Places (telephone, avis, site web)
 * en cherchant "nom + ville" sur Google Places et en prenant le meilleur match.
 */
const EMPTY_ENRICHMENT: PlaceEnrichment = {
  placeId: null, phone: null, website: null, googleMapsUri: null,
  rating: null, userRatingCount: null, socials: null,
};

async function enrichWithGooglePlaces(company: CompanyResult): Promise<PlaceEnrichment> {
  if (!process.env.GOOGLE_PLACES_API_KEY) {
    return EMPTY_ENRICHMENT;
  }

  try {
    const queryParts = [company.name];
    if (company.city) queryParts.push(company.city);
    const query = queryParts.join(' ');

    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.nationalPhoneNumber,places.websiteUri,places.googleMapsUri,places.rating,places.userRatingCount,places.formattedAddress',
      },
      body: JSON.stringify({
        textQuery: query,
        languageCode: 'fr',
        regionCode: 'FR',
      }),
    });

    if (!response.ok) {
      return EMPTY_ENRICHMENT;
    }

    const data = await response.json();
    const places = data.places || [];
    // On prend le premier match (Google trie deja par pertinence)
    const place = places[0];

    if (!place) {
      return EMPTY_ENRICHMENT;
    }

    // Scrape social links si site web present
    let socials: SocialProfiles | null = null;
    if (place.websiteUri) {
      try {
        socials = await extractSocialLinks(place.websiteUri);
      } catch {}
    }

    return {
      placeId: place.id || null,
      phone: place.nationalPhoneNumber || null,
      website: place.websiteUri || null,
      googleMapsUri: place.googleMapsUri || null,
      rating: place.rating || null,
      userRatingCount: place.userRatingCount || null,
      socials,
    };
  } catch {
    return EMPTY_ENRICHMENT;
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 });

    // 2. Plan check (Ultra + Agence uniquement)
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 });

    const isUltraPlus = profile.plan === 'ultra' || profile.plan === 'agence';
    if (!isUltraPlus) {
      return NextResponse.json({
        error: 'Plan Ultra requis',
        message: 'La recherche d\'entreprises récentes est réservée au plan Ultra. Passez à Ultra pour cibler les nouvelles créations.',
        upgradeRequired: true,
      }, { status: 403 });
    }

    // 3. Parse body
    const body = (await request.json()) as SearchRequestBody;
    const { businessType, city, creationMaxMonths, natureJuridique, nameQuery } = body;

    // Au moins un critere doit etre fourni pour eviter de retourner toute la France
    const hasFilter = !!businessType || !!city || !!nameQuery || !!natureJuridique || !!creationMaxMonths;
    if (!hasFilter) {
      return NextResponse.json({ error: 'Au moins un critère de recherche requis' }, { status: 400 });
    }

    const rawQuery = [businessType, city, nameQuery].filter(Boolean).join(' ');

    // 4. Build query pour API gouv
    const qParts: string[] = [];
    if (businessType) qParts.push(businessType);
    if (nameQuery) qParts.push(nameQuery);

    let companies: CompanyResult[] = [];
    let total = 0;
    let debug: { query?: string; url?: string; totalApi: number; afterFilter?: number; resolvedCity?: string; pagesFetched?: number } = { totalApi: 0 };

    try {
      const sireneResult = await searchSireneWithCity({
        q: qParts.join(' ') || undefined,
        city: city || undefined,
        creationMaxMonths: creationMaxMonths || undefined,
        natureJuridique: natureJuridique || undefined,
        perPage: 25,
      });
      companies = sireneResult.results;
      total = sireneResult.total;
      debug = sireneResult.debug;
    } catch (sireneError) {
      // Log technique pour le debug interne (visible dans Vercel logs)
      console.error('INSEE Sirene failed:', sireneError);
      // Message user-friendly, pas de details techniques exposes
      return NextResponse.json({
        error: 'Erreur lors de la recherche, veuillez réessayer dans quelques instants.',
      }, { status: 500 });
    }

    if (companies.length === 0) {
      return NextResponse.json({
        searchId: null,
        totalFound: 0,
        results: [],
        noWebsiteCount: 0,
        withWebsiteResults: [],
        withWebsiteCount: 0,
        debug,
      });
    }

    // 5. Enrichissement Google Places en parallele (max 25 appels paralleles)
    const enriched = await Promise.allSettled(companies.map(c => enrichWithGooglePlaces(c)));

    // 6. Creer la search en BDD (avec fallback si colonnes pas encore migrees)
    const searchPayload: Record<string, unknown> = {
      user_id: user.id,
      query_business_type: businessType || nameQuery || '',
      query_city: city || '',
      raw_query: rawQuery,
      total_results: total,
      no_website_count: 0,
      search_mode: 'companies',
      filter_creation_date_max: creationMaxMonths || null,
      filter_legal_form: natureJuridique || null,
      filter_name_query: nameQuery || null,
    };

    let { data: search, error: searchError } = await supabase
      .from('searches')
      .insert(searchPayload)
      .select()
      .single();

    // Fallback : si migration 004 pas faite, on retire les nouvelles colonnes
    if (searchError && /search_mode|filter_creation_date_max|filter_legal_form|filter_name_query/i.test(searchError.message)) {
      console.warn('Migration 004 manquante sur table searches, fallback sans nouveaux champs');
      const minimalPayload = {
        user_id: user.id,
        query_business_type: searchPayload.query_business_type,
        query_city: searchPayload.query_city,
        raw_query: searchPayload.raw_query,
        total_results: searchPayload.total_results,
        no_website_count: searchPayload.no_website_count,
      };
      const retry = await supabase.from('searches').insert(minimalPayload).select().single();
      search = retry.data;
      searchError = retry.error;
    }

    if (searchError || !search) {
      console.error('Error creating search:', searchError);
      return NextResponse.json({
        error: 'Erreur lors de la sauvegarde, veuillez réessayer.',
      }, { status: 500 });
    }

    // 7. Build rows pour insertion
    const noWebsiteCount = companies.filter((_, i) => {
      const e = enriched[i];
      return e.status === 'fulfilled' ? !e.value.website : true;
    }).length;

    const resultsToInsert = companies.map((c, i) => {
      const e = enriched[i];
      const enrichment: PlaceEnrichment = e.status === 'fulfilled' ? e.value : EMPTY_ENRICHMENT;

      return {
        search_id: search.id,
        user_id: user.id,
        // Vrai Google Place ID si trouve par enrichissement, fallback SIRET sinon
        // (le SIRET ne marchera pas pour le panel detail Google Places mais identifie unique le row)
        google_place_id: enrichment.placeId || c.siret,
        business_name: c.name,
        business_type: c.nafLabel || null,
        formatted_address: c.address ? `${c.address}, ${c.postalCode || ''} ${c.city || ''}`.trim() : null,
        phone_national: enrichment.phone,
        phone_international: null,
        has_website: !!enrichment.website,
        website_url: enrichment.website,
        google_maps_uri: enrichment.googleMapsUri,
        latitude: c.latitude,
        longitude: c.longitude,
        rating: enrichment.rating,
        user_rating_count: enrichment.userRatingCount,
        social_profiles: enrichment.socials,
        // Champs SIRENE
        siret: c.siret,
        siren: c.siren,
        naf_code: c.nafCode,
        naf_label: c.nafLabel,
        creation_date: c.creationDate,
        legal_form: c.legalForm,
        employees_range: c.employeesRange,
        source: 'companies',
      };
    });

    if (resultsToInsert.length > 0) {
      const { error: insertError } = await supabase.from('search_results').insert(resultsToInsert);
      if (insertError) {
        // Si colonnes SIRENE manquantes, retry en virant ces champs
        if (/siret|naf_code|creation_date|legal_form|employees_range|source/i.test(insertError.message)) {
          console.warn('Migration 004 manquante sur table search_results, fallback minimal');
          const minimal = resultsToInsert.map(r => {
            const cleaned = { ...r };
            delete (cleaned as Record<string, unknown>).siret;
            delete (cleaned as Record<string, unknown>).siren;
            delete (cleaned as Record<string, unknown>).naf_code;
            delete (cleaned as Record<string, unknown>).naf_label;
            delete (cleaned as Record<string, unknown>).creation_date;
            delete (cleaned as Record<string, unknown>).legal_form;
            delete (cleaned as Record<string, unknown>).employees_range;
            delete (cleaned as Record<string, unknown>).source;
            return cleaned;
          });
          const retry = await supabase.from('search_results').insert(minimal);
          if (retry.error) {
            console.error('Insert fallback failed:', retry.error);
            return NextResponse.json({
              error: 'Erreur lors de la sauvegarde, veuillez réessayer.',
            }, { status: 500 });
          }
        } else {
          console.error('Insert error:', insertError);
          return NextResponse.json({
            error: 'Erreur lors de la sauvegarde, veuillez réessayer.',
          }, { status: 500 });
        }
      }
    }

    // Update no_website_count
    await supabase.from('searches').update({ no_website_count: noWebsiteCount }).eq('id', search.id);

    // 8. Increment search counter
    await supabase
      .from('profiles')
      .update({ total_searches_used: (profile.total_searches_used || 0) + 1 })
      .eq('id', user.id);

    // 9. Recuperer les resultats depuis la BDD pour avoir les IDs
    const { data: dbResults } = await supabase
      .from('search_results')
      .select('*')
      .eq('search_id', search.id)
      .order('creation_date', { ascending: false, nullsFirst: false });

    // 10. Build response
    const allResults = (dbResults || []) as SearchResultClient[];
    const noWebsite = allResults.filter(r => !r.has_website).map(r => ({ ...r, is_blurred: false }));
    const withWebsite = allResults.filter(r => r.has_website).map(r => ({ ...r, is_blurred: false }));

    return NextResponse.json({
      searchId: search.id,
      totalFound: companies.length,
      results: noWebsite,
      noWebsiteCount: noWebsite.length,
      withWebsiteResults: withWebsite,
      withWebsiteCount: withWebsite.length,
      blurredCount: 0,
    });
  } catch (error) {
    // Log technique pour debug interne uniquement
    console.error('Companies search error:', error);
    return NextResponse.json({
      error: 'Erreur lors de la recherche, veuillez réessayer plus tard.',
    }, { status: 500 });
  }
}
