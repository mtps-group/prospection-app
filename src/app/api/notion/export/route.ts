import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  // Récupérer les credentials Notion du profil
  const { data: profile } = await supabase
    .from('profiles')
    .select('notion_token, notion_database_id')
    .eq('id', user.id)
    .single();

  if (!profile?.notion_token || !profile?.notion_database_id) {
    return NextResponse.json({
      error: 'Notion non configuré',
      needsSetup: true,
    }, { status: 400 });
  }

  const { results, query } = await request.json();

  if (!results || !Array.isArray(results)) {
    return NextResponse.json({ error: 'Résultats requis' }, { status: 400 });
  }

  try {
    const notion = new Client({ auth: profile.notion_token });

    // Créer les pages dans la base de données Notion
    const promises = results.slice(0, 50).map((r: {
      business_name: string;
      formatted_address?: string;
      phone_national?: string;
      business_type?: string;
      rating?: number;
    }) =>
      notion.pages.create({
        parent: { database_id: profile.notion_database_id },
        properties: {
          'Nom': {
            title: [{ text: { content: r.business_name || '' } }],
          },
          'Adresse': {
            rich_text: [{ text: { content: r.formatted_address || '' } }],
          },
          'Téléphone': {
            phone_number: r.phone_national || null,
          },
          'Type': {
            rich_text: [{ text: { content: r.business_type || '' } }],
          },
          'Note': {
            number: r.rating || null,
          },
          'Source': {
            rich_text: [{ text: { content: 'ProspectWeb' } }],
          },
        },
      })
    );

    await Promise.allSettled(promises);

    return NextResponse.json({
      success: true,
      count: results.length,
      databaseUrl: `https://notion.so/${profile.notion_database_id.replace(/-/g, '')}`,
    });
  } catch (error: unknown) {
    console.error('Notion export error:', error);
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    if (message.includes('unauthorized') || message.includes('401')) {
      return NextResponse.json({ error: 'Token Notion invalide', needsSetup: true }, { status: 401 });
    }
    if (message.includes('Could not find database')) {
      return NextResponse.json({ error: 'Base de données Notion introuvable', needsSetup: true }, { status: 404 });
    }
    return NextResponse.json({ error: 'Erreur export Notion' }, { status: 500 });
  }
}
