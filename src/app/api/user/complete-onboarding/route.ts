import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const VALID_PERSONAS = ['web_design', 'seo', 'smm', 'b2b', 'autre'];

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const persona = typeof body.persona === 'string' && VALID_PERSONAS.includes(body.persona)
    ? body.persona
    : null;

  const updates: Record<string, unknown> = {
    onboarding_completed: true,
    updated_at: new Date().toISOString(),
  };
  if (persona) updates.onboarding_persona = persona;

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id);

  if (error) {
    // Si la colonne n'existe pas encore (migration pas faite), on n'echoue pas
    if (/onboarding_completed|onboarding_persona/i.test(error.message)) {
      console.warn('Colonne onboarding manquante, migration 003 non executee:', error.message);
      return NextResponse.json({ success: true, warning: 'migration_pending' });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
