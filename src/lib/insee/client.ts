/**
 * Client pour l'API INSEE SIRENE V3.11
 * https://api.insee.fr/api-sirene/3.11
 *
 * Auth : OAuth2 Client Credentials (gere via cache du token, 1h validite)
 * Filtres : VRAIMENT respectes (contrairement a recherche-entreprises.api.gouv.fr)
 */

// Endpoints (INSEE a migre vers le nouveau portail Gravitee en 2024-2025)
const TOKEN_URL = 'https://auth.insee.net/auth/realms/apim-gravitee/protocol/openid-connect/token';
const SIRENE_API = 'https://api.insee.fr/api-sirene/3.11';

let cachedToken: { value: string; expiresAt: number } | null = null;

/**
 * Recupere le bearer token a utiliser pour l'API SIRENE.
 * 2 modes supportes :
 *  1. INSEE_API_KEY directe (le plus simple) → utilisee telle quelle
 *  2. INSEE_CLIENT_ID + INSEE_CLIENT_SECRET (OAuth Client Credentials) → fetch un token
 */
async function getBearerToken(): Promise<string> {
  // Mode 1 : API key directe (recommande, plus simple)
  const apiKey = process.env.INSEE_API_KEY;
  if (apiKey) return apiKey;

  // Mode 2 : OAuth Client Credentials flow (avec cache 1h)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.value;
  }

  const clientId = process.env.INSEE_CLIENT_ID;
  const clientSecret = process.env.INSEE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Auth INSEE manquante : ajoute INSEE_API_KEY OU (INSEE_CLIENT_ID + INSEE_CLIENT_SECRET) dans les env vars Vercel');
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`INSEE token error ${response.status}: ${text}`);
  }

  const data = await response.json();
  const expiresIn = data.expires_in || 3600;
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + expiresIn * 1000,
  };
  return data.access_token;
}

export interface SireneFilters {
  q?: string;
  communeCode?: string;
  postalCode?: string;
  departmentCode?: string;
  creationMaxMonths?: number;
  nafCode?: string;
  natureJuridique?: string;
  perPage?: number;
}

