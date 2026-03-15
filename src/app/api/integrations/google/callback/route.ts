import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const userId = searchParams.get('state');

  if (!code || !userId) {
    return NextResponse.redirect(new URL('/exports?error=missing_code', process.env.NEXT_PUBLIC_APP_URL!));
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);
    const supabase = createAdminClient();

    await supabase
      .from('profiles')
      .update({
        google_sheets_token: tokens,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    return NextResponse.redirect(new URL('/exports?connected=google', process.env.NEXT_PUBLIC_APP_URL!));
  } catch (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(new URL('/exports?error=google_auth', process.env.NEXT_PUBLIC_APP_URL!));
  }
}
