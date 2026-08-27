import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { searchPlaces, filterNoWebsite, getPrimaryType } from '@/lib/google-places/client';
import { extractSocialLinks } from '@/lib/social-scraper';
import { getPlanConfig } from '@/lib/constants';
import { blurResults } from '@/lib/search-response';
import type { PlanSlug } from '@/lib/constants';
import type { SearchResultClient, SocialProfiles } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    // 2. Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 });
    }

    const plan = getPlanConfig(profile.plan as PlanSlug);

    // 3. Check rate limit (free: 2 searches lifetime)
    if (
      profile.plan === 'free' &&
      profile.total_searches_used >= plan.maxSearchesLifetime
    ) {
      return NextResponse.json(
        {
          error: 'Limite de recherches atteinte',
          message: `Vous avez utilise vos ${plan.maxSearchesLifetime} recherches gratuites. Passez a Premium pour des recherches illimitees.`,
          upgradeRequired: true,
        },
        { status: 429 }
      );
    }

    // 4. Parse request body
    const body = await request.json();
    const { businessType, city } = body;

    if (!businessType || !city) {
      return NextResponse.json(
        { error: 'Type d\'activite et ville requis' },
        { status: 400 }
      );
    }

    const rawQuery = `${businessType} ${city}`;

    // 5. Call Google Places API
    const maxPages = profile.plan === 'free' ? 1 : 3;
    const detailed = profile.plan === 'ultra';

    const allPlaces = await searchPlaces({
      query: rawQuery,
      maxPages,
      detailed,
    });

    // 6. Filter businesses without a website
    const noWebsitePlaces = filterNoWebsite(allPlaces);

    // 6.5. Enrichissement social (Ultra + Agence uniquement)
    // Pour chaque prospect ayant un site web, on scrape les liens Facebook/Instagram/LinkedIn.
    // Synchrone : ajoute ~3-5s a la recherche dans le pire cas (Promise.all parallele + timeout 4s par fetch).
    const isUltraPlus = profile.plan === 'ultra' || profile.plan === 'agence';
    const socialsByPlaceId = new Map<string, SocialProfiles>();

    if (isUltraPlus) {
      const enrichmentPromises = allPlaces
        .filter((p) => !!p.websiteUri)
        .map(async (place) => {
          const socials = await extractSocialLinks(place.websiteUri);
          return { id: place.id, socials };
        });

      const settled = await Promise.allSettled(enrichmentPromises);
      for (const r of settled) {
        if (r.status === 'fulfilled') {
          socialsByPlaceId.set(r.value.id, r.value.socials);
        }
      }
    }

    // 7. Create the search record
    const { data: search, error: searchError } = await supabase
      .from('searches')
      .insert({
        user_id: user.id,
        query_business_type: businessType,
        query_city: city,
        raw_query: rawQuery,
        total_results: allPlaces.length,
        no_website_count: noWebsitePlaces.length,
      })
      .select()
      .single();

    if (searchError) {
      console.error('Error creating search:', searchError);
      return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 });
    }

    // 8. Save all results to DB
    const resultsToInsert = allPlaces.map((place) => ({
      search_id: search.id,
      user_id: user.id,
      google_place_id: place.id,
      business_name: place.displayName?.text || 'Inconnu',
      business_type: getPrimaryType(place.types),
      formatted_address: place.formattedAddress || null,
      phone_national: place.nationalPhoneNumber || null,
      phone_international: place.internationalPhoneNumber || null,
      has_website: !!place.websiteUri,
      website_url: place.websiteUri || null,
      google_maps_uri: place.googleMapsUri || null,
      latitude: place.location?.latitude || null,
      longitude: place.location?.longitude || null,
      rating: place.rating || null,
      user_rating_count: place.userRatingCount || null,
      social_profiles: socialsByPlaceId.get(place.id) || null,
    }));

    if (resultsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('search_results')
        .insert(resultsToInsert);

      // Fallback : si la colonne social_profiles n'existe pas encore en BDD,
      // on retente sans elle (cas ou la migration n'a pas ete executee).
      if (insertError && /social_profiles/i.test(insertError.message)) {
        console.warn('Colonne social_profiles introuvable, retry sans cette colonne. Lance la migration SQL.');
        const safeRows = resultsToInsert.map((r) => {
          const { social_profiles, ...rest } = r;
          void social_profiles;
          return rest;
        });
        const { error: retryError } = await supabase
          .from('search_results')
          .insert(safeRows);
        if (retryError) {
          console.error('Insert search_results failed even after retry:', retryError);
          return NextResponse.json({ error: 'Erreur lors de la sauvegarde des resultats' }, { status: 500 });
        }
      } else if (insertError) {
        console.error('Insert search_results failed:', insertError);
        return NextResponse.json({ error: 'Erreur lors de la sauvegarde des resultats' }, { status: 500 });
      }
    }

    // 9. Increment search counter
    await supabase
      .from('profiles')
      .update({ total_searches_used: profile.total_searches_used + 1 })
      .eq('id', user.id);

    // 10. Build client response
    const visibleCount = plan.visibleResults;

    // Entreprises SANS site web
    const { data: noWebsiteResults } = await supabase
      .from('search_results')
      .select('*')
      .eq('search_id', search.id)
      .eq('has_website', false)
      .order('rating', { ascending: false, nullsFirst: false });

    const noWebsiteList = noWebsiteResults || [];

    const clientResults: SearchResultClient[] = blurResults(noWebsiteList, visibleCount);

    // Entreprises AVEC site web
    const { data: withWebsiteResults } = await supabase
      .from('search_results')
      .select('*')
      .eq('search_id', search.id)
      .eq('has_website', true)
      .order('rating', { ascending: false, nullsFirst: false });

    const withWebsiteList = withWebsiteResults || [];

    const clientWithWebsite: SearchResultClient[] = blurResults(withWebsiteList, visibleCount, { maskWebsite: true });

    return NextResponse.json({
      searchId: search.id,
      totalFound: allPlaces.length,
      noWebsiteCount: noWebsitePlaces.length,
      results: clientResults,
      blurredCount: Math.max(0, noWebsiteList.length - visibleCount),
      withWebsiteResults: clientWithWebsite,
      withWebsiteCount: withWebsiteList.length,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
