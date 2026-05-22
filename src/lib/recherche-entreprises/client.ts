/**
 * Wrapper pour l'API officielle française :
 * https://recherche-entreprises.api.gouv.fr/
 *
 * Gratuite, sans authentification, mise a jour quotidiennement par l'INSEE.
 * Couvre toutes les entreprises immatriculees en France (>30M etablissements).
 */

const BASE_URL = 'https://recherche-entreprises.api.gouv.fr/search';
const FETCH_TIMEOUT_MS = 10_000; // 10s

export interface CompanySearchFilters {
  /** Recherche texte libre (nom, dirigeant, sigle, NAF) */
  q?: string;
  /** Code postal ou nom de ville (ex: "75001" ou "Paris") */
  location?: string;
  /** Nombre de mois max depuis la creation (ex: 6 = creees il y a ≤ 6 mois) */
  creationMaxMonths?: number;
  /** Forme juridique (ex: "5710" = SAS, "5499" = SARL) */
  natureJuridique?: string;
  /** Code NAF/APE precis (ex: "10.71C" pour boulangerie) */
  activitePrincipale?: string;
  /** Tranche d'effectif salarie (ex: "0", "1-2", "3-5", "6-9") */
  trancheEffectif?: string;
  /** Page (defaut 1, max ~10 selon l'API) */
  page?: number;
  /** Resultats par page (defaut 10, max 25 selon l'API) */
  perPage?: number;
}

export interface CompanyResult {
  siret: string;
  siren: string;
  /** Denomination commerciale ou nom personnel */
  name: string;
  /** Adresse complete */
  address: string | null;
  /** Code postal */
  postalCode: string | null;
  /** Ville */
  city: string | null;
  /** Code NAF (ex: "10.71C") */
  nafCode: string | null;
  /** Libelle NAF (ex: "Cuisson de produits de boulangerie") */
  nafLabel: string | null;
  /** Date de creation (ISO YYYY-MM-DD) */
  creationDate: string | null;
  /** Forme juridique en clair (ex: "SAS, société par actions simplifiée") */
  legalForm: string | null;
  /** Tranche d'effectif (ex: "1 ou 2 salaries") */
  employeesRange: string | null;
  /** Nom du dirigeant principal si disponible */
  director: string | null;
  /** Latitude / longitude si disponibles */
  latitude: number | null;
  longitude: number | null;
}

interface RechercheEntreprisesResponse {
  results: RawResult[];
  total_results: number;
  page: number;
  per_page: number;
  total_pages: number;
}

interface RawResult {
  siren: string;
  nom_complet: string;
  nom_raison_sociale: string | null;
  sigle: string | null;
  nombre_etablissements: number;
  nombre_etablissements_ouverts: number;
  siege: {
    siret: string;
    adresse: string | null;
    code_postal: string | null;
    commune: string | null; // code INSEE
    libelle_commune: string | null;
    departement: string | null;
    latitude: string | null;
    longitude: string | null;
    activite_principale: string | null;
    libelle_activite_principale: string | null;
    date_creation: string | null;
    tranche_effectif_salarie: string | null;
    libelle_tranche_effectif_salarie: string | null;
  };
  date_creation: string | null;
  activite_principale: string | null;
  libelle_activite_principale: string | null;
  nature_juridique: string | null;
  libelle_nature_juridique: string | null;
  tranche_effectif_salarie: string | null;
  libelle_tranche_effectif_salarie: string | null;
  dirigeants: Array<{
    type_dirigeant: string;
    nom: string | null;
    prenoms: string | null;
    qualite: string | null;
  }> | null;
}

function monthsAgoToDate(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().slice(0, 10);
}

/**
 * Resout un nom de ville en code INSEE de commune via geo.api.gouv.fr (gratuit, no auth).
 * Retourne le code INSEE de la 1ere commune trouvee, ou null si non trouve.
 * Permet de filtrer precisement par ville sans avoir besoin que l'user connaisse le CP.
 */
