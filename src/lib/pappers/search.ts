/**
 * Client de recherche d'entreprises via l'API Pappers v2.
 * https://api.pappers.fr/v2/recherche
 *
 * Avantages vs gouv.fr / INSEE :
 * - Filtre date_creation_min/max qui marche VRAIMENT
 * - Filtre code_naf precis
 * - Donnees enrichies (dirigeant, forme juridique en clair, NAF label, etc.)
 * - 100 resultats par page (au lieu de 25)
 *
 * Cout : 1 credit Pappers par recherche.
 */

export interface PappersSearchFilters {
  /** Recherche texte libre (nom, dirigeant, secteur...) */
  q?: string;
  /** Code postal (5 chiffres) */
  codePostal?: string;
  /** Code INSEE commune (5 chiffres) */
  codeCommune?: string;
  /** Departement (2 chiffres) */
  departement?: string;
  /** Date creation min (YYYY-MM-DD) — LE filtre clef */
  dateCreationMin?: string;
  dateCreationMax?: string;
  /** Code NAF/APE (ex: '10.71C' pour boulangerie) */
  codeNaf?: string;
  /** Forme juridique (ex: 'SAS', 'SARL', 'Micro-entrepreneur') */
  formeJuridique?: string;
  /** Page (defaut 1) */
  page?: number;
  /** Resultats par page (defaut 100, max 100) */
  perPage?: number;
}

