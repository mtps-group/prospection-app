import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 60;

const cache = new Map<string, { data: AiEnrichmentResult; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000;

const EMAIL_BLACKLIST = [
  'noreply', 'no-reply', 'donotreply', 'example', 'sentry',
  'w3.org', 'schema.org', 'googleapis', 'privacy', 'dpo@',
  'rgpd@', 'webmaster@', 'support@', 'admin@',
  '.png', '.jpg', '.svg', '.css', '.js', 'font', 'icon', 'image',
  'bootstrap', 'jquery', 'cloudflare', 'wp-', 'wordpress',
];

interface AiEnrichmentResult { type: string; content: string; }

interface RequestBody {
  type: 'profile' | 'email' | 'mail' | 'dirigeant';
  businessName: string;
  city: string;
  activite?: string;
  rating?: number;
  userRatingCount?: number;
  address?: string;
  phone?: string;
  hasWebsite?: boolean;
  websiteUrl?: string;
}

function isValidEmail(email: string): boolean {
  const lower = email.toLowerCase();
  if (EMAIL_BLACKLIST.some((b) => lower.includes(b))) return false;
  if (!email.includes('.') || !email.includes('@')) return false;
  if (email.length > 100 || email.length < 6) return false;
  return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email);
}

function extractEmailFromHtml(html: string): string | null {
  // 1. Emails encodés en base64 (technique Pages Jaunes & autres)
  const b64Pattern = /data-[a-z-]+=["']([A-Za-z0-9+/]{15,}={0,2})["']/g;
  let m;
  while ((m = b64Pattern.exec(html)) !== null) {
    try {
      const decoded = Buffer.from(m[1], 'base64').toString('utf8');
      if (decoded.includes('@') && isValidEmail(decoded.trim())) {
        return decoded.toLowerCase().trim();
      }
    } catch { /* continuer */ }
  }

  // 2. Entités HTML et obfuscation courante
  const decoded = html
    .replace(/&#64;/g, '@').replace(/&#x40;/gi, '@')
    .replace(/&#46;/g, '.').replace(/&#x2e;/gi, '.')
    .replace(/\s*\[at\]\s*/gi, '@').replace(/\s*\(at\)\s*/gi, '@')
    .replace(/\s*\[dot\]\s*/gi, '.').replace(/\s*\(dot\)\s*/gi, '.');

  const emails = decoded.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g) || [];
  const valid = emails.filter(isValidEmail);
  return valid[0]?.toLowerCase().trim() || null;
}

function extractEmailFromText(text: string): string {
  const labeled = text.match(/EMAIL:\s*([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/i);
  if (labeled && isValidEmail(labeled[1])) return labeled[1].toLowerCase().trim();

  const all = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g) || [];
  const valid = all.filter(isValidEmail);
  return valid[0]?.toLowerCase().trim() || '';
}

// ── Appel REST Gemini avec Google Search Grounding ────────────────────────────
async function geminiGrounding(apiKey: string, prompt: string): Promise<string> {
  // Essai 1 : gemini-2.5-flash avec google_search
  const url1 = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const body1 = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    tools: [{ google_search: {} }],
  };

  let res = await fetch(url1, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body1),
  });

  if (!res.ok) {
    // Essai 2 : gemini-1.5-flash avec google_search_retrieval (fallback)
    const url2 = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const body2 = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      tools: [{ google_search_retrieval: {} }],
    };
    res = await fetch(url2, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body2),
    });
    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`Grounding indisponible (${res.status}): ${err.slice(0, 150)}`);
    }
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ── Scraping email depuis le site web de l'entreprise ─────────────────────────
async function scrapeEmailFromWebsite(websiteUrl: string): Promise<string | null> {
  const urlsToTry: string[] = [];
  try {
    const base = new URL(websiteUrl);
    urlsToTry.push(
      websiteUrl,
      `${base.origin}/contact`,
      `${base.origin}/nous-contacter`,
      `${base.origin}/contactez-nous`,
      `${base.origin}/contact.html`,
      `${base.origin}/contact.php`,
    );
  } catch { return null; }

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'fr-FR,fr;q=0.9',
  };

  for (const url of urlsToTry) {
    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(url, { signal: controller.signal, headers });
      clearTimeout(tid);
      if (!res.ok) continue;
      const email = extractEmailFromHtml(await res.text());
      if (email) return email;
    } catch { continue; }
  }
  return null;
}

