import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 60; // secondes (Vercel Pro requis au-delà de 10s)

// Cache en mémoire (TTL 30 min)
const cache = new Map<string, { data: AiEnrichmentResult; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000;

const EMAIL_BLACKLIST = [
  'noreply', 'no-reply', 'donotreply', 'example', 'sentry',
  'w3.org', 'schema.org', 'googleapis', 'privacy', 'dpo@',
  'rgpd@', 'webmaster@', '.png', '.jpg', '.svg', '.css', '.js',
  'font', 'icon', 'image', 'bootstrap', 'jquery',
];

interface AiEnrichmentResult {
  type: string;
  content: string;
}

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
  if (!email.includes('.')) return false;
  if (email.length > 100) return false;
  return true;
}

function extractEmailFromText(text: string): string {
  const labeled = text.match(/EMAIL:\s*([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/i);
  if (labeled && isValidEmail(labeled[1])) return labeled[1].toLowerCase().trim();

  const all = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g) || [];
  const valid = all.filter(isValidEmail);
  if (valid.length > 0) return valid[0].toLowerCase().trim();

  return '';
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
  } catch {
    return null;
  }

  for (const url of urlsToTry) {
    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        },
      });
      clearTimeout(tid);
      if (!res.ok) continue;

      const html = await res.text();
      // Décoder les entités HTML courantes pour les emails obfusqués
      const decoded = html
        .replace(/&#64;/g, '@')
        .replace(/&#x40;/gi, '@')
        .replace(/&amp;/g, '&')
        .replace(/&#46;/g, '.')
        .replace(/\[at\]/gi, '@')
        .replace(/\(at\)/gi, '@')
        .replace(/\s*\[\s*at\s*\]\s*/gi, '@')
        .replace(/\s*\(\s*at\s*\)\s*/gi, '@');

      const emails = decoded.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g) || [];
      const valid = emails.filter(isValidEmail);
      if (valid.length > 0) return valid[0].toLowerCase().trim();
    } catch {
      continue;
    }
  }
  return null;
}

