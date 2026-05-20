import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Endpoint de deconnexion cote serveur.
 *
 * Pourquoi cote serveur ?
 * - supabase.auth.signOut() cote client efface les cookies dans le navigateur
 *   MAIS pas instantanement de maniere atomique. Quand on navigue ensuite vers /login,
 *   les cookies peuvent encore etre presents dans la requete HTTP, et le middleware
 *   nous redirige vers /recherche en pensant qu'on est encore authentifie.
 *
 * - Cote serveur, signOut() ecrit les Set-Cookie d'expiration directement dans la
 *   reponse HTTP. La requete suivante n'a plus de cookies valides → navigation propre.
 */
export async function POST() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  return NextResponse.json({ success: true });
}