async function resolveCityToCommuneCode(cityName: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const url = `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(cityName)}&fields=code,nom,population&limit=5&boost=population`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) {
      console.warn('[geo.api.gouv] non-ok:', response.status);
      return null;
    }
    const communes = await response.json() as Array<{ code: string; nom: string; population?: number }>;
    if (!communes || communes.length === 0) {
      console.warn('[geo.api.gouv] no commune found for:', cityName);
      return null;
    }
    console.log('[geo.api.gouv] resolved:', cityName, '->', communes[0].nom, '(', communes[0].code, ')');
    // On prend la commune la plus peuplee (ex: 'Saint-Pierre' donne Saint-Pierre-de-la-Reunion)
    return communes[0].code;
  } catch (err) {
    console.error('[geo.api.gouv] error:', err);
    return null;
  }
}

function formatDirigeant(dirigeants: RawResult['dirigeants']): string | null {
  if (!dirigeants || dirigeants.length === 0) return null;
  const priority = ['Gérant', 'Président', 'Directeur général'];
  const sorted = [...dirigeants].sort((a, b) => {
    const aPri = priority.findIndex(p => a.qualite?.includes(p));
    const bPri = priority.findIndex(p => b.qualite?.includes(p));
    return (aPri === -1 ? 99 : aPri) - (bPri === -1 ? 99 : bPri);
  });
  const d = sorted[0];
  const prenom = d.prenoms ? d.prenoms.split(',')[0].trim() : '';
  const nom = d.nom || '';
  const full = `${prenom} ${nom}`.trim();
  if (!full) return null;
  return d.qualite ? `${full} (${d.qualite})` : full;
}

function normalizeResult(raw: RawResult): CompanyResult & { _siegeCommune: string | null; _siegeCodePostal: string | null; _siegeDept: string | null } {
  const siege = raw.siege || {} as RawResult['siege'];

  return {
    siret: siege.siret || `${raw.siren}00000`,
    siren: raw.siren,
    name: raw.nom_complet || raw.nom_raison_sociale || raw.sigle || 'Inconnu',
    address: siege.adresse || null,
    postalCode: siege.code_postal || null,
    city: siege.libelle_commune || null,
    nafCode: siege.activite_principale || raw.activite_principale || null,
    nafLabel: siege.libelle_activite_principale || raw.libelle_activite_principale || null,
    creationDate: raw.date_creation || siege.date_creation || null,
    legalForm: raw.libelle_nature_juridique || null,
    employeesRange: siege.libelle_tranche_effectif_salarie || raw.libelle_tranche_effectif_salarie || null,
    director: formatDirigeant(raw.dirigeants),
    latitude: siege.latitude ? parseFloat(siege.latitude) : null,
    longitude: siege.longitude ? parseFloat(siege.longitude) : null,
    // Champs internes pour filtrage post-API (non exportes)
    _siegeCommune: siege.commune || null,
    _siegeCodePostal: siege.code_postal || null,
    _siegeDept: siege.departement || null,
  };
}

/**
 * Cherche des entreprises selon les filtres fournis.
 *
 * IMPORTANT : l'API gouv (recherche-entreprises.api.gouv.fr) a des comportements
 * surprenants : ses filtres location et date_creation_min sont SOUPLES (matching
 * sur n'importe quel etablissement, et le filtre date est parfois ignore).
 *
 * On compense en fetchant plusieurs pages et en filtrant STRICTEMENT cote serveur
 * sur le siege + la date de creation de l'entreprise.
 */
