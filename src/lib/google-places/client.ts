import { GOOGLE_PLACES_FIELD_MASK, GOOGLE_PLACES_FIELD_MASK_DETAILED } from '@/lib/constants';
import type { GooglePlace, TextSearchResponse } from '@/types';

const GOOGLE_PLACES_API_URL = 'https://places.googleapis.com/v1/places:searchText';

interface SearchOptions {
  query: string;
  maxPages?: number; // 1 for free, 3 for premium/ultra
  detailed?: boolean; // true for ultra plan
}

export async function searchPlaces(options: SearchOptions): Promise<GooglePlace[]> {
  const { query, maxPages = 1, detailed = false } = options;
  const allPlaces: GooglePlace[] = [];
  let pageToken: string | undefined;
  let currentPage = 0;

  const fieldMask = detailed ? GOOGLE_PLACES_FIELD_MASK_DETAILED : GOOGLE_PLACES_FIELD_MASK;

  do {
    const response = await fetch(GOOGLE_PLACES_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY!,
        'X-Goog-FieldMask': fieldMask,
      },
      body: JSON.stringify({
        textQuery: query,
        languageCode: 'fr',
        regionCode: 'FR',
        ...(pageToken && { pageToken }),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google Places API error: ${response.status} - ${error}`);
    }

    const data: TextSearchResponse = await response.json();

    if (data.places) {
      allPlaces.push(...data.places);
    }

    pageToken = data.nextPageToken;
    currentPage++;
  } while (pageToken && currentPage < maxPages);

  return allPlaces;
}

export function filterNoWebsite(places: GooglePlace[]): GooglePlace[] {
  return places.filter((place) => !place.websiteUri);
}

export function getPrimaryType(types: string[] | undefined): string | null {
  if (!types || types.length === 0) return null;

  // Mapping des types Google Places vers des noms lisibles en francais
  const typeLabels: Record<string, string> = {
    hair_care: 'Coiffure',
    beauty_salon: 'Salon de beaute',
    restaurant: 'Restaurant',
    cafe: 'Cafe',
    bakery: 'Boulangerie',
    bar: 'Bar',
    dentist: 'Dentiste',
    doctor: 'Medecin',
    pharmacy: 'Pharmacie',
    gym: 'Salle de sport',
    plumber: 'Plombier',
    electrician: 'Electricien',
    car_repair: 'Garage auto',
    real_estate_agency: 'Agence immobiliere',
    accounting: 'Cabinet comptable',
    lawyer: 'Avocat',
    florist: 'Fleuriste',
    pet_store: 'Animalerie',
    veterinary_care: 'Veterinaire',
    clothing_store: 'Magasin de vetements',
    jewelry_store: 'Bijouterie',
    furniture_store: 'Magasin de meubles',
    home_goods_store: 'Magasin de decoration',
    hardware_store: 'Quincaillerie',
    supermarket: 'Supermarche',
    convenience_store: 'Epicerie',
    laundry: 'Pressing',
    locksmith: 'Serrurier',
    painter: 'Peintre',
    roofing_contractor: 'Couvreur',
    moving_company: 'Demenageur',
    travel_agency: 'Agence de voyage',
    insurance_agency: 'Assurance',
    bank: 'Banque',
    spa: 'Spa',
    tattoo_shop: 'Tatoueur',
  };

  for (const type of types) {
    if (typeLabels[type]) {
      return typeLabels[type];
    }
  }

  // Return first type cleaned up
  return types[0]?.replace(/_/g, ' ') || null;
}
