import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';

async function createSpreadsheet(accessToken: string, results: Array<{
  business_name: string;
  formatted_address?: string;
  phone_national?: string;
  business_type?: string;
  rating?: number;
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

  const rows = [
    ['Nom', 'Adresse', 'Téléphone', 'Type', 'Note Google'],
    ...results.map(r => [
      r.business_name || '',
      r.formatted_address || '',
      r.phone_national || '',
      r.business_type || '',
      r.rating ? r.rating.toString() : '',
    ]),
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Prospects!A1',
    valueInputOption: 'RAW',
    requestBody: { values: rows },
  });

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{
        repeatCell: {
          range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
          cell: {
            userEnteredFormat: {
              textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
              backgroundColor: { red: 0.38, green: 0.40, blue: 0.95 },
            },
          },
          fields: 'userEnteredFormat(textFormat,backgroundColor)',
        },
      }],
    },
  });

  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
}

// Appelé après le callback OAuth avec l'access token
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const exportId = searchParams.get('exportId');
  const accessToken = searchParams.get('access_token');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (!exportId || !accessToken) {
    return NextResponse.redirect(`${appUrl}/recherche?export_error=params_missing`);
  }

  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    console.log('[Sheets GET] user:', user?.id ?? 'NOT FOUND');

    const { data: exportJob, error: jobError } = await supabase
      .from('export_jobs')
      .select('*')
      .eq('id', exportId)
      .single();

    console.log('[Sheets GET] exportJob:', exportJob ? 'found' : 'not found', '| error:', jobError?.message);

    if (!exportJob) {
      return NextResponse.redirect(`${appUrl}/recherche?export_error=expired`);
    }

    console.log('[Sheets GET] token length:', accessToken?.length, '| results:', exportJob.results?.length);

    const sheetUrl = await createSpreadsheet(accessToken, exportJob.results, exportJob.query);

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

  const { results, query } = await request.json();

  if (!results || !Array.isArray(results)) {
    return NextResponse.json({ error: 'Résultats requis' }, { status: 400 });
  }

  // Vérifier si l'utilisateur a déjà un refresh token Google Sheets
  const { data: profile } = await supabase
    .from('profiles')
    .select('google_sheets_refresh_token')
    .eq('id', user.id)
    .single();

  if (profile?.google_sheets_refresh_token) {
    // Déjà autorisé → créer le sheet directement
    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );
      oauth2Client.setCredentials({ refresh_token: profile.google_sheets_refresh_token });
      const { credentials } = await oauth2Client.refreshAccessToken();

      const sheetUrl = await createSpreadsheet(credentials.access_token!, results, query || '');
      return NextResponse.json({ sheetUrl, needsAuth: false });
    } catch {
      // Token expiré → refaire l'OAuth
    }
  }

  // Stocker les données temporairement puis demander l'OAuth
  const { data: job, error } = await supabase
    .from('export_jobs')
    .insert({ user_id: user.id, results, query: query || '' })
    .select('id')
    .single();

  if (error || !job) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }

  return NextResponse.json({ exportId: job.id, needsAuth: true });
}
