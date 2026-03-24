import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { searchPlaces, filterNoWebsite, getPrimaryType } from '@/lib/google-places/client';
import { getPlanConfig } from '@/lib/constants';
import type { PlanSlug } from '@/lib/constants';
import type { SearchResultClient } from '@/types';

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
    }));

    if (resultsToInsert.length > 0) {
      await supabase.from('search_results').insert(resultsToInsert);
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

    const clientResults: SearchResultClient[] = noWebsiteList.map((r, index) => {
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
        rating: r.rating,
        user_rating_count: null,
        is_blurred: true,
      };
    });

    // Entreprises AVEC site web
    const { data: withWebsiteResults } = await supabase
      .from('search_results')
      .select('*')
      .eq('search_id', search.id)
      .eq('has_website', true)
      .order('rating', { ascending: false, nullsFirst: false });

    const withWebsiteList = withWebsiteResults || [];

    const clientWithWebsite: SearchResultClient[] = withWebsiteList.map((r, index) => {
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
        website_url: null,
        rating: r.rating,
        user_rating_count: null,
        is_blurred: true,
      };
    });

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
