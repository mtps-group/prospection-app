import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkMetaAds } from '@/lib/meta-ads/client';

// Cache 30 min pour eviter de re-hammer l'API Meta
const cache = new Map<string, { data: Awaited<ReturnType<typeof checkMetaAds>>; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single();

  const isUltraPlus = profile?.plan === 'ultra' || profile?.plan === 'agence';
  if (!isUltraPlus) {
    return NextResponse.json({
      error: 'Fonctionnalité réservée au plan Ultra',
      upgradeRequired: true,
    }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const businessName = typeof body.businessName === 'string' ? body.businessName.trim() : '';
  const city = typeof body.city === 'string' ? body.city.trim() : '';

  if (!businessName) {
    return NextResponse.json({ error: 'Nom d\'entreprise requis' }, { status: 400 });
  }

  const cacheKey = `${businessName.toLowerCase()}|${city.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json({ ...cached.data, fromCache: true });
  }

  try {
    const result = await checkMetaAds(businessName, city);
    cache.set(cacheKey, { data: result, timestamp: Date.now() });
    return NextResponse.json(result);
  } catch (err) {
    console.error('Meta ads check error:', err);
    return NextResponse.json({
      error: 'Erreur lors de la vérification, veuillez réessayer.',
    }, { status: 500 });
  }
}
