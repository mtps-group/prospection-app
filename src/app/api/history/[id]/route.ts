import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPlanConfig } from '@/lib/constants';
import type { PlanSlug } from '@/lib/constants';
import { blurResults } from '@/lib/search-response';

// Restitue les resultats STOCKES d'une recherche passee, sans relancer
// de recherche Google Places ni toucher au quota.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single();

    const plan = getPlanConfig((profile?.plan || 'free') as PlanSlug);

    // Ownership : RLS filtre deja par user_id, mais on le verifie explicitement
    const { data: search, error: searchError } = await supabase
      .from('searches')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (searchError || !search) {
      return NextResponse.json({ error: 'Recherche introuvable' }, { status: 404 });
    }

    const { data: noWebsiteResults } = await supabase
      .from('search_results')
      .select('*')
      .eq('search_id', search.id)
      .eq('has_website', false)
      .order('rating', { ascending: false, nullsFirst: false });

    const { data: withWebsiteResults } = await supabase
      .from('search_results')
      .select('*')
      .eq('search_id', search.id)
      .eq('has_website', true)
      .order('rating', { ascending: false, nullsFirst: false });

    const noWebsiteList = noWebsiteResults || [];
    const withWebsiteList = withWebsiteResults || [];
    const visibleCount = plan.visibleResults;

    return NextResponse.json({
      searchId: search.id,
      totalFound: search.total_results,
      noWebsiteCount: noWebsiteList.length,
      results: blurResults(noWebsiteList, visibleCount),
      blurredCount: Math.max(0, noWebsiteList.length - visibleCount),
      withWebsiteResults: blurResults(withWebsiteList, visibleCount, { maskWebsite: true }),
      withWebsiteCount: withWebsiteList.length,
      query: {
        businessType: search.query_business_type,
        city: search.query_city,
      },
    });
  } catch (error) {
    console.error('History detail error:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
