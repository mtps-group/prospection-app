import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Cache en mémoire (TTL 30 min — les données de dirigeant changent rarement)
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

  // Vérifier le cache
  const cacheKey = `${businessName.toLowerCase()}:${(city || '').toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    // Rechercher l'entreprise par nom + ville
    const query = encodeURIComponent(businessName);
    const cityParam = city ? `&code_postal=${encodeURIComponent(city)}` : '';
    const url = `https://api.pappers.fr/v2/recherche?api_token=${apiKey}&q=${query}${cityParam}&page=1&par_page=1`;

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      console.error('Pappers API error:', response.status, await response.text());
      return NextResponse.json({ dirigeant: null });
    }

    const data = await response.json();

    if (!data.resultats || data.resultats.length === 0) {
      const result: PappersResult = {
        dirigeant: null, siret: null, siren: null,
        formeJuridique: null, dateCreation: null,
        trancheEffectif: null, codeNaf: null, libelleNaf: null,
      };
      cache.set(cacheKey, { data: result, timestamp: Date.now() });
      return NextResponse.json(result);
    }

    const entreprise = data.resultats[0];

    // Extraire le dirigeant principal (le premier représentant)
    let dirigeant: string | null = null;
    if (entreprise.representants && entreprise.representants.length > 0) {
      const rep = entreprise.representants[0];
      if (rep.prenom && rep.nom) {
        dirigeant = `${rep.prenom} ${rep.nom}`;
        if (rep.qualite) {
          dirigeant += ` (${rep.qualite})`;
        }
      } else if (rep.nom) {
        dirigeant = rep.nom;
        if (rep.qualite) {
          dirigeant += ` (${rep.qualite})`;
        }
      }
    }

    const result: PappersResult = {
      dirigeant,
      siret: entreprise.siege?.siret || null,
      siren: entreprise.siren || null,
      formeJuridique: entreprise.forme_juridique || null,
      dateCreation: entreprise.date_creation || null,
      trancheEffectif: entreprise.tranche_effectif || null,
      codeNaf: entreprise.siege?.code_naf || null,
      libelleNaf: entreprise.siege?.libelle_code_naf || null,
    };

    // Mettre en cache
    if (cache.size > 500) {
      const firstKey = cache.keys().next().value;
      if (firstKey) cache.delete(firstKey);
    }
    cache.set(cacheKey, { data: result, timestamp: Date.now() });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Pappers error:', error);
    return NextResponse.json({ dirigeant: null });
  }
}
