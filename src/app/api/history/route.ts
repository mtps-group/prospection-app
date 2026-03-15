import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPlanConfig } from '@/lib/constants';
import type { PlanSlug } from '@/lib/constants';

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    // Get profile to check plan limits
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single();

    const plan = getPlanConfig((profile?.plan || 'free') as PlanSlug);
    const limit = plan.maxHistoryItems === Infinity ? 1000 : plan.maxHistoryItems;

    const { data: searches, error } = await supabase
      .from('searches')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: 'Erreur de chargement' }, { status: 500 });
    }

    return NextResponse.json({ searches: searches || [] });
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
