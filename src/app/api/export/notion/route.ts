import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Client } from '@notionhq/client';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, notion_access_token')
      .eq('id', user.id)
      .single();

    if (profile?.plan === 'free') {
      return NextResponse.json({ error: 'Export non disponible en plan gratuit' }, { status: 403 });
    }

    if (!profile?.notion_access_token) {
      return NextResponse.json({ error: 'Notion non connecte' }, { status: 400 });
    }

    const { searchId, parentPageId } = await request.json();

    // Get search results and search info
    const { data: search } = await supabase
      .from('searches')
      .select('*')
      .eq('id', searchId)
      .single();

    const { data: results } = await supabase
      .from('search_results')
      .select('*')
      .eq('search_id', searchId)
      .eq('has_website', false)
      .order('rating', { ascending: false, nullsFirst: false });

    if (!results || results.length === 0) {
      return NextResponse.json({ error: 'Aucun resultat a exporter' }, { status: 404 });
    }

    const notion = new Client({ auth: profile.notion_access_token });

    // Create a Notion database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createParams: any = {
      parent: parentPageId
        ? { type: 'page_id', page_id: parentPageId }
        : { type: 'page_id', page_id: parentPageId || '' },
      title: [
        {
          text: {
            content: `Prospection - ${search?.query_business_type} ${search?.query_city}`,
          },
        },
      ],
      properties: {
        Nom: { title: {} },
        Type: { rich_text: {} },
        Adresse: { rich_text: {} },
        Telephone: { phone_number: {} },
        'Google Maps': { url: {} },
        Note: { number: {} },
      },
    };
    const database = await notion.databases.create(createParams);

    // Add pages for each result (with delay to respect rate limits)
    for (const result of results) {
      await notion.pages.create({
        parent: { database_id: database.id },
        properties: {
          Nom: {
            title: [{ text: { content: result.business_name } }],
          },
          Type: {
            rich_text: [{ text: { content: result.business_type || '' } }],
          },
          Adresse: {
            rich_text: [{ text: { content: result.formatted_address || '' } }],
          },
          Telephone: {
            phone_number: result.phone_national || null,
          },
          'Google Maps': {
            url: result.google_maps_uri || null,
          },
          Note: {
            number: result.rating || null,
          },
        },
      });

      // Small delay to respect Notion rate limits
      await new Promise((resolve) => setTimeout(resolve, 350));
    }

    const notionUrl = `https://notion.so/${database.id.replace(/-/g, '')}`;

    // Record export
    await supabase.from('exports').insert({
      user_id: user.id,
      search_id: searchId,
      destination: 'notion',
      destination_url: notionUrl,
      result_count: results.length,
      status: 'completed',
    });

    return NextResponse.json({
      url: notionUrl,
      count: results.length,
    });
  } catch (error) {
    console.error('Notion export error:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'export Notion' }, { status: 500 });
  }
}