export interface SireneResult {
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

// Mapping des codes categorie juridique INSEE vers libelles
const LEGAL_FORM_LABELS: Record<string, string> = {
  '1000': 'Entrepreneur individuel',
  '5410': 'SARL unipersonnelle',
  '5485': 'EURL',
  '5499': 'SARL',
  '5599': 'SA',
  '5710': 'SAS',
  '5720': 'SASU',
  '6540': 'SCI',
  '9220': 'Association',
};

// Resolution nom de ville -> code commune INSEE (via geo.api.gouv.fr)
async function resolveCityToCommuneCode(cityName: string): Promise<string | null> {
  try {
    const url = `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(cityName)}&fields=code,nom,population&limit=5&boost=population`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const communes = await res.json() as Array<{ code: string; nom: string; population?: number }>;
    if (!communes || communes.length === 0) return null;
    return communes[0].code;
  } catch {
    return null;
  }
}

interface SireneRawResponse {
  header?: { total: number; debut: number; nombre: number };
  etablissements?: SireneRawEtablissement[];
}

interface SireneRawEtablissement {
  siren: string;
  siret: string;
  etablissementSiege: boolean;
  dateCreationEtablissement?: string | null;
  etatAdministratifEtablissement?: string;
  uniteLegale?: {
    denominationUniteLegale?: string | null;
    denominationUsuelle1UniteLegale?: string | null;
    nomUniteLegale?: string | null;
    prenom1UniteLegale?: string | null;
    sigleUniteLegale?: string | null;
    dateCreationUniteLegale?: string | null;
    categorieJuridiqueUniteLegale?: string | null;
    etatAdministratifUniteLegale?: string | null;
    activitePrincipaleUniteLegale?: string | null;
  };
  adresseEtablissement?: {
    numeroVoieEtablissement?: string | null;
    typeVoieEtablissement?: string | null;
    libelleVoieEtablissement?: string | null;
    codePostalEtablissement?: string | null;
    libelleCommuneEtablissement?: string | null;
    codeCommuneEtablissement?: string | null;
    coordonneeLambertAbscisseEtablissement?: string | null;
    coordonneeLambertOrdonneeEtablissement?: string | null;
  };
  periodesEtablissement?: Array<{
    activitePrincipaleEtablissement?: string | null;
    denominationUsuelleEtablissement?: string | null;
  }>;
}

function formatAddress(adr: SireneRawEtablissement['adresseEtablissement']): string | null {
  if (!adr) return null;
  const parts = [
    adr.numeroVoieEtablissement,
    adr.typeVoieEtablissement,
    adr.libelleVoieEtablissement,
  ].filter(Boolean);
  const street = parts.join(' ').trim();
  const city = [adr.codePostalEtablissement, adr.libelleCommuneEtablissement].filter(Boolean).join(' ');
  return [street, city].filter(Boolean).join(', ') || null;
}

function extractName(e: SireneRawEtablissement): string {
  const u = e.uniteLegale;
  if (!u) return 'Inconnu';
  // Denomination en priorite (boites), sinon nom + prenom (auto-entrepreneurs)
  return (
    u.denominationUsuelle1UniteLegale ||
    u.denominationUniteLegale ||
    [u.prenom1UniteLegale, u.nomUniteLegale].filter(Boolean).join(' ') ||
    u.sigleUniteLegale ||
    'Inconnu'
  );
}

function normalize(e: SireneRawEtablissement): SireneResult {
  const u = e.uniteLegale || {};
  const adr = e.adresseEtablissement || {};
  const lastPeriode = e.periodesEtablissement?.[0];

  const legalFormCode = u.categorieJuridiqueUniteLegale || null;

  return {
    siret: e.siret,
    siren: e.siren,
    name: extractName(e),
    address: formatAddress(adr),
    postalCode: adr.codePostalEtablissement || null,
    city: adr.libelleCommuneEtablissement || null,
    nafCode: lastPeriode?.activitePrincipaleEtablissement || u.activitePrincipaleUniteLegale || null,
    nafLabel: null,
    creationDate: u.dateCreationUniteLegale || e.dateCreationEtablissement || null,
    legalForm: legalFormCode ? (LEGAL_FORM_LABELS[legalFormCode] || `Code ${legalFormCode}`) : null,
    legalFormCode,
    employeesRange: null, // INSEE renvoie un code, pas un libelle ; ajout en v2 si besoin
    director: null,
    latitude: null,
    longitude: null,
  };
}

export async function searchSirene(filters: SireneFilters): Promise<{
  results: SireneResult[];
  total: number;
  debug: { query: string; totalApi: number; resolvedCity?: string };
}> {
  const token = await getBearerToken();

  // Build Lucene query : on filtre par SIEGE uniquement + actif
  const queryParts: string[] = [
    'etablissementSiege:true',
    'etatAdministratifUniteLegale:A',
  ];
  let resolvedCity: string | undefined;

  if (filters.communeCode) {
    queryParts.push(`codeCommuneEtablissement:${filters.communeCode}`);
    resolvedCity = `commune ${filters.communeCode}`;
  }
  if (filters.postalCode) {
    queryParts.push(`codePostalEtablissement:${filters.postalCode}`);
    resolvedCity = `CP ${filters.postalCode}`;
  }
  if (filters.departmentCode) {
    // code département en préfixe de codeCommune : 49 → 49xxx
    const dept = filters.departmentCode.padStart(2, '0');
    queryParts.push(`codeCommuneEtablissement:${dept}*`);
    resolvedCity = `dpt ${dept}`;
  }
  if (filters.creationMaxMonths) {
    const d = new Date();
    d.setMonth(d.getMonth() - filters.creationMaxMonths);
    const dateStr = d.toISOString().slice(0, 10);
    queryParts.push(`dateCreationUniteLegale:[${dateStr} TO *]`);
  }
  if (filters.nafCode) {
    queryParts.push(`activitePrincipaleUniteLegale:${filters.nafCode}`);
  }
  if (filters.natureJuridique) {
    queryParts.push(`categorieJuridiqueUniteLegale:${filters.natureJuridique}`);
  }
  if (filters.q) {
    // Recherche par denomination (boites) avec wildcard pour flexibilite
    queryParts.push(`(denominationUniteLegale:*${filters.q}* OR denominationUsuelle1UniteLegale:*${filters.q}*)`);
  }

  const query = queryParts.join(' AND ');
  const url = `${SIRENE_API}/siret?q=${encodeURIComponent(query)}&nombre=${filters.perPage || 25}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`INSEE Sirene error ${response.status}: ${text.slice(0, 200)}`);
  }

  const data = (await response.json()) as SireneRawResponse;
  const results = (data.etablissements || []).map(normalize);

  const debug = {
    query,
    totalApi: data.header?.total || 0,
    resolvedCity,
  };
  console.log('[insee-sirene]', debug);

  return {
    results,
    total: data.header?.total || 0,
    debug,
  };
}

/** Helper : combine resolution ville + search Sirene */
export async function searchSireneWithCity(args: {
  q?: string;
  city?: string; // nom de ville, CP ou departement
  creationMaxMonths?: number;
  nafCode?: string;
  natureJuridique?: string;
  perPage?: number;
}): Promise<Awaited<ReturnType<typeof searchSirene>>> {
  const filters: SireneFilters = {
    q: args.q,
    creationMaxMonths: args.creationMaxMonths,
    nafCode: args.nafCode,
    natureJuridique: args.natureJuridique,
    perPage: args.perPage,
  };

  if (args.city) {
    const loc = args.city.trim();
    if (/^\d{5}$/.test(loc)) {
      filters.postalCode = loc;
    } else if (/^\d{2,3}$/.test(loc)) {
      filters.departmentCode = loc;
    } else {
      const code = await resolveCityToCommuneCode(loc);
      if (code) {
        filters.communeCode = code;
      } else {
        // Fallback : full-text si on n'a pas pu resoudre la ville
        filters.q = `${args.q || ''} ${loc}`.trim();
      }
    }
  }

  return searchSirene(filters);
}
