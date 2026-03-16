import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const exportId = searchParams.get('state');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (!code) {
    return NextResponse.redirect(`${appUrl}/recherche?error=google_auth_failed`);
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${appUrl}/api/google-sheets/callback`
    );

    const { tokens } = await oauth2Client.getToken(code);

    // Stocker le refresh token dans le profil utilisateur
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(`${appUrl}/login`);
    }

    if (tokens.refresh_token) {
      await supabase
        .from('profiles')
        .update({ google_sheets_refresh_token: tokens.refresh_token })
        .eq('id', user.id);
    }

    // Rediriger vers l'export
    return NextResponse.redirect(
      `${appUrl}/api/google-sheets/export?exportId=${exportId}&access_token=${encodeURIComponent(tokens.access_token!)}`
    );
  } catch (error) {
    console.error('Google Sheets callback error:', error);
    return NextResponse.redirect(`${appUrl}/recherche?error=google_auth_failed`);
  }
}
