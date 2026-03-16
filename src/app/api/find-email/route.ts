import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

const EMAIL_BLACKLIST = [
  'noreply', 'no-reply', 'donotreply', 'example', 'test@',
  'sentry', 'w3.org', 'schema.org', 'googleapis', 'gstatic',
  'cloudflare', 'jquery', 'webpack', 'pagesjaunes', 'solocal',
  'laposte.net', 'orange.fr', 'wanadoo', 'sfr.fr',
  '.png', '.jpg', '.svg', '.gif', '.css', '.js',
  'societe.com', 'verif.com', 'kompass', 'infogreffe',
  'privacy', 'dpo@', 'rgpd@', 'webmaster@', 'admin@',
];

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
};

function isValidEmail(email: string): boolean {
  const lower = email.toLowerCase();
  if (EMAIL_BLACKLIST.some((b) => lower.includes(b))) return false;
  if (!email.includes('.')) return false;
  // Exclure les emails trop génériques
  if (/^(info|contact|hello|bonjour|accueil|mairie|support|service)@/.test(lower)) return false;
  return true;
}

function extractEmails(html: string): string[] {
  const mailtoMatches = html.match(/mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/g) || [];
  const mailtoEmails = mailtoMatches.map(m => m.replace('mailto:', ''));
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

async function fetchPage(url: string, timeout = 7000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: HEADERS,
    });
    clearTimeout(timer);
    if (!response.ok) return '';
    return await response.text();
  } catch {
    clearTimeout(timer);
    return '';
  }
}

// Source 1 : societe.com
async function searchSociete(name: string, city: string): Promise<string[]> {
  try {
    const query = encodeURIComponent(`${name} ${city}`);
    const html = await fetchPage(`https://www.societe.com/cgi-bin/search?champs=${query}`);
    if (!html) return [];

    // Chercher le premier lien de fiche entreprise
    const ficheMatch = html.match(/href="(\/societe\/[^"]+\.html)"/);
    if (ficheMatch) {
      const ficheHtml = await fetchPage(`https://www.societe.com${ficheMatch[1]}`);
      const emails = extractEmails(ficheHtml);
      if (emails.length > 0) return emails;
    }
    return extractEmails(html);
  } catch {
    return [];
  }
}

// Source 2 : verif.com
async function searchVerif(name: string, city: string): Promise<string[]> {
  try {
    const encodedName = encodeURIComponent(name);
    const encodedCity = encodeURIComponent(city);
    const html = await fetchPage(
      `https://www.verif.com/cgi-bin/find?P_FORM=1&COMPANY_NAME=${encodedName}&CITY=${encodedCity}`
    );
    if (!html) return [];

    const ficheMatch = html.match(/href="(\/societe\/[^"]+)"/);
    if (ficheMatch) {
      const ficheHtml = await fetchPage(`https://www.verif.com${ficheMatch[1]}`);
      const emails = extractEmails(ficheHtml);
      if (emails.length > 0) return emails;
    }
    return extractEmails(html);
  } catch {
    return [];
  }
}

// Source 3 : 118000.fr
async function search118000(name: string, city: string): Promise<string[]> {
  try {
    const encodedName = encodeURIComponent(name);
    const encodedCity = encodeURIComponent(city);
    const html = await fetchPage(
      `https://www.118000.fr/search?who=${encodedName}&where=${encodedCity}`
    );
    if (!html) return [];
    return extractEmails(html);
  } catch {
    return [];
  }
}

// Source 4 : kompass.com
async function searchKompass(name: string, city: string): Promise<string[]> {
  try {
    const query = encodeURIComponent(`${name} ${city}`);
    const html = await fetchPage(`https://fr.kompass.com/searchCompany?text=${query}`);
    if (!html) return [];
    return extractEmails(html);
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const businessName = searchParams.get('name');
  const city = searchParams.get('city');

  if (!businessName || !city) {
    return NextResponse.json({ error: 'name et city requis' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  try {
    // Lancer toutes les sources en parallèle
    const [societeEmails, verifEmails, emails118000, kompassEmails] = await Promise.all([
      searchSociete(businessName, city),
      searchVerif(businessName, city),
      search118000(businessName, city),
      searchKompass(businessName, city),
    ]);

    // Fusionner et dédupliquer
    const seen = new Set<string>();
    const allEmails = [...societeEmails, ...verifEmails, ...emails118000, ...kompassEmails]
      .filter(e => {
        if (seen.has(e)) return false;
        seen.add(e);
        return true;
      })
      .slice(0, 3);

    const source = allEmails.length > 0
      ? [
          societeEmails.length > 0 ? 'societe.com' : '',
          verifEmails.length > 0 ? 'verif.com' : '',
          emails118000.length > 0 ? '118000.fr' : '',
          kompassEmails.length > 0 ? 'kompass' : '',
        ].filter(Boolean).join(', ')
      : 'aucune';

    return NextResponse.json({
      emails: allEmails,
      found: allEmails.length > 0,
      source,
    });
  } catch (error) {
    console.error('find-email error:', error);
    return NextResponse.json({ emails: [], found: false });
  }
}