// ── Scraping email depuis Pages Jaunes ────────────────────────────────────────
async function scrapeEmailFromPagesJaunes(businessName: string, city: string): Promise<string | null> {
  const urls = [
    `https://www.pagesjaunes.fr/recherche?quoiqui=${encodeURIComponent(businessName)}&ou=${encodeURIComponent(city)}`,
    `https://www.pagesjaunes.fr/pagesblanches/recherche?quoiqui=${encodeURIComponent(businessName)}&ou=${encodeURIComponent(city)}`,
  ];

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8',
    'Referer': 'https://www.pagesjaunes.fr/',
  };

  for (const url of urls) {
    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 7000);
      const res = await fetch(url, { signal: controller.signal, headers });
      clearTimeout(tid);
      if (!res.ok) continue;
      const email = extractEmailFromHtml(await res.text());
      if (email) return email;
    } catch { continue; }
  }
  return null;
}

// ── Dirigeant via API officielle France (gratuite, ~90% fiable) ───────────────
async function fetchDirigeantFromGouvApi(businessName: string, city: string): Promise<string | null> {
  const q = encodeURIComponent(`${businessName} ${city}`);
  const url = `https://recherche-entreprises.api.gouv.fr/search?q=${q}&page=1&per_page=5`;

  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json', 'User-Agent': 'prospection-app/1.0' },
    });
    clearTimeout(tid);
    if (!res.ok) return null;

    const data = await res.json();
    const results: any[] = data.results || [];
    if (results.length === 0) return null;

    // Trouver la meilleure correspondance par nom
    const nameFirst = businessName.toLowerCase().split(' ')[0];
    const best = results.find(r =>
      (r.nom_complet || '').toLowerCase().includes(nameFirst)
    ) || results[0];

    if (!best) return null;

    const dirigeants: any[] = best.dirigeants || [];
    if (dirigeants.length === 0) return null;

    // Priorité par qualité
    const priority = ['gérant', 'président', 'directeur général', 'associé gérant', 'directeur'];
    const top = dirigeants.find(d =>
      priority.some(p => (d.qualite || '').toLowerCase().includes(p))
    ) || dirigeants[0];

    if (!top) return null;

    // Formater le nom (l'API retourne souvent en MAJUSCULES)
    const capitalize = (s: string) =>
      s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';

    const rawPrenom = top.prenoms || top.prenom || '';
    const prenom = rawPrenom.split(' ').map(capitalize).join(' ').trim();
    const nom = capitalize(top.nom || '');
    const qualite = top.qualite
      ? top.qualite.charAt(0).toUpperCase() + top.qualite.slice(1).toLowerCase()
      : '';

    const fullName = [prenom, nom].filter(Boolean).join(' ');
    return fullName ? `${fullName}${qualite ? ` (${qualite})` : ''}` : null;

  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles').select('plan').eq('id', user.id).single();

  if (!profile || profile.plan !== 'ultra') {
    return NextResponse.json({ error: 'Fonctionnalité réservée au plan Ultra' }, { status: 403 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Gemini API non configurée' }, { status: 500 });

  let body: RequestBody;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 }); }

  const { type, businessName, city, activite, rating, userRatingCount, address, hasWebsite, websiteUrl } = body;

  if (!type || !businessName || !city) {
    return NextResponse.json({ error: 'type, businessName et city requis' }, { status: 400 });
  }

  const cacheKey = `${type}:${businessName.toLowerCase()}:${city.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) return NextResponse.json(cached.data);

  const genAI = new GoogleGenerativeAI(apiKey);
  let result: AiEnrichmentResult = { type, content: '' };

  const saveCache = (r: AiEnrichmentResult) => {
    if (cache.size > 500) cache.delete(cache.keys().next().value!);
    cache.set(cacheKey, { data: r, timestamp: Date.now() });
  };

  try {

    // ── PROFILE ────────────────────────────────────────────────────────────────
    if (type === 'profile') {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const response = await model.generateContent(`Tu es un expert en analyse d'entreprises. Génère une fiche de présentation concise et professionnelle.

DONNÉES :
- Nom : ${businessName}
- Ville : ${city}
- Activité : ${activite || 'non précisée'}
- Note Google : ${rating ? `${rating}/5 (${userRatingCount || 0} avis)` : 'non disponible'}
- Adresse : ${address || city}