// ── Appel REST Gemini avec Google Search Grounding ────────────────────────────
async function geminiGrounding(apiKey: string, prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      tools: [{ google_search: {} }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    // Essayer avec gemini-1.5-flash + googleSearchRetrieval comme fallback
    const url2 = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const res2 = await fetch(url2, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        tools: [{ google_search_retrieval: {} }],
      }),
    });
    if (!res2.ok) {
      const errText2 = await res2.text().catch(() => '');
      throw new Error(`Grounding indisponible (${res.status}: ${errText.slice(0, 100)} / ${res2.status}: ${errText2.slice(0, 100)})`);
    }
    const data2 = await res2.json();
    return data2.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export async function POST(request: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  // Plan Ultra uniquement
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single();

  if (!profile || profile.plan !== 'ultra') {
    return NextResponse.json({ error: 'Fonctionnalité réservée au plan Ultra' }, { status: 403 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Gemini API non configurée' }, { status: 500 });
  }

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
  }

  const { type, businessName, city, activite, rating, userRatingCount, address, hasWebsite, websiteUrl } = body;

  if (!type || !businessName || !city) {
    return NextResponse.json({ error: 'type, businessName et city requis' }, { status: 400 });
  }

  // Vérifier le cache
  const cacheKey = `${type}:${businessName.toLowerCase()}:${city.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  let result: AiEnrichmentResult = { type, content: '' };

  try {

    // ── TYPE: PROFILE ──────────────────────────────────────────────────────────
    if (type === 'profile') {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const prompt = `Tu es un expert en analyse d'entreprises. Génère une fiche de présentation concise et professionnelle pour cette entreprise.

DONNÉES :
- Nom : ${businessName}
- Ville : ${city}
- Activité : ${activite || 'non précisée'}
- Note Google : ${rating ? `${rating}/5 (${userRatingCount || 0} avis)` : 'non disponible'}
- Adresse : ${address || city}

INSTRUCTIONS :
- Rédige 3 à 4 phrases maximum
- Commence par présenter l'activité principale
- Intègre la note Google comme indicateur de réputation si disponible
- Ton professionnel et factuel
- PAS de formule creuse, PAS de phrase d'accroche marketing
- Réponds uniquement avec le texte de la fiche, sans titre ni préambule`;

      const response = await model.generateContent(prompt);
      result = { type: 'profile', content: response.response.text().trim() };
    }

    // ── TYPE: EMAIL ────────────────────────────────────────────────────────────
    else if (type === 'email') {
      // Étape 1 : scraping direct du site si disponible (rapide + fiable)
      if (websiteUrl) {
        const scraped = await scrapeEmailFromWebsite(websiteUrl);
        if (scraped) {
          result = { type: 'email', content: scraped };
          // Mettre en cache et retourner immédiatement
          if (cache.size > 500) cache.delete(cache.keys().next().value!);
          cache.set(cacheKey, { data: result, timestamp: Date.now() });
          return NextResponse.json(result);
        }
      }

      // Étape 2 : Gemini grounding via REST
      const emailPrompt = `Cherche l'adresse email professionnelle de l'entreprise "${businessName}" à ${city}, France.

Stratégie :
1. Recherche sur pagesjaunes.fr : "${businessName} ${city}"
2. Recherche directe : "${businessName} ${city} email contact"
3. Recherche sur societe.com ou annuaires pro

RÈGLES STRICTES :
- Si tu trouves un email : réponds UNIQUEMENT avec la ligne "EMAIL: adresse@domaine.fr"
- Si tu ne trouves rien de certain : réponds UNIQUEMENT "EMAIL: non trouvé"
- Zéro explication, zéro autre texte`;

      const rawText = await geminiGrounding(apiKey, emailPrompt);
      const foundEmail = extractEmailFromText(rawText);
      result = { type: 'email', content: foundEmail || 'non trouvé' };
    }

    // ── TYPE: MAIL ─────────────────────────────────────────────────────────────
    else if (type === 'mail') {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const prompt = hasWebsite
        ? `Tu es un expert en copywriting et prospection B2B. Écris un email de prospection ultra-persuasif pour proposer une refonte ou amélioration du site web existant d'un professionnel.

ENTREPRISE CIBLÉE :
- Nom entreprise : ${businessName}
- Métier : ${activite || 'professionnel'} à ${city}
- Note Google : ${rating ? `${rating}/5 (${userRatingCount || 0} avis)` : 'non disponible'}
- Site web actuel : ${websiteUrl || 'oui, existe'}

STRUCTURE OBLIGATOIRE (méthode PAS) :
1. Objet (ligne 1) : court, crée curiosité sur l'amélioration possible — commence par "Objet : "
2. Ligne vide
3. Corps du mail :
   - Accroche : ce qu'un site mal optimisé coûte en clients perdus
   - Agitation : les vrais problèmes d'un site vieillissant ou non optimisé (pas de référencement, pas mobile, lent)
   - Solution : ce qu'une refonte moderne changerait concrètement pour lui
   - Preuve : sa note Google comme levier${rating ? ` ("${rating}/5 mais site non optimisé")` : ''}
   - CTA : UNE seule question fermée (réponse OUI/NON)

RÈGLES STRICTES :
- Phrases très courtes (style SMS professionnel)
- Parler uniquement d'argent et de clients perdus, JAMAIS de "fonctionnalités"
- Zéro formule creuse ("j'espère que vous allez bien", "je me permets de...")
- Corps MAX 120 mots
- Terminer par une vraie question qui appelle OUI ou NON
- Ton direct, presque agressif commercialement, mais respectueux`
        : `Tu es un expert en copywriting et prospection B2B. Écris un email de prospection ultra-persuasif pour vendre un site web vitrine à un artisan qui n'en a pas.

ENTREPRISE CIBLÉE :
- Nom entreprise : ${businessName}
- Métier : ${activite || 'artisan'} à ${city}
- Note Google : ${rating ? `${rating}/5 (${userRatingCount || 0} avis)` : 'non disponible'}
- Site web : aucun

STRUCTURE OBLIGATOIRE (méthode PAS) :
1. Objet (ligne 1) : court, personnel, crée urgence ou curiosité — commence par "Objet : "
2. Ligne vide
3. Corps du mail :
   - Accroche : stat choc sur ce que coûte l'absence de site web
   - Agitation : ce qu'il perd MAINTENANT (clients chez concurrent avec site)
   - Solution : ce qu'un site vitrine change pour lui concrètement
   - Preuve : sa note Google comme levier${rating ? ` ("${rating}/5 mais introuvable en ligne")` : ''}
   - CTA : UNE seule question fermée (réponse OUI/NON)

RÈGLES STRICTES :
- Phrases très courtes (style SMS professionnel)
- Parler uniquement d'argent et de clients perdus, JAMAIS de "fonctionnalités"
- Zéro formule creuse ("j'espère que vous allez bien", "je me permets de...")
- Corps MAX 120 mots
- Terminer par une vraie question qui appelle OUI ou NON
- Ton direct, presque agressif commercialement, mais respectueux`;

      const response = await model.generateContent(prompt);
      result = { type: 'mail', content: response.response.text().trim() };
    }

    // ── TYPE: DIRIGEANT ────────────────────────────────────────────────────────
    else if (type === 'dirigeant') {
      const dirigeantPrompt = `Cherche le nom du dirigeant (gérant, président ou directeur général) de l'entreprise "${businessName}" à ${city}, France.

Stratégie :
1. societe.com : recherche "${businessName} ${city}"
2. infogreffe.fr : recherche "${businessName} ${city}"
3. pappers.fr : recherche "${businessName} ${city}"

RÈGLES STRICTES :
- Si tu trouves un dirigeant : réponds UNIQUEMENT avec la ligne "DIRIGEANT: Prénom Nom (Gérant)" ou "DIRIGEANT: Prénom Nom (Président)" etc.
- Si tu ne trouves rien de certain : réponds UNIQUEMENT "DIRIGEANT: non trouvé"
- Zéro explication, zéro autre texte`;

      const rawText = await geminiGrounding(apiKey, dirigeantPrompt);

      const match = rawText.match(/DIRIGEANT:\s*(.+)/i);
      const found = match ? match[1].trim() : '';
      const notFound = !found || found.toLowerCase().includes('non trouvé') || found.length > 80;

      result = { type: 'dirigeant', content: notFound ? 'non trouvé' : found };
    }

    else {
      return NextResponse.json({ error: 'type invalide (profile | email | mail | dirigeant)' }, { status: 400 });
    }

    // Mettre en cache
    if (cache.size > 500) cache.delete(cache.keys().next().value!);
    cache.set(cacheKey, { data: result, timestamp: Date.now() });

    return NextResponse.json(result);

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`ai-enrichment [${type}] error:`, msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