export async function searchCompanies(filters: CompanySearchFilters): Promise<{
  results: CompanyResult[];
  total: number;
  debug: { url: string; totalApi: number; afterFilter: number; resolvedCity?: string; pagesFetched: number };
}> {
  const baseParams = new URLSearchParams();
  let resolvedCity: string | undefined;
  let strictCommune: string | null = null;
  let strictPostalCode: string | null = null;
  let strictDept: string | null = null;

  if (filters.q) baseParams.set('q', filters.q);
  if (filters.location) {
    const loc = filters.location.trim();
    if (/^\d{5}$/.test(loc)) {
      baseParams.set('code_postal', loc);
      strictPostalCode = loc;
      resolvedCity = `CP ${loc}`;
    } else if (/^\d{2,3}$/.test(loc)) {
      baseParams.set('departement', loc);
      strictDept = loc.padStart(2, '0');
      resolvedCity = `Dpt ${loc}`;
    } else {
      const communeCode = await resolveCityToCommuneCode(loc);
      if (communeCode) {
        baseParams.set('code_commune', communeCode);
        strictCommune = communeCode;
        resolvedCity = `${loc} → ${communeCode}`;
      } else {
        baseParams.set('q', `${filters.q || ''} ${loc}`.trim());
        resolvedCity = `${loc} (non-résolu, full-text)`;
      }
    }
  }
  if (filters.creationMaxMonths) {
    baseParams.set('date_creation_min', monthsAgoToDate(filters.creationMaxMonths));
  }
  if (filters.natureJuridique) baseParams.set('nature_juridique', filters.natureJuridique);
  if (filters.activitePrincipale) baseParams.set('activite_principale', filters.activitePrincipale);
  if (filters.trancheEffectif) baseParams.set('tranche_effectif_salarie', filters.trancheEffectif);
  baseParams.set('etat_administratif', 'A');
  baseParams.set('per_page', '25');

  // Cutoff strict pour le filtre date (si fourni)
  let cutoffTime: number | null = null;
  if (filters.creationMaxMonths) {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - filters.creationMaxMonths);
    cutoffTime = cutoff.getTime();
  }

  // Filtre strict sur 1 resultat
  function matchesStrictFilters(r: ReturnType<typeof normalizeResult>): boolean {
    // Filtre location : siege doit etre dans la commune/CP/dept demande
    if (strictCommune && r._siegeCommune !== strictCommune) return false;
    if (strictPostalCode && r._siegeCodePostal !== strictPostalCode) return false;
    if (strictDept && r._siegeDept !== strictDept) return false;

    // Filtre date : creation doit etre >= cutoff
    if (cutoffTime !== null) {
      if (!r.creationDate) return false;
      const d = new Date(r.creationDate);
      if (isNaN(d.getTime()) || d.getTime() < cutoffTime) return false;
    }
    return true;
  }

  // Fetch multi-pages : jusqu'a 4 pages (100 resultats) ou jusqu'a avoir 25 matches
  const MAX_PAGES = 4;
  const allMatches: CompanyResult[] = [];
  let totalApi = 0;
  let pagesFetched = 0;
  let lastUrl = '';

  for (let page = 1; page <= MAX_PAGES; page++) {
    const params = new URLSearchParams(baseParams);
    params.set('page', String(page));
    const url = `${BASE_URL}?${params.toString()}`;
    lastUrl = url;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });
      if (!response.ok) break;
      const data = (await response.json()) as RechercheEntreprisesResponse;
      pagesFetched++;
      totalApi = data.total_results || totalApi;

      const pageResults = (data.results || []).map(normalizeResult);
      for (const r of pageResults) {
        if (matchesStrictFilters(r)) {
          // Cleanup : on retire les champs internes avant export
          const { _siegeCommune, _siegeCodePostal, _siegeDept, ...clean } = r;
          void _siegeCommune; void _siegeCodePostal; void _siegeDept;
          allMatches.push(clean);
        }
      }

      if (allMatches.length >= 25) break;
      if ((data.results || []).length === 0) break;
    } catch (err) {
      console.error('[recherche-entreprises] fetch error page', page, err);
      break;
    } finally {
      clearTimeout(timeout);
    }
  }

  const debug = {
    url: lastUrl,
    totalApi,
    afterFilter: allMatches.length,
    resolvedCity,
    pagesFetched,
  };
  console.log('[recherche-entreprises]', debug);

  return {
    results: allMatches.slice(0, 25),
    total: totalApi,
    debug,
  };
}
