import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

// Cache en mémoire (TTL 30 min)
const cache = new Map<string, { data: AiEnrichmentResult; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000;

interface AiEnrichmentResult {
  type: string;
  content: string;
}

interface RequestBody {
  type: 'profile' | 'email' | 'mail';
  businessName: string;
  city: string;
  activite?: string;
  rating?: number;
  userRatingCount?: number;
  dirigeant?: string;
  formeJuridique?: string;
  dateCreation?: string;
  libelleNaf?: string;
  address?: string;
  phone?: string;
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

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Anthropic API non configurée' }, { status: 500 });
  }

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
  }

  const { type, businessName, city, activite, rating, userRatingCount, dirigeant, formeJuridique, dateCreation, libelleNaf, address, phone } = body;

  if (!type || !businessName || !city) {
    return NextResponse.json({ error: 'type, businessName et city requis' }, { status: 400 });
  }

  // Vérifier le cache
  const cacheKey = `${type}:${businessName.toLowerCase()}:${city.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  const client = new Anthropic({ apiKey });

  try {
    let result: AiEnrichmentResult;

    // ── TYPE: PROFILE ──────────────────────────────────────────────────────────
    if (type === 'profile') {
      const prompt = `Tu es un expert en analyse d'entreprises. Génère une fiche de présentation concise et professionnelle pour cette entreprise.

DONNÉES :
- Nom : ${businessName}
- Ville : ${city}
- Activité : ${activite || libelleNaf || 'non précisée'}
- Dirigeant : ${dirigeant || 'inconnu'}
- Forme juridique : ${formeJuridique || 'inconnue'}
- Créée le : ${dateCreation || 'inconnue'}
- Note Google : ${rating ? `${rating}/5 (${userRatingCount || 0} avis)` : 'non disponible'}
- Adresse : ${address || city}

INSTRUCTIONS :
- Rédige 3 à 4 phrases maximum
- Commence par présenter l'activité principale
- Mentionne le dirigeant si connu
- Intègre la note Google comme indicateur de réputation si disponible
- Ton professionnel et factuel
- PAS de formule creuse, PAS de phrase d'accroche marketing
- Réponds uniquement avec le texte de la fiche, sans titre ni préambule`;

      const response = await client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
      result = { type: 'profile', content: text.trim() };
    }

    // ── TYPE: EMAIL ────────────────────────────────────────────────────────────
    else if (type === 'email') {
      const response = await client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 500,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tools: [{ type: 'web_search_20260209', name: 'web_search' }] as any,
        messages: [
          {
            role: 'user',
            content: `Cherche l'adresse email professionnelle de l'entreprise "${businessName}" située à ${city}, France.

Stratégie de recherche :
1. Cherche sur Pages Jaunes : "${businessName} ${city}"
2. Si pas trouvé, essaie : "${businessName} ${city} email contact"
3. Si pas trouvé, essaie sur Facebook ou Google Business

RÈGLES STRICTES :
- Si tu trouves un email, réponds UNIQUEMENT avec : EMAIL: adresse@email.com
- Si tu ne trouves pas d'email, réponds UNIQUEMENT avec : EMAIL: non trouvé
- Ne donne aucune explication, aucun autre texte
- L'email doit être une vraie adresse professionnelle (pas noreply, pas admin@)`,
          },
        ],
      });

      // Extraire l'email de la réponse finale
      const lastMessage = response.content.find(b => b.type === 'text');
      const rawText = lastMessage?.type === 'text' ? lastMessage.text : '';

      const emailMatch = rawText.match(/EMAIL:\s*([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/i);
      const notFound = rawText.toLowerCase().includes('non trouvé') || rawText.toLowerCase().includes('not found');

      let foundEmail = '';
      if (emailMatch) {
        foundEmail = emailMatch[1].toLowerCase().trim();
      } else if (!notFound) {
        // Chercher un email directement dans le texte
        const directMatch = rawText.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
        if (directMatch) foundEmail = directMatch[0].toLowerCase().trim();
      }

      result = { type: 'email', content: foundEmail || 'non trouvé' };
    }

    // ── TYPE: MAIL ─────────────────────────────────────────────────────────────
    else if (type === 'mail') {
      const prenom = dirigeant ? dirigeant.split(' ')[0] : null;

      const prompt = `Tu es un expert en copywriting et prospection B2B. Écris un email de prospection ultra-persuasif pour vendre un site web vitrine à un artisan qui n'en a pas.

ENTREPRISE CIBLÉE :
- Nom entreprise : ${businessName}
${prenom ? `- Prénom dirigeant : ${prenom}` : ''}
- Métier : ${activite || libelleNaf || 'artisan'} à ${city}
- Note Google : ${rating ? `${rating}/5 (${userRatingCount || 0} avis)` : 'non disponible'}
- Site web : aucun

STRUCTURE OBLIGATOIRE (méthode PAS) :
1. Objet (ligne 1) : court, personnel, crée urgence ou curiosité — commence par "Objet : "
2. Séparateur : une ligne vide
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

      const response = await client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
      result = { type: 'mail', content: text.trim() };
    }

    else {
      return NextResponse.json({ error: 'type invalide (profile | email | mail)' }, { status: 400 });
    }

    // Mettre en cache
    if (cache.size > 500) {
      const firstKey = cache.keys().next().value;
      if (firstKey) cache.delete(firstKey);
    }
    cache.set(cacheKey, { data: result, timestamp: Date.now() });

    return NextResponse.json(result);
  } catch (error) {
    console.error('ai-enrichment error:', error);
    return NextResponse.json({ error: 'Erreur lors de la génération IA' }, { status: 500 });
  }
}
