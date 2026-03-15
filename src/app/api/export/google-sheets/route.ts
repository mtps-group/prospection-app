import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { google } from 'googleapis';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, google_sheets_token')
      .eq('id', user.id)
      .single();

    if (profile?.plan === 'free') {
      return NextResponse.json({ error: 'Export non disponible en plan gratuit' }, { status: 403 });
    }

    if (!profile?.google_sheets_token) {
      return NextResponse.json({ error: 'Google Sheets non connecte' }, { status: 400 });
    }

    const { searchId, sheetName } = await request.json();

    // Get search results
    const { data: results } = await supabase
      .from('search_results')
      .select('*')
      .eq('search_id', searchId)
      .eq('has_website', false)
      .order('rating', { ascending: false, nullsFirst: false });

    if (!results || results.length === 0) {
      return NextResponse.json({ error: 'Aucun resultat a exporter' }, { status: 404 });
    }

    // Setup Google Sheets client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const tokens = profile.google_sheets_token as Record<string, unknown>;
    oauth2Client.setCredentials(tokens);

    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

    // Create new spreadsheet
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: sheetName || `Prospection - ${new Date().toLocaleDateString('fr-FR')}`,
        },
      },
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId!;

    // Write header + data
    const headers = ['Nom', 'Type', 'Adresse', 'Telephone', 'Telephone Int.', 'Google Maps', 'Note', 'Nombre d\'avis'];
    const rows = results.map((r) => [
      r.business_name,
      r.business_type || '',
      r.formatted_address || '',
      r.phone_national || '',
      r.phone_international || '',
      r.google_maps_uri || '',
      r.rating?.toString() || '',
      r.user_rating_count?.toString() || '',
    ]);

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [headers, ...rows],
      },
    });

    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

    // Record export
    await supabase.from('exports').insert({
      user_id: user.id,
      search_id: searchId,
      destination: 'google_sheets',
      destination_url: spreadsheetUrl,
      result_count: results.length,
      status: 'completed',
    });

    return NextResponse.json({
      url: spreadsheetUrl,
      count: results.length,
    });
  } catch (error) {
    console.error('Google Sheets export error:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'export' }, { status: 500 });
  }
}