export interface PappersSearchResult {
  siret: string;
  siren: string;
  name: string;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  nafCode: string | null;
  nafLabel: string | null;
  creationDate: string | null;
  legalForm: string | null;
  legalFormCode: string | null;
  employeesRange: string | null;
  director: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface RawPappersResult {
  siren: string;
  nom_entreprise?: string;
  denomination?: string;
  forme_juridique?: string;
  date_creation?: string;
  tranche_effectif?: string;
  siege?: {
    siret?: string;
    adresse_ligne_1?: string;
    adresse_ligne_2?: string;
    code_postal?: string;
    ville?: string;
    code_commune?: string;
    code_naf?: string;
    libelle_code_naf?: string;
    latitude?: number;
    longitude?: number;
  };
  representants?: Array<{
    nom_complet?: string;
    nom?: string;
    prenom?: string;
    prenoms?: string;
    qualite?: string;
  }>;
}

function formatDirigeant(reps: RawPappersResult['representants']): string | null {
  if (!reps || reps.length === 0) return null;
  const priority = ['gérant', 'président', 'directeur général', 'associé gérant'];
  const rep =
    reps.find((r) =>
      priority.some((p) => (r.qualite || '').toLowerCase().includes(p))
    ) || reps[0];
  if (!rep) return null;

  const prenom = rep.prenom || (rep.prenoms ? rep.prenoms.split(',')[0].trim() : '');
  const nom = rep.nom_complet || rep.nom || '';
  const full = `${prenom} ${nom}`.trim();
  if (!full) return null;
  return rep.qualite ? `${full} (${rep.qualite})` : full;
}

function normalizeResult(raw: RawPappersResult): PappersSearchResult {
  const siege = raw.siege || {};
  const address = [siege.adresse_ligne_1, siege.adresse_ligne_2].filter(Boolean).join(', ');
  return {
    siret: siege.siret || `${raw.siren}00000`,
    siren: raw.siren,
    name: raw.nom_entreprise || raw.denomination || 'Inconnu',
    address: address || null,
    postalCode: siege.code_postal || null,
    city: siege.ville || null,
    nafCode: siege.code_naf || null,
    nafLabel: siege.libelle_code_naf || null,
    creationDate: raw.date_creation || null,
    legalForm: raw.forme_juridique || null,
    legalFormCode: null, // Pappers renvoie le libelle direct, pas de code
    employeesRange: raw.tranche_effectif || null,
    director: formatDirigeant(raw.representants),
    latitude: siege.latitude || null,
    longitude: siege.longitude || null,
  };
}

/**
 * Resout un nom de ville en code INSEE de commune via geo.api.gouv.fr.
 */
async function resolveCityToCommuneCode(cityName: string): Promise<string | null> {
  try {
    const url = `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(cityName)}&fields=code,nom,population&limit=5&boost=population`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const communes = (await res.json()) as Array<{ code: string; population?: number }>;
    return communes[0]?.code || null;
  } catch {
    return null;
  }
}

/**
 * Cherche des entreprises via Pappers selon les filtres fournis.
 * Couts 1 credit Pappers par appel (peu importe le nombre de resultats).
 */
export async function searchPappersCompanies(filters: PappersSearchFilters): Promise<{
  results: PappersSearchResult[];
  total: number;
  debug: { url: string; totalApi: number; resolvedCity?: string };
}> {
  const apiKey = process.env.PAPPERS_API_KEY;
  if (!apiKey) {
    throw new Error('PAPPERS_API_KEY manquante dans les env vars Vercel');
  }

  const params = new URLSearchParams();
  params.set('api_token', apiKey);
  if (filters.q) params.set('q', filters.q);
  if (filters.codePostal) params.set('code_postal', filters.codePostal);
  if (filters.codeCommune) params.set('code_commune', filters.codeCommune);
  if (filters.departement) params.set('departement', filters.departement.padStart(2, '0'));
  if (filters.dateCreationMin) params.set('date_creation_min', filters.dateCreationMin);
  if (filters.dateCreationMax) params.set('date_creation_max', filters.dateCreationMax);
  if (filters.codeNaf) params.set('code_naf', filters.codeNaf);
  if (filters.formeJuridique) params.set('forme_juridique', filters.formeJuridique);
  params.set('entreprise_cessee', 'false');
  params.set('par_page', String(filters.perPage || 100));
  params.set('page', String(filters.page || 1));

  const url = `https://api.pappers.fr/v2/recherche?${params.toString()}`;
  // URL sans api_token pour les logs (securite)
  const urlForLog = url.replace(/api_token=[^&]+/, 'api_token=***');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Pappers search error ${response.status}: ${text.slice(0, 200)}`);
    }
    const data = await response.json();
    const results = (data.resultats || []).map(normalizeResult);

    return {
      results,
      total: data.total || results.length,
      debug: { url: urlForLog, totalApi: data.total || 0 },
    };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Helper qui combine resolution ville + search Pappers.
 */
export async function searchPappersWithCity(args: {
  q?: string;
  city?: string; // nom de ville, CP ou departement
  creationMaxMonths?: number;
  codeNaf?: string;
  formeJuridique?: string;
  perPage?: number;
}): Promise<Awaited<ReturnType<typeof searchPappersCompanies>>> {
  const filters: PappersSearchFilters = {
    q: args.q,
    codeNaf: args.codeNaf,
    formeJuridique: args.formeJuridique,
    perPage: args.perPage,
  };

  // Date min depuis creationMaxMonths (X mois en arriere)
  if (args.creationMaxMonths) {
    const d = new Date();
    d.setMonth(d.getMonth() - args.creationMaxMonths);
    filters.dateCreationMin = d.toISOString().slice(0, 10);
  }

  let resolvedCity: string | undefined;
  if (args.city) {
    const loc = args.city.trim();
    if (/^\d{5}$/.test(loc)) {
      filters.codePostal = loc;
      resolvedCity = `CP ${loc}`;
    } else if (/^\d{2,3}$/.test(loc)) {
      filters.departement = loc;
      resolvedCity = `Dpt ${loc}`;
    } else {
      const code = await resolveCityToCommuneCode(loc);
      if (code) {
        filters.codeCommune = code;
        resolvedCity = `${loc} → ${code}`;
      } else {
        // Fallback : on injecte le nom de ville dans q
        filters.q = `${args.q || ''} ${loc}`.trim();
        resolvedCity = `${loc} (non resolu)`;
      }
    }
  }

  const result = await searchPappersCompanies(filters);
  return {
    ...result,
    debug: { ...result.debug, resolvedCity },
  };
}
