import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (chaque route handler verifie deja la session lui-meme ; faire un
     *   appel Supabase de plus dans le middleware ne sert a rien et ajoute de
     *   la latence sur tous les appels API)
     * - _next/static, _next/image (assets builds)
     * - fichiers de metadonnees (favicon, robots, sitemap, manifest)
     * - toute extension de fichier statique (images, css, js, fonts...)
     */
    '/((?!api/|_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|manifest\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|mjs|map|woff|woff2|ttf|otf|eot|txt|xml|json)$).*)',
  ],
};
