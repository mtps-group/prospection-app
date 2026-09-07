import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';
import { getPlanConfig, type PlanSlug } from '@/lib/constants';

async function createSpreadsheet(accessToken: string, results: Array<{
  business_name: string;
  formatted_address?: string;
  phone_national?: string;
  business_type?: string;
  rating?: number;
  user_rating_count?: number;
  has_website?: boolean;
  website_url?: string;
  google_maps_uri?: string;
}>, query: string): Promise<string> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({ access_token: accessToken });

  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

  const spreadsheet = await sheets.spreadsheets.create({
    requestBody: {
      properties: {
        title: `ProspectWeb - ${query || 'Export'} - ${new Date().toLocaleDateString('fr-FR')}`,
      },
      sheets: [{ properties: { title: 'Prospects' } }],
    },
  });

  const spreadsheetId = spreadsheet.data.spreadsheetId!;
  const sheetId = spreadsheet.data.sheets?.[0]?.properties?.sheetId ?? 0;

  // ── Données ──────────────────────────────────────────────
  const headers = ['#', 'Nom', 'Catégorie', 'A un site web', 'Site web', 'Téléphone', 'Adresse', 'Note Google', "Nb d'avis", 'Google Maps'];
  const rows = [
    headers,
    ...results.map((r, i) => [
      i + 1,
      r.business_name || '',
      r.business_type || '',
      r.has_website ? 'Oui' : 'Non',
      r.website_url || '',
      r.phone_national || '',
      r.formatted_address || '',
      r.rating ?? '',
      r.user_rating_count ?? '',
      r.google_maps_uri || '',
    ]),
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Prospects!A1',
    valueInputOption: 'RAW',
    requestBody: { values: rows },
  });

  // ── Formatage ─────────────────────────────────────────────
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        // En-têtes : fond violet, texte blanc, gras
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 }, fontSize: 11 },
                backgroundColor: { red: 0.31, green: 0.28, blue: 0.92 },
                horizontalAlignment: 'CENTER',
                verticalAlignment: 'MIDDLE',
              },
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor,horizontalAlignment,verticalAlignment)',
          },
        },
        // Hauteur ligne d'en-tête
        {
          updateDimensionProperties: {
            range: { sheetId, dimension: 'ROWS', startIndex: 0, endIndex: 1 },
            properties: { pixelSize: 36 },
            fields: 'pixelSize',
          },
        },
        // Figer la ligne d'en-tête
        {
          updateSheetProperties: {
            properties: { sheetId, gridProperties: { frozenRowCount: 1 } },
            fields: 'gridProperties.frozenRowCount',
          },
        },
        // Largeurs de colonnes (en pixels)
        {
          updateDimensionProperties: {
            range: { sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: 1 },
            properties: { pixelSize: 40 },   // #
            fields: 'pixelSize',
          },
        },
        {
          updateDimensionProperties: {
            range: { sheetId, dimension: 'COLUMNS', startIndex: 1, endIndex: 2 },
            properties: { pixelSize: 260 },  // Nom
            fields: 'pixelSize',
          },
        },
        {
          updateDimensionProperties: {
            range: { sheetId, dimension: 'COLUMNS', startIndex: 2, endIndex: 3 },
            properties: { pixelSize: 180 },  // Catégorie
            fields: 'pixelSize',
          },
        },
        {
          updateDimensionProperties: {
            range: { sheetId, dimension: 'COLUMNS', startIndex: 3, endIndex: 4 },
            properties: { pixelSize: 120 },  // A un site web
            fields: 'pixelSize',
          },
        },
        {
          updateDimensionProperties: {
            range: { sheetId, dimension: 'COLUMNS', startIndex: 4, endIndex: 5 },
            properties: { pixelSize: 240 },  // Site web
            fields: 'pixelSize',
          },
        },
        {
          updateDimensionProperties: {
            range: { sheetId, dimension: 'COLUMNS', startIndex: 5, endIndex: 6 },
            properties: { pixelSize: 140 },  // Téléphone
            fields: 'pixelSize',
          },
        },
        {
          updateDimensionProperties: {
            range: { sheetId, dimension: 'COLUMNS', startIndex: 6, endIndex: 7 },
            properties: { pixelSize: 300 },  // Adresse
            fields: 'pixelSize',
          },
        },
        {
          updateDimensionProperties: {
            range: { sheetId, dimension: 'COLUMNS', startIndex: 7, endIndex: 8 },
            properties: { pixelSize: 100 },  // Note
            fields: 'pixelSize',
          },
        },
        {
          updateDimensionProperties: {
            range: { sheetId, dimension: 'COLUMNS', startIndex: 8, endIndex: 9 },
            properties: { pixelSize: 100 },  // Nb avis
            fields: 'pixelSize',
          },
        },
        {
          updateDimensionProperties: {
            range: { sheetId, dimension: 'COLUMNS', startIndex: 9, endIndex: 10 },
            properties: { pixelSize: 300 },  // Google Maps
            fields: 'pixelSize',
          },
        },
        // Centrer colonne # et Note
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 1, startColumnIndex: 0, endColumnIndex: 1 },
            cell: { userEnteredFormat: { horizontalAlignment: 'CENTER' } },
            fields: 'userEnteredFormat.horizontalAlignment',
          },
        },
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 1, startColumnIndex: 3, endColumnIndex: 4 },
            cell: { userEnteredFormat: { horizontalAlignment: 'CENTER' } },
            fields: 'userEnteredFormat.horizontalAlignment',
          },
        },
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 1, startColumnIndex: 7, endColumnIndex: 9 },
            cell: { userEnteredFormat: { horizontalAlignment: 'CENTER' } },
            fields: 'userEnteredFormat.horizontalAlignment',
          },
        },
      ],
    },
  });

  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
}

