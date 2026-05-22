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
    libelle_commune: string | null;
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
    if (!response.ok) return null;
    const communes = await response.json() as Array<{ code: string; nom: string; population?: number }>;
    if (!communes || communes.length === 0) return null;
    // On prend la commune la plus peuplee (ex: 'Saint-Pierre' donne Saint-Pierre-de-la-Reunion)
    return communes[0].code;
  } catch {
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

function normalizeResult(raw: RawResult): CompanyResult {
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
    // IMPORTANT : on utilise la date de creation de l'ENTREPRISE (SIREN), pas du siege
    // Le filtre date_creation_min de l'API s'applique sur la date de l'entreprise
    creationDate: raw.date_creation || siege.date_creation || null,
    legalForm: raw.libelle_nature_juridique || null,
    employeesRange: siege.libelle_tranche_effectif_salarie || raw.libelle_tranche_effectif_salarie || null,
    director: formatDirigeant(raw.dirigeants),
    latitude: siege.latitude ? parseFloat(siege.latitude) : null,
    longitude: siege.longitude ? parseFloat(siege.longitude) : null,
  };
}

/**
 * Cherche des entreprises selon les filtres fournis.
 */
export async function searchCompanies(filters: CompanySearchFilters): Promise<{
  results: CompanyResult[];
  total: number;
}> {
  const params = new URLSearchParams();

  if (filters.q) params.set('q', filters.q);
  if (filters.location) {
    const loc = filters.location.trim();
    // Si numerique = code postal/departement, sinon = ville (resolution INSEE)
    if (/^\d{5}$/.test(loc)) {
      params.set('code_postal', loc);
    } else if (/^\d{2,3}$/.test(loc)) {
      params.set('departement', loc);
    } else {
      // Resoudre le nom de ville vers code INSEE pour un filtre precis
      const communeCode = await resolveCityToCommuneCode(loc);
      if (communeCode) {
        params.set('code_commune', communeCode);
      } else {
        // Fallback : si on n'a pas pu resoudre, on l'ajoute au q (pas ideal)
        params.set('q', `${filters.q || ''} ${loc}`.trim());
      }
    }
  }
  if (filters.creationMaxMonths) {
    params.set('date_creation_min', monthsAgoToDate(filters.creationMaxMonths));
  }
  if (filters.natureJuridique) {
    params.set('nature_juridique', filters.natureJuridique);
  }
  if (filters.activitePrincipale) {
    params.set('activite_principale', filters.activitePrincipale);
  }
  if (filters.trancheEffectif) {
    params.set('tranche_effectif_salarie', filters.trancheEffectif);
  }

  // On veut uniquement les etablissements actifs
  params.set('etat_administratif', 'A');
  params.set('page', String(filters.page || 1));
  params.set('per_page', String(filters.perPage || 25));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(`${BASE_URL}?${params.toString()}`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      console.error('recherche-entreprises API error:', response.status, await response.text());
      throw new Error(`API gouv error: ${response.status}`);
    }

    const data = (await response.json()) as RechercheEntreprisesResponse;

    let results = (data.results || []).map(normalizeResult);

    // Filet de securite : on filtre cote client pour garantir le respect strict du filtre date
    // (au cas ou l'API gouv laisserait passer des resultats hors filtre)
    if (filters.creationMaxMonths) {
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - filters.creationMaxMonths);
      const cutoffTime = cutoff.getTime();
      results = results.filter((r) => {
        if (!r.creationDate) return false; // pas de date connue = on exclut
        const d = new Date(r.creationDate);
        if (isNaN(d.getTime())) return false;
        return d.getTime() >= cutoffTime;
      });
    }

    return {
      results,
      total: data.total_results || 0,
    };
  } finally {
    clearTimeout(timeout);
  }
}
