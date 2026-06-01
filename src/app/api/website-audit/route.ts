import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auditWebsite } from '@/lib/website-audit/client';

// Lighthouse peut prendre 15-30s, on configure Vercel pour 60s max
export const maxDuration = 60;

// Cache simple en memoire (30 min)
const cache = new Map<string, { data: Awaited<ReturnType<typeof auditWebsite>>; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  // Plan check : Ultra + Agence uniquement
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
  const url = typeof body.url === 'string' ? body.url.trim() : '';
  if (!url) {
    return NextResponse.json({ error: 'URL requise' }, { status: 400 });
  }

  // Check cache
  const cacheKey = url.toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json({ ...cached.data, fromCache: true });
  }

  try {
    const audit = await auditWebsite(url);
    cache.set(cacheKey, { data: audit, timestamp: Date.now() });
    return NextResponse.json(audit);
  } catch (err) {
    console.error('Audit error:', err);
    return NextResponse.json({
      error: 'Erreur lors de l\'audit, veuillez réessayer.',
    }, { status: 500 });
  }
}
