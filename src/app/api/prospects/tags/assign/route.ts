import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST : assigne un tag a un prospect
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { prospect_id, tag_id } = await request.json();
  if (!prospect_id || !tag_id) {
    return NextResponse.json({ error: 'prospect_id et tag_id requis' }, { status: 400 });
  }

  const { error } = await supabase
    .from('prospect_tag_assignments')
    .insert({
      user_id: user.id,
      prospect_id,
      tag_id,
    });

  if (error && error.code !== '23505') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

// DELETE : retire un tag d'un prospect
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const prospect_id = searchParams.get('prospect_id');
  const tag_id = searchParams.get('tag_id');

  if (!prospect_id || !tag_id) {
    return NextResponse.json({ error: 'prospect_id et tag_id requis' }, { status: 400 });
  }

  const { error } = await supabase
    .from('prospect_tag_assignments')
    .delete()
    .eq('user_id', user.id)
    .eq('prospect_id', prospect_id)
    .eq('tag_id', tag_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
