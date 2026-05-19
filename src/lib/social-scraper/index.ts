/**
 * Extracteur de profils sociaux depuis le site web d'un prospect.
 * Strategie : fetch le HTML du site, regex sur les liens vers FB/IG/LinkedIn.
 *
 * - Timeout court (4s) pour ne pas bloquer la recherche
 * - Limite la taille du body fetched a 500KB
 * - Filtre les URLs de share/tracking (non profile)
 * - Ne plante jamais : retourne {} si erreur/timeout
 */

export interface SocialProfiles {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
}

const FETCH_TIMEOUT_MS = 4000;
const MAX_BODY_SIZE = 500_000; // 500KB

// Facebook : exclut les URLs de share, tracking, plugins, etc.
const FB_BLACKLIST = [
  'sharer', 'share', 'tr', 'tr.php', 'dialog', 'plugins', 'login',
  'l.php', 'help', 'about', 'privacy', 'terms', 'policies', 'pixel',
  'profile.php', 'pages/category', 'business/help', 'home.php',
];

// Instagram : exclut les URLs de posts, reels, stories, etc.
const IG_BLACKLIST = ['p', 'reel', 'tv', 'stories', 'explore', 'accounts', 'about'];

const PATTERNS = {
  // facebook.com/USERNAME (avec ou sans www, m., business., fr-fr., etc.)
  facebook: /https?:\/\/(?:[a-z]{2,6}-[a-z]{2,6}\.|www\.|m\.|business\.)?facebook\.com\/([a-zA-Z0-9.][a-zA-Z0-9._-]{2,})/gi,

  // instagram.com/USERNAME
  instagram: /https?:\/\/(?:www\.)?instagram\.com\/([a-zA-Z0-9_.][a-zA-Z0-9._]{1,29})/gi,

  // linkedin.com/company/NAME ou /in/NAME ou /school/NAME (avec locale optionnelle)
  linkedin: /https?:\/\/(?:[a-z]{2,4}\.)?linkedin\.com\/(?:company|in|school)\/([a-zA-Z0-9._%-]{2,})/gi,
};

/**
 * Fetch le HTML avec timeout et limite de taille.
 * Retourne null en cas d'erreur, timeout, ou non-200.
 */
async function fetchWithTimeout(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    // Normalize URL (ajoute https:// si manquant)
    const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;

    const response = await fetch(normalized, {
      signal: controller.signal,
      headers: {
        // User-Agent realiste pour eviter les blocages anti-bot basiques
        'User-Agent': 'Mozilla/5.0 (compatible; ProspectWebBot/1.0; +https://prospectweb.fr)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
      },
      redirect: 'follow',
    });

    if (!response.ok) return null;

    // Lire jusqu'a MAX_BODY_SIZE octets puis stop
    const reader = response.body?.getReader();
    if (!reader) return null;

    const decoder = new TextDecoder();
    let text = '';
    let total = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      text += decoder.decode(value, { stream: true });
      if (total >= MAX_BODY_SIZE) {
        await reader.cancel();
        break;
      }
    }

    return text;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Nettoie une URL : retire query/fragment, slash final.
 */
function cleanUrl(url: string): string {
  return url.replace(/[?#].*$/, '').replace(/\/+$/, '');
}

/**
 * Trouve la premiere URL valide pour un pattern, en filtrant les blacklists.
 */
function findFirstValid(
  html: string,
  pattern: RegExp,
  blacklist: string[]
): string | undefined {
  // Reset le pattern (necessaire pour les regex globales)
  pattern.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(html)) !== null) {
    const username = match[1].toLowerCase();
    // Skip si le username est dans la blacklist (sharer, share, etc.)
    if (blacklist.includes(username)) continue;
    // Skip si trop court (probablement faux positif)
    if (username.length < 3) continue;

    return cleanUrl(match[0]);
  }

  return undefined;
}

/**
 * Extrait les profils sociaux depuis le site web d'un prospect.
 * Retourne {} si erreur/timeout/aucun profil trouve.
 */
export async function extractSocialLinks(websiteUrl: string | null | undefined): Promise<SocialProfiles> {
  if (!websiteUrl) return {};

  const html = await fetchWithTimeout(websiteUrl);
  if (!html) return {};

  const result: SocialProfiles = {};

  const fb = findFirstValid(html, PATTERNS.facebook, FB_BLACKLIST);
  if (fb) result.facebook = fb;

  const ig = findFirstValid(html, PATTERNS.instagram, IG_BLACKLIST);
  if (ig) result.instagram = ig;

  const li = findFirstValid(html, PATTERNS.linkedin, []);
  if (li) result.linkedin = li;

  return result;
}
