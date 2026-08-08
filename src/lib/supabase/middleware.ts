import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Pages publiques qui n'ont besoin ni du gate d'auth ni du refresh de session.
 * On evite un aller-retour reseau Supabase inutile sur les pages les plus
 * visitees (landing, pricing...), ce qui reduit fortement la charge middleware.
 */
const PUBLIC_PATHS = new Set(['/', '/pricing', '/privacy']);

/**
 * getUser() fait un appel reseau au serveur Auth Supabase. Sans garde-fou, un
 * Supabase lent ou injoignable fait pendre le middleware jusqu'a la limite
 * Vercel -> "504 middleware invocation timeout" sur TOUT le site.
 */
const AUTH_TIMEOUT_MS = 5000;

async function getUserWithTimeout(
  supabase: ReturnType<typeof createServerClient>,
): Promise<{ user: { id: string } | null; timedOut: boolean }> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('supabase-auth-timeout')), AUTH_TIMEOUT_MS);
    });
    const result = await Promise.race([supabase.auth.getUser(), timeout]);
    return { user: result.data.user, timedOut: false };
  } catch (err) {
    console.error('[middleware] auth check failed:', err);
    return { user: null, timedOut: true };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not write any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to
  // debug issues with users being randomly logged out.
  const { user, timedOut } = await getUserWithTimeout(supabase);

  // Auth injoignable : on laisse passer sans rediriger. Les pages protegees
  // tirent leurs donnees d'API routes qui verifient elles-memes la session
  // (401), donc rien ne fuite. Mieux vaut une page vide qu'un 504 global, et
  // ca evite de deconnecter tout le monde sur un simple hoquet Supabase.
  if (timedOut) {
    return supabaseResponse;
  }

  // Redirect unauthenticated users trying to access dashboard
  if (
    !user &&
    !pathname.startsWith('/login') &&
    !pathname.startsWith('/signup') &&
    !pathname.startsWith('/callback') &&
    !pathname.startsWith('/reset-password') &&
    !pathname.startsWith('/pricing') &&
    !pathname.startsWith('/api') &&
    pathname !== '/'
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  if (
    user &&
    (pathname.startsWith('/login') || pathname.startsWith('/signup'))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/recherche';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
