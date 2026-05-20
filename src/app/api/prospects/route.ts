import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

type EventType = 'created' | 'status_changed' | 'meeting_booked' | 'signed' | 'lost' | 'note_added' | 'tag_added' | 'tag_removed';

async function logEvent(
  supabase: SupabaseClient,
  userId: string,
  prospectId: string,
  eventType: EventType,
  fromStatus?: string | null,
  toStatus?: string | null,
  metadata: Record<string, unknown> = {}
) {
  // Best-effort : on logge mais on ne fait pas planter l'API si la table n'existe pas encore
  const { error } = await supabase.from('prospect_events').insert({
    user_id: userId,
    prospect_id: prospectId,
    event_type: eventType,
    from_status: fromStatus ?? null,
    to_status: toStatus ?? null,
    metadata,
  });
  if (error && !/prospect_events/i.test(error.message)) {
    console.warn('logEvent failed:', error.message);
  }
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  // 1. Recupere les prospects
  const { data: prospects, error: prospectsError } = await supabase
    .from('prospects')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (prospectsError) return NextResponse.json({ error: prospectsError.message }, { status: 500 });
  if (!prospects || prospects.length === 0) return NextResponse.json({ prospects: [] });

  // 2. Recupere toutes les tag assignments + tags en une requete
  const { data: assignments } = await supabase
    .from('prospect_tag_assignments')
    .select('prospect_id, tag_id')
    .eq('user_id', user.id);

  const { data: tags } = await supabase
    .from('prospect_tags')
    .select('*')
    .eq('user_id', user.id);

  // 3. Map tags par prospect
  const tagsById = new Map((tags || []).map(t => [t.id, t]));
  const tagsByProspect = new Map<string, typeof tags>();
  for (const a of assignments || []) {
    if (!tagsByProspect.has(a.prospect_id)) tagsByProspect.set(a.prospect_id, []);
    const tag = tagsById.get(a.tag_id);
    if (tag) tagsByProspect.get(a.prospect_id)!.push(tag);
  }

  // 4. Inject tags dans chaque prospect
  const withTags = prospects.map(p => ({
    ...p,
    tags: tagsByProspect.get(p.id) || [],
  }));

  return NextResponse.json({ prospects: withTags });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const body = await request.json();
  const { google_place_id, business_name, business_type, formatted_address, phone_national, website_url, status, notes } = body;

  const { data, error } = await supabase
    .from('prospects')
    .upsert({
      user_id: user.id,
      google_place_id,
      business_name,
      business_type,
      formatted_address,
      phone_national,
      website_url,
      status: status || 'a_contacter',
      notes,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,google_place_id' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log event "created"
  await logEvent(supabase, user.id, data.id, 'created', null, data.status);

  return NextResponse.json({ prospect: data });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const body = await request.json();
  const {
    id,
    status,
    notes,
    meeting_date,
    meeting_notes,
    deal_value,
    next_followup_at,
  } = body;

  // 1. Recupere l'etat actuel pour comparer
  const { data: current } = await supabase
    .from('prospects')
    .select('status, deal_value, meeting_date')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!current) return NextResponse.json({ error: 'Prospect introuvable' }, { status: 404 });

  // 2. Build update payload
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (status !== undefined) updates.status = status;
  if (notes !== undefined) updates.notes = notes;
  if (meeting_date !== undefined) updates.meeting_date = meeting_date;
  if (meeting_notes !== undefined) updates.meeting_notes = meeting_notes;
  if (deal_value !== undefined) updates.deal_value = deal_value;
  if (next_followup_at !== undefined) updates.next_followup_at = next_followup_at;

  // 3. Auto-fill signed_at / lost_at quand status change
  if (status === 'signe' && current.status !== 'signe') {
    updates.signed_at = updates.signed_at || new Date().toISOString();
  }
  if (status === 'pas_interesse' && current.status !== 'pas_interesse') {
    updates.lost_at = new Date().toISOString();
  }

  // 4. Update
  const { data, error } = await supabase
    .from('prospects')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    // Si une colonne n'existe pas (migration pas faite), on tente sans les nouveaux champs
    if (/meeting_date|deal_value|signed_at|lost_at|next_followup_at|meeting_notes/i.test(error.message)) {
      const safeUpdates: Record<string, unknown> = { updated_at: updates.updated_at };
      if (status !== undefined) safeUpdates.status = status;
      if (notes !== undefined) safeUpdates.notes = notes;
      const retry = await supabase
        .from('prospects')
        .update(safeUpdates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      if (retry.error) return NextResponse.json({ error: retry.error.message }, { status: 500 });
      return NextResponse.json({ prospect: retry.data });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 5. Logue les events appropries
  if (status && status !== current.status) {
    await logEvent(supabase, user.id, id, 'status_changed', current.status, status);

    if (status === 'rdv_pris') {
      await logEvent(supabase, user.id, id, 'meeting_booked', current.status, status, {
        meeting_date: meeting_date ?? null,
        meeting_notes: meeting_notes ?? null,
      });
    }
    if (status === 'signe') {
      await logEvent(supabase, user.id, id, 'signed', current.status, status, {
        deal_value: deal_value ?? null,
      });
    }
    if (status === 'pas_interesse') {
      await logEvent(supabase, user.id, id, 'lost', current.status, status);
    }
  }

  return NextResponse.json({ prospect: data });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  const { error } = await supabase
    .from('prospects')
    .delete()
    .eq('id', id!)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
