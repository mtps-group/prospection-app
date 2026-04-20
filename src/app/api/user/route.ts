import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 });
  }

  return NextResponse.json({ profile });
}

// PATCH — mise à jour sécurisée du profil (intégrations, nom, etc.)
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const body = await request.json();

  // Seuls ces champs sont autorisés à être mis à jour via cette route
  const allowed = ['full_name', 'notion_token', 'notion_database_id'];
  const updates: Record<string, string | null> = { updated_at: new Date().toISOString() };

  for (const key of allowed) {
    if (key in body) {
      updates[key] = body[key] ?? null;
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id);

  if (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
