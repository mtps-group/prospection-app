import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const userId = searchParams.get('state');

  if (!code || !userId) {
    return NextResponse.redirect(new URL('/exports?error=missing_code', process.env.NEXT_PUBLIC_APP_URL!));
  }

  try {
    // Exchange code for access token
    const response = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(
          `${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`
        ).toString('base64')}`,
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.NOTION_REDIRECT_URI,
      }),
    });

    const data = await response.json();

    if (!data.access_token) {
      throw new Error('No access token received');
    }

    const supabase = createAdminClient();

    await supabase
      .from('profiles')
      .update({
        notion_access_token: data.access_token,
        notion_workspace_name: data.workspace_name || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    return NextResponse.redirect(new URL('/exports?connected=notion', process.env.NEXT_PUBLIC_APP_URL!));
  } catch (error) {
    console.error('Notion OAuth error:', error);
    return NextResponse.redirect(new URL('/exports?error=notion_auth', process.env.NEXT_PUBLIC_APP_URL!));
  }
}
