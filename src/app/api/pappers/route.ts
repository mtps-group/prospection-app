import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Cache en mémoire (TTL 30 min)
const cache = new Map<string, { data: PappersResult; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000;

interface PappersResult {
  dirigeant: string | null;
  siret: string | null;
  siren: string | null;
  formeJuridique: string | null;
  dateCreation: string | null;
  trancheEffectif: string | null;
  codeNaf: string | null;
  libelleNaf: string | null;
}

const EMPTY: PappersResult = {
  dirigeant: null, siret: null, siren: null,
  formeJuridique: null, dateCreation: null,
  trancheEffectif: null, codeNaf: null, libelleNaf: null,
};

function extractDirigeant(representants: Record<string, string>[]): string | null {
  if (!representants || representants.length === 0) return null;

  // Priorité : gérant, président, directeur général, puis premier représentant
  const priority = ['gérant', 'président', 'directeur général', 'associé gérant'];
  let rep = representants.find(r =>
    priority.some(p => (r.qualite || '').toLowerCase().includes(p))
  ) || representants[0];

  if (!rep) return null;

  const prenom = rep.prenom ? rep.prenom.charAt(0).toUpperCase() + rep.prenom.slice(1).toLowerCase() : '';
  const nom = rep.nom_complet || rep.nom || '';
  const qualite = rep.qualite || '';

  if (prenom && nom) return `${prenom} ${nom}${qualite ? ` (${qualite})` : ''}`;
  if (nom) return `${nom}${qualite ? ` (${qualite})` : ''}`;
  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const businessName = searchParams.get('name');
  const city = searchParams.get('city');

  if (!businessName) {
    return NextResponse.json({ error: 'name requis' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const apiKey = process.env.PAPPERS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Pappers API non configurée' }, { status: 500 });
  }

  // Cache
  const cacheKey = `${businessName.toLowerCase()}:${(city || '').toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    // ── ÉTAPE 1 : Recherche par nom (+ ville si dispo) ──────────────────────
    const params = new URLSearchParams({
      api_token: apiKey,
      q: businessName,
      page: '1',
      par_page: '3',
    });
    // On passe la ville comme paramètre texte libre, pas comme code postal
    if (city) params.set('q', `${businessName} ${city}`);

    const searchUrl = `https://api.pappers.fr/v2/recherche?${params.toString()}`;
    const searchRes = await fetch(searchUrl, { headers: { Accept: 'application/json' } });

    if (!searchRes.ok) {
      const errBody = await searchRes.text();
      console.error('Pappers search error:', searchRes.status, errBody);
      console.error('API key used (first 6 chars):', apiKey?.slice(0, 6));
      console.error('URL called:', searchUrl.replace(apiKey, 'HIDDEN'));
      return NextResponse.json(EMPTY);
    }

    const searchData = await searchRes.json();

    // DEBUG TEMPORAIRE
    console.log('Pappers search URL:', searchUrl);
    console.log('Pappers raw response:', JSON.stringify(searchData).slice(0, 2000));

    if (!searchData.resultats || searchData.resultats.length === 0) {
      cache.set(cacheKey, { data: EMPTY, timestamp: Date.now() });
      return NextResponse.json({ ...EMPTY, _debug: { totalResultats: searchData.total, query: params.get('q') } });
    }

    const entreprise = searchData.resultats[0];
    const siren = entreprise.siren;

    // DEBUG: retourner les clés disponibles
    console.log('Entreprise keys:', Object.keys(entreprise));
    console.log('Entreprise representants:', JSON.stringify(entreprise.representants));

    // ── ÉTAPE 2 : Détail par SIREN pour avoir les représentants ────────────
    let dirigeant: string | null = null;

    if (siren) {
      const detailUrl = `https://api.pappers.fr/v2/entreprise?api_token=${apiKey}&siren=${siren}&representants=true`;
      const detailRes = await fetch(detailUrl, { headers: { Accept: 'application/json' } });

      if (detailRes.ok) {
        const detailData = await detailRes.json();
        console.log('Detail keys:', Object.keys(detailData));
        console.log('Detail representants:', JSON.stringify(detailData.representants?.slice(0,2)));
        console.log('Detail dirigeants:', JSON.stringify(detailData.dirigeants?.slice(0,2)));
        const reps = detailData.representants || detailData.dirigeants || [];
        dirigeant = extractDirigeant(reps);

        // Compléter avec les infos du détail si disponibles
        if (!dirigeant && detailData.beneficiaires_effectifs?.length > 0) {
          const b = detailData.beneficiaires_effectifs[0];
          if (b.prenom && b.nom) dirigeant = `${b.prenom} ${b.nom}`;
        }
      }
    }

    // Fallback : essayer representants depuis la recherche
    if (!dirigeant && entreprise.representants?.length > 0) {
      dirigeant = extractDirigeant(entreprise.representants);
    }

    const result: PappersResult = {
      dirigeant,
      siret: entreprise.siege?.siret || null,
      siren: siren || null,
      formeJuridique: entreprise.forme_juridique || null,
      dateCreation: entreprise.date_creation || null,
      trancheEffectif: entreprise.tranche_effectif || null,
      codeNaf: entreprise.siege?.code_naf || null,
      libelleNaf: entreprise.siege?.libelle_code_naf || null,
    };

    if (cache.size > 500) {
      const firstKey = cache.keys().next().value;
      if (firstKey) cache.delete(firstKey);
    }
    cache.set(cacheKey, { data: result, timestamp: Date.now() });

    console.log('Final result:', JSON.stringify(result));
    return NextResponse.json(result);
  } catch (error) {
    console.error('Pappers error:', error);
    return NextResponse.json(EMPTY);
  }
}
