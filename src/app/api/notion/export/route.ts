import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 60;

/**
 * Extrait l'ID pur d'une database Notion, que l'utilisateur ait collé :
 * - L'ID seul : "abc123..." (32 hex chars, avec ou sans tirets)
 * - L'URL complète : "https://www.notion.so/MyWorkspace/abc123...?v=xyz"
 */
function parseNotionDatabaseId(raw: string): string {
  const cleaned = raw.trim();
  // Si c'est une URL, on extrait le segment qui ressemble à un UUID
  const uuidPattern = /([0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12})/i;
  const match = cleaned.match(uuidPattern);
  if (match) return match[1];
  // Si c'est un ID sans tirets (32 hex chars)
  const hexPattern = /([0-9a-f]{32})/i;
  const hexMatch = cleaned.match(hexPattern);
  if (hexMatch) return hexMatch[1];
  return cleaned;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('notion_token, notion_database_id')
    .eq('id', user.id)
    .single();

  if (!profile?.notion_token || !profile?.notion_database_id) {
    return NextResponse.json({
      error: 'Notion non configuré. Allez dans Intégrations pour configurer votre token et l\'ID de base.',
      needsSetup: true,
    }, { status: 400 });
  }

  const { results, query } = await request.json();

  if (!results || !Array.isArray(results) || results.length === 0) {
    return NextResponse.json({ error: 'Aucun résultat à exporter' }, { status: 400 });
  }

  const databaseId = parseNotionDatabaseId(profile.notion_database_id);

  try {
    const notion = new Client({ auth: profile.notion_token });

    // Vérification rapide que la base existe et est accessible
    await notion.databases.retrieve({ database_id: databaseId });

    // Ajout des pages une par une (évite le rate-limiting Notion)
    let successCount = 0;
    const toExport = results.slice(0, 50);

    for (const r of toExport) {
      try {
        await notion.pages.create({
          parent: { database_id: databaseId },
          properties: {
            'Nom': {
              title: [{ text: { content: r.business_name || '' } }],
            },
            'Adresse': {
              rich_text: [{ text: { content: r.formatted_address || '' } }],
            },
            'Téléphone': {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              phone_number: (r.phone_national as any) || null,
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
        });
        successCount++;
      } catch {
        // On continue même si une page échoue
      }
      // Délai pour respecter les limites Notion (3 req/s)
      await new Promise((r) => setTimeout(r, 340));
    }

    const databaseUrl = `https://notion.so/${databaseId.replace(/-/g, '')}`;

    return NextResponse.json({
      success: true,
      count: successCount,
      databaseUrl,
    });

  } catch (error: unknown) {
    console.error('Notion export error:', error);
    const message = error instanceof Error ? error.message : 'Erreur inconnue';

    if (message.includes('unauthorized') || message.includes('401') || message.includes('API token')) {
      return NextResponse.json({
        error: 'Token Notion invalide. Vérifiez votre token dans Intégrations.',
        needsSetup: true,
      }, { status: 401 });
    }
    if (message.includes('Could not find database') || message.includes('404') || message.includes('object_not_found')) {
      return NextResponse.json({
        error: 'Base de données Notion introuvable. Vérifiez l\'ID et que l\'intégration est bien connectée à cette base.',
        needsSetup: true,
      }, { status: 404 });
    }
    return NextResponse.json({ error: `Erreur Notion : ${message}` }, { status: 500 });
  }
}
