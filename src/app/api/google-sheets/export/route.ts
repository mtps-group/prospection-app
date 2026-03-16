import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const exportId = searchParams.get('exportId');
  const accessToken = searchParams.get('access_token');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (!exportId || !accessToken) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
  }

  try {
    const supabase = await createClient();

    // Récupérer les données d'export stockées temporairement
    const { data: exportJob } = await supabase
      .from('export_jobs')
      .select('*')
      .eq('id', exportId)
      .single();

    if (!exportJob) {
      return NextResponse.redirect(`${appUrl}/recherche?error=export_expired`);
    }

    const results = exportJob.results as Array<{
      business_name: string;
      formatted_address?: string;
      phone_national?: string;
      business_type?: string;
      rating?: number;
    }>;

    // Créer le spreadsheet
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ access_token: accessToken });

    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: `ProspectWeb - ${exportJob.query || 'Export'} - ${new Date().toLocaleDateString('fr-FR')}`,
        },
        sheets: [{
          properties: { title: 'Prospects' },
        }],
      },
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId!;

    // En-têtes + données
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

    // Formater les en-têtes en gras
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          repeatCell: {
            range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true },
                backgroundColor: { red: 0.38, green: 0.40, blue: 0.95 },
              },
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor)',
          },
        }],
      },
    });

    // Supprimer le job temporaire
    await supabase.from('export_jobs').delete().eq('id', exportId);

    const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
    return NextResponse.redirect(`${appUrl}/recherche?sheets_url=${encodeURIComponent(sheetUrl)}`);
  } catch (error) {
    console.error('Google Sheets export error:', error);
    return NextResponse.redirect(`${appUrl}/recherche?error=export_failed`);
  }
}

// Créer un job d'export et retourner son ID
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

  // Stocker temporairement les données d'export
  const { data: job, error } = await supabase
    .from('export_jobs')
    .insert({
      user_id: user.id,
      results,
      query: query || '',
      created_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error || !job) {
    return NextResponse.json({ error: 'Erreur création job' }, { status: 500 });
  }

  // Vérifier si l'utilisateur a déjà autorisé Google Sheets
  const { data: profile } = await supabase
    .from('profiles')
    .select('google_sheets_refresh_token')
    .eq('id', user.id)
    .single();

  if (profile?.google_sheets_refresh_token) {
    // Déjà autorisé → export direct
    return NextResponse.json({ exportId: job.id, needsAuth: false });
  }

  // Besoin d'OAuth
  return NextResponse.json({ exportId: job.id, needsAuth: true });
}
