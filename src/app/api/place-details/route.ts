import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // Indiquer si c'est Ultra pour le front
    return NextResponse.json({ ...placeData, isUltra });
  } catch (error) {
    console.error('Place details error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
