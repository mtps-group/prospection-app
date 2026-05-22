import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { searchCompanies, type CompanyResult } from '@/lib/recherche-entreprises/client';
import { extractSocialLinks } from '@/lib/social-scraper';
import type { SearchResultClient, SocialProfiles } from '@/types';

interface SearchRequestBody {
  businessType?: string;
  city?: string;
  creationMaxMonths?: number;
  natureJuridique?: string;
  nameQuery?: string;
}

interface PlaceEnrichment {
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
async function enrichWithGooglePlaces(company: CompanyResult): Promise<PlaceEnrichment> {
  if (!process.env.GOOGLE_PLACES_API_KEY) {
    return { phone: null, website: null, googleMapsUri: null, rating: null, userRatingCount: null, socials: null };
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
        'X-Goog-FieldMask': 'places.displayName,places.nationalPhoneNumber,places.websiteUri,places.googleMapsUri,places.rating,places.userRatingCount,places.formattedAddress',
      },
      body: JSON.stringify({
        textQuery: query,
        languageCode: 'fr',
        regionCode: 'FR',
      }),
    });

    if (!response.ok) {
      return { phone: null, website: null, googleMapsUri: null, rating: null, userRatingCount: null, socials: null };
    }

    const data = await response.json();
    const places = data.places || [];
    // On prend le premier match (Google trie deja par pertinence)
    const place = places[0];

    if (!place) {
      return { phone: null, website: null, googleMapsUri: null, rating: null, userRatingCount: null, socials: null };
    }

    // Scrape social links si site web present
    let socials: SocialProfiles | null = null;
    if (place.websiteUri) {
      try {
        socials = await extractSocialLinks(place.websiteUri);
      } catch {}
    }

    return {
      phone: place.nationalPhoneNumber || null,
      website: place.websiteUri || null,
      googleMapsUri: place.googleMapsUri || null,
      rating: place.rating || null,
      userRatingCount: place.userRatingCount || null,
      socials,
    };
  } catch {
    return { phone: null, website: null, googleMapsUri: null, rating: null, userRatingCount: null, socials: null };
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

    if (!businessType && !nameQuery) {
      return NextResponse.json({ error: 'Type d\'activité ou nom requis' }, { status: 400 });
    }

    const rawQuery = [businessType, city, nameQuery].filter(Boolean).join(' ');

    // 4. Build query pour API gouv
    const qParts: string[] = [];
    if (businessType) qParts.push(businessType);
    if (nameQuery) qParts.push(nameQuery);

    const { results: companies, total } = await searchCompanies({
      q: qParts.join(' ') || undefined,
      location: city || undefined,
      creationMaxMonths: creationMaxMonths || undefined,
      natureJuridique: natureJuridique || undefined,
      perPage: 25,
    });

    if (companies.length === 0) {
      return NextResponse.json({
        searchId: null,
        totalFound: 0,
        results: [],
        noWebsiteCount: 0,
        withWebsiteResults: [],
        withWebsiteCount: 0,
      });
    }

    // 5. Enrichissement Google Places en parallele (max 25 appels paralleles)
    const enriched = await Promise.allSettled(companies.map(c => enrichWithGooglePlaces(c)));

    // 6. Creer la search en BDD
    const { data: search, error: searchError } = await supabase
      .from('searches')
      .insert({
        user_id: user.id,
        query_business_type: businessType || nameQuery || '',
        query_city: city || '',
        raw_query: rawQuery,
        total_results: total,
        no_website_count: 0, // calcule plus tard
        search_mode: 'companies',
        filter_creation_date_max: creationMaxMonths || null,
        filter_legal_form: natureJuridique || null,
        filter_name_query: nameQuery || null,
      })
      .select()
      .single();

    if (searchError) {
      console.error('Error creating search:', searchError);
      return NextResponse.json({ error: 'Erreur sauvegarde' }, { status: 500 });
    }

    // 7. Build rows pour insertion
    const noWebsiteCount = companies.filter((_, i) => {
      const e = enriched[i];
      return e.status === 'fulfilled' ? !e.value.website : true;
    }).length;

    const resultsToInsert = companies.map((c, i) => {
      const e = enriched[i];
      const enrichment: PlaceEnrichment = e.status === 'fulfilled' ? e.value : {
        phone: null, website: null, googleMapsUri: null, rating: null, userRatingCount: null, socials: null,
      };

      return {
        search_id: search.id,
        user_id: user.id,
        google_place_id: c.siret, // on utilise SIRET en remplacement (unique)
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
      await supabase.from('search_results').insert(resultsToInsert);
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
    console.error('Companies search error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