INSTRUCTIONS : 3-4 phrases max, présente l'activité principale, intègre la note Google, ton factuel, sans accroche marketing.`);
      result = { type: 'profile', content: response.response.text().trim() };
    }

    // ── EMAIL ──────────────────────────────────────────────────────────────────
    else if (type === 'email') {
      let foundEmail: string | null = null;

      // Étape 1 : scraping du site web (si disponible) — rapide & fiable
      if (websiteUrl && !foundEmail) {
        foundEmail = await scrapeEmailFromWebsite(websiteUrl);
      }

      // Étape 2 : scraping Pages Jaunes
      if (!foundEmail) {
        foundEmail = await scrapeEmailFromPagesJaunes(businessName, city);
      }

      // Étape 3 : Gemini grounding (fallback)
      if (!foundEmail) {
        const prompt = `Cherche l'adresse email professionnelle de "${businessName}" à ${city}, France.

Sources à consulter dans l'ordre :
1. pagesjaunes.fr
2. societe.com
3. facebook.com
4. ${businessName} ${city} site:*.fr "email" OR "contact" OR "mail"

RÈGLE ABSOLUE :
- Email trouvé → réponds UNIQUEMENT : EMAIL: adresse@domaine.fr
- Rien trouvé → réponds UNIQUEMENT : EMAIL: non trouvé
Aucune explication.`;

        try {
          const rawText = await geminiGrounding(apiKey, prompt);
          const extracted = extractEmailFromText(rawText);
          if (extracted) foundEmail = extracted;
        } catch {
          // grounding indisponible, on retourne non trouvé
        }
      }

      result = { type: 'email', content: foundEmail || 'non trouvé' };
    }

    // ── MAIL DE PROSPECTION ────────────────────────────────────────────────────
    else if (type === 'mail') {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const prompt = hasWebsite
        ? `Tu es un expert en copywriting B2B. Écris un email de prospection pour proposer une refonte de site web.

ENTREPRISE :
- Nom : ${businessName}
- Métier : ${activite || 'professionnel'} à ${city}
- Note Google : ${rating ? `${rating}/5 (${userRatingCount || 0} avis)` : 'non disponible'}
- Site actuel : ${websiteUrl || 'oui'}

STRUCTURE (méthode PAS) :
1. Objet : court, curiosité sur l'amélioration — commence par "Objet : "
2. Ligne vide
3. Accroche : ce qu'un site mal optimisé coûte en clients perdus
4. Agitation : problèmes d'un site vieillissant (référencement, mobile, lenteur)
5. Solution : ce qu'une refonte changerait concrètement
6. Preuve : sa note Google comme levier${rating ? ` (${rating}/5 mais site non optimisé)` : ''}
7. CTA : UNE seule question OUI/NON

RÈGLES : phrases courtes, parle d'argent/clients perdus, zéro formule creuse, max 120 mots corps, ton direct.`
        : `Tu es un expert en copywriting B2B. Écris un email de prospection pour vendre un site web vitrine à un artisan sans site.

ENTREPRISE :
- Nom : ${businessName}
- Métier : ${activite || 'artisan'} à ${city}
- Note Google : ${rating ? `${rating}/5 (${userRatingCount || 0} avis)` : 'non disponible'}

STRUCTURE (méthode PAS) :
1. Objet : court, urgent/personnel — commence par "Objet : "
2. Ligne vide
3. Accroche : stat choc sur ce que coûte l'absence de site
4. Agitation : ce qu'il perd MAINTENANT (clients chez concurrents avec site)
5. Solution : ce qu'un site vitrine change concrètement
6. Preuve : sa note Google comme levier${rating ? ` (${rating}/5 mais introuvable en ligne)` : ''}
7. CTA : UNE seule question OUI/NON

RÈGLES : phrases courtes, parle d'argent/clients perdus, zéro formule creuse, max 120 mots corps, ton direct.`;

      const response = await model.generateContent(prompt);
      result = { type: 'mail', content: response.response.text().trim() };
    }

    // ── DIRIGEANT ──────────────────────────────────────────────────────────────
    else if (type === 'dirigeant') {
      let foundDirigeant: string | null = null;

      // Étape 1 : API officielle France (gratuite, couvre toutes les entreprises enregistrées)
      foundDirigeant = await fetchDirigeantFromGouvApi(businessName, city);

      // Étape 2 : Gemini grounding si API gouvernementale ne retourne rien
      if (!foundDirigeant) {
        const prompt = `Cherche le dirigeant (gérant, président ou directeur général) de "${businessName}" à ${city}, France.

Sources : societe.com, infogreffe.fr, pappers.fr, linkedin.com

RÈGLE ABSOLUE :
- Trouvé → réponds UNIQUEMENT : DIRIGEANT: Prénom Nom (Qualité)
- Non trouvé → réponds UNIQUEMENT : DIRIGEANT: non trouvé
Aucune explication.`;

        try {
          const rawText = await geminiGrounding(apiKey, prompt);
          const match = rawText.match(/DIRIGEANT:\s*(.+)/i);
          const found = match?.[1]?.trim() || '';
          if (found && !found.toLowerCase().includes('non trouvé') && found.length < 80) {
            foundDirigeant = found;
          }
        } catch {
          // grounding indisponible
        }
      }

      result = { type: 'dirigeant', content: foundDirigeant || 'non trouvé' };
    }

    else {
      return NextResponse.json({ error: 'type invalide' }, { status: 400 });
    }

    saveCache(result);
    return NextResponse.json(result);

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`ai-enrichment [${type}] error:`, msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
