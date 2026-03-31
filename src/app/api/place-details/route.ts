import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Cache en mémoire pour éviter les appels Google répétés (TTL 5 min)
const cache = new Map<string, { data: Record<string, unknown>; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(key: string) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: Record<string, unknown>) {
  // Limiter la taille du cache à 200 entrées
  if (cache.size > 200) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(key, { data, timestamp: Date.now() });
}

// Champs de base pour tous les plans
const BASE_FIELDS = [
  'id',
  'displayName',
  'formattedAddress',
  'nationalPhoneNumber',
  'internationalPhoneNumber',
  'websiteUri',
  'googleMapsUri',
  'types',
  'rating',
  'userRatingCount',
  'location',
  'businessStatus',
  'regularOpeningHours',
  'currentOpeningHours',
  'editorialSummary',
].join(',');

// Champs supplémentaires pour Ultra
const ULTRA_FIELDS = [
  ...BASE_FIELDS.split(','),
  'reviews',
  'photos',
].join(',');

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get('placeId');

  if (!placeId) {
    return NextResponse.json({ error: 'placeId requis' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
  }

  // Récupérer le plan de l'utilisateur
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single();

  const isUltra = profile?.plan === 'ultra';
  const fieldMask = isUltra ? ULTRA_FIELDS : BASE_FIELDS;
  const cacheKey = `${placeId}:${isUltra ? 'ultra' : 'base'}`;

  // Vérifier le cache
  const cached = getCached(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const response = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}`,
      {
        method: 'GET',
        headers: {
          'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY!,
          'X-Goog-FieldMask': fieldMask,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Google Places Details API error:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la recuperation des details' },
        { status: 500 }
      );
    }

    const placeData = await response.json();

    // Construire les URLs des photos (Ultra uniquement)
    if (isUltra && placeData.photos) {
      placeData.photos = placeData.photos.slice(0, 5).map((photo: { name: string; widthPx: number; heightPx: number; authorAttributions?: Array<{ displayName: string }> }) => ({
        ...photo,
        photoUrl: `https://places.googleapis.com/v1/${photo.name}/media?maxHeightPx=400&maxWidthPx=600&key=${process.env.GOOGLE_PLACES_API_KEY}`,
      }));
    }

    const result = { ...placeData, isUltra };

    // Mettre en cache
    setCache(cacheKey, result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Place details error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
