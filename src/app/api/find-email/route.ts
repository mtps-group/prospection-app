import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

const EMAIL_BLACKLIST = [
  'noreply', 'no-reply', 'donotreply', 'example', 'test@',
  'sentry', 'w3.org', 'schema.org', 'googleapis', 'gstatic',
  'cloudflare', 'jquery', 'webpack', 'pagesjaunes', 'solocal',
  'laposte', 'orange.fr', '.png', '.jpg', '.svg', '.gif', '.css', '.js',
];

function isValidEmail(email: string): boolean {
  const lower = email.toLowerCase();
  return !EMAIL_BLACKLIST.some((b) => lower.includes(b)) && email.includes('.');
}

async function fetchWithTimeout(url: string, timeout = 6000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9',
      },
    });
    clearTimeout(timer);
    if (!response.ok) return '';
    return await response.text();
  } catch {
    clearTimeout(timer);
    return '';
  }
}

function extractEmails(html: string): string[] {
  // Cherche les liens mailto: en priorité
  const mailtoMatches = html.match(/mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/g) || [];
  const mailtoEmails = mailtoMatches.map(m => m.replace('mailto:', ''));

  // Ensuite cherche les patterns email génériques
  const allMatches = html.match(EMAIL_REGEX) || [];

  const combined = [...mailtoEmails, ...allMatches];
  const seen = new Set<string>();
  return combined
    .map(e => e.toLowerCase().trim())
    .filter(e => {
      if (!isValidEmail(e) || seen.has(e)) return false;
      seen.add(e);
      return true;
    })
    .slice(0, 3);
}

async function searchPagesJaunes(businessName: string, city: string): Promise<string[]> {
  const query = encodeURIComponent(businessName);
  const location = encodeURIComponent(city);

  // 1. Page de recherche PagesJaunes
  const searchUrl = `https://www.pagesjaunes.fr/annuaire/cherche?quoiqui=${query}&ou=${location}`;
  const searchHtml = await fetchWithTimeout(searchUrl);

  if (!searchHtml) return [];

  // Extraire les emails directs depuis la page de résultats
  const searchEmails = extractEmails(searchHtml);
  if (searchEmails.length > 0) return searchEmails;

  // 2. Essayer de trouver le lien vers la fiche détail
  // PagesJaunes utilise des URLs comme /pros/NOM-VILLE-SIRET
  const ficheMatch = searchHtml.match(/href="(\/pros\/[^"]+)"/);
  if (ficheMatch) {
    const ficheUrl = `https://www.pagesjaunes.fr${ficheMatch[1]}`;
    const ficheHtml = await fetchWithTimeout(ficheUrl);
    if (ficheHtml) {
      const ficheEmails = extractEmails(ficheHtml);
      if (ficheEmails.length > 0) return ficheEmails;
    }
  }

  return [];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const businessName = searchParams.get('name');
  const city = searchParams.get('city');

  if (!businessName || !city) {
    return NextResponse.json({ error: 'name et city requis' }, { status: 400 });
  }

  // Vérifier authentification
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  try {
    const emails = await searchPagesJaunes(businessName, city);
    return NextResponse.json({ emails, found: emails.length > 0, source: 'pagesjaunes' });
  } catch (error) {
    console.error('find-email error:', error);
    return NextResponse.json({ emails: [], found: false });
  }
}