// Appelé après le callback OAuth. L'access token n'est plus passé en query
// string (fuite dans logs/historique) : on le regénère depuis le refresh
// token que le callback vient de stocker dans le profil.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const exportId = searchParams.get('exportId');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (!exportId) {
    return NextResponse.redirect(`${appUrl}/recherche?export_error=params_missing`);
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(`${appUrl}/login`);
    }

    // Ownership : uniquement un job appartenant a l'utilisateur connecte
    const { data: exportJob } = await supabase
      .from('export_jobs')
      .select('*')
      .eq('id', exportId)
      .eq('user_id', user.id)
      .single();

    if (!exportJob) {
      return NextResponse.redirect(`${appUrl}/recherche?export_error=expired`);
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('google_sheets_refresh_token')
      .eq('id', user.id)
      .single();

    if (!profile?.google_sheets_refresh_token) {
      return NextResponse.redirect(`${appUrl}/recherche?export_error=google_auth_failed`);
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ refresh_token: profile.google_sheets_refresh_token });
    const { credentials } = await oauth2Client.refreshAccessToken();

    const sheetUrl = await createSpreadsheet(credentials.access_token!, exportJob.results, exportJob.query);
    await supabase.from('export_jobs').delete().eq('id', exportId);

    return NextResponse.redirect(`${appUrl}/recherche?sheets_url=${encodeURIComponent(sheetUrl)}`);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Sheets GET] ERREUR:', msg);
    return NextResponse.redirect(`${appUrl}/recherche?export_error=failed`);
  }
}

// Déclenché par le bouton → crée le sheet si token dispo, sinon démarre OAuth
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { results, query } = await request.json().catch(() => ({}));

  if (!results || !Array.isArray(results)) {
    return NextResponse.json({ error: 'Résultats requis' }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('google_sheets_refresh_token, plan')
    .eq('id', user.id)
    .single();

  // Gating serveur : les exports sont une feature payante (PLANS.free.canExport = false)
  const planConfig = getPlanConfig((profile?.plan ?? 'free') as PlanSlug);
  if (!planConfig.canExportGoogleSheets) {
    return NextResponse.json(
      { error: 'Les exports sont réservés aux plans payants. Passez à Premium pour les débloquer.', upgradeRequired: true },
      { status: 403 }
    );
  }

  // Ne jamais exporter les lignes masquées du floutage
  const exportableResults = results.filter((r: { is_blurred?: boolean }) => !r?.is_blurred);
  if (exportableResults.length === 0) {
    return NextResponse.json({ error: 'Aucun résultat à exporter' }, { status: 400 });
  }

  if (profile?.google_sheets_refresh_token) {
    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );
      oauth2Client.setCredentials({ refresh_token: profile.google_sheets_refresh_token });
      const { credentials } = await oauth2Client.refreshAccessToken();
      const sheetUrl = await createSpreadsheet(credentials.access_token!, exportableResults, query || '');
      return NextResponse.json({ sheetUrl, needsAuth: false });
    } catch {
      // Token expiré → refaire l'OAuth
    }
  }

  const { data: job, error } = await supabase
    .from('export_jobs')
    .insert({ user_id: user.id, results: exportableResults, query: query || '' })
    .select('id')
    .single();

  if (error || !job) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }

  return NextResponse.json({ exportId: job.id, needsAuth: true });
}
