import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET : liste les tags du user
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { data, error } = await supabase
    .from('prospect_tags')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tags: data || [] });
}

// POST : cree un tag
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { label, color } = await request.json();
  if (!label || typeof label !== 'string') {
    return NextResponse.json({ error: 'Label requis' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('prospect_tags')
    .insert({
      user_id: user.id,
      label: label.trim().slice(0, 30),
      color: color || '#6366f1',
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Ce tag existe déjà' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ tag: data });
}

// PATCH : modifie un tag
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { id, label, color } = await request.json();
  const updates: Record<string, unknown> = {};
  if (label !== undefined) updates.label = label.trim().slice(0, 30);
  if (color !== undefined) updates.color = color;

  const { data, error } = await supabase
    .from('prospect_tags')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tag: data });
}

// DELETE : supprime un tag (cascade -> assignments)
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  const { error } = await supabase
    .from('prospect_tags')
    .delete()
    .eq('id', id!)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
