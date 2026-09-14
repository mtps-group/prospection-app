import type { SocialProfiles } from '@/types';

/**
 * Google Places renvoie un `websiteUri` pour beaucoup d'entreprises qui n'ont
 * en realite pas de site : le champ pointe vers leur page Facebook, leur
 * Instagram, un Linktree ou une fiche PagesJaunes.
 *
 * Ces entreprises sont justement les meilleurs prospects, elles doivent donc
 * atterrir dans l'onglet "sans site web" et pas dans "avec site web".
 *
 * Regle appliquee : l'entreprise a un vrai site uniquement si l'URL pointe
 * vers un domaine qui lui appartient. Une page heberges sur la plateforme
 * d'un tiers (reseau social, agregateur de liens, annuaire) ne compte pas.
 */

export type WebPresenceKind = 'website' | 'social' | 'aggregator' | 'directory' | 'none';

// Cle = domaine (sans www). Les sous-domaines sont couverts automatiquement,
// donc 'facebook.com' matche aussi 'fr-fr.facebook.com' et 'm.facebook.com'.
const SOCIAL_HOSTS: Record<string, string> = {
  'facebook.com': 'Facebook',
  'facebook.fr': 'Facebook',
  'fb.com': 'Facebook',
  'fb.me': 'Facebook',
  'instagram.com': 'Instagram',
  'instagr.am': 'Instagram',
  'linkedin.com': 'LinkedIn',
  'twitter.com': 'X (Twitter)',
  'x.com': 'X (Twitter)',
  'tiktok.com': 'TikTok',
  'youtube.com': 'YouTube',
  'youtu.be': 'YouTube',
  'pinterest.com': 'Pinterest',
  'pinterest.fr': 'Pinterest',
  'snapchat.com': 'Snapchat',
  'threads.net': 'Threads',
  'threads.com': 'Threads',
  'vk.com': 'VK',
  'wa.me': 'WhatsApp',
  'whatsapp.com': 'WhatsApp',
  't.me': 'Telegram',
  'telegram.me': 'Telegram',
};

// Pages "tous mes liens" : jamais un site d'entreprise.
const AGGREGATOR_HOSTS: Record<string, string> = {
  'linktr.ee': 'Linktree',
  'beacons.ai': 'Beacons',
  'bio.link': 'Bio.link',
  'lnk.bio': 'Lnk.bio',
  'taplink.cc': 'Taplink',
  'campsite.bio': 'Campsite',
  'allmylinks.com': 'AllMyLinks',
  'msha.ke': 'Milkshake',
};

// Fiches sur des plateformes tierces : l'entreprise est referencee, mais
// elle ne possede pas le site.
const DIRECTORY_HOSTS: Record<string, string> = {
  'pagesjaunes.fr': 'PagesJaunes',
  'pagesjaunes.com': 'PagesJaunes',
  'business.site': 'Page Google',
  'maps.google.com': 'Google Maps',
  'maps.app.goo.gl': 'Google Maps',
  'yelp.fr': 'Yelp',
  'yelp.com': 'Yelp',
  'tripadvisor.fr': 'TripAdvisor',
  'tripadvisor.com': 'TripAdvisor',
  'thefork.fr': 'TheFork',
  'lafourchette.com': 'TheFork',
  'ubereats.com': 'Uber Eats',
  'deliveroo.fr': 'Deliveroo',
  'just-eat.fr': 'Just Eat',
  'doctolib.fr': 'Doctolib',
  'booking.com': 'Booking',
  'airbnb.fr': 'Airbnb',
  'airbnb.com': 'Airbnb',
  'wanadoo.fr': 'Wanadoo',
  'free.fr': 'Page perso Free',
};

export interface WebsiteClassification {
  kind: WebPresenceKind;
  /** true seulement si l'entreprise possede son propre site web */
  isRealWebsite: boolean;
  /** Nom lisible de la plateforme quand ce n'est pas un vrai site ("Facebook"...) */
  platform: string | null;
}

/** Ajoute https:// si absent, puis extrait le hostname en minuscules. */
function getHostname(url: string): string | null {
  try {
    const trimmed = url.trim();
    const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    return new URL(normalized).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function lookup(host: string, table: Record<string, string>): string | null {
  for (const [domain, label] of Object.entries(table)) {
    if (host === domain || host.endsWith(`.${domain}`)) return label;
  }
  return null;
}

export function classifyWebsite(url: string | null | undefined): WebsiteClassification {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return { kind: 'none', isRealWebsite: false, platform: null };
  }

  const host = getHostname(url);
  if (!host) {
    return { kind: 'none', isRealWebsite: false, platform: null };
  }

  const social = lookup(host, SOCIAL_HOSTS);
  if (social) return { kind: 'social', isRealWebsite: false, platform: social };

  const aggregator = lookup(host, AGGREGATOR_HOSTS);
  if (aggregator) return { kind: 'aggregator', isRealWebsite: false, platform: aggregator };

  const directory = lookup(host, DIRECTORY_HOSTS);
  if (directory) return { kind: 'directory', isRealWebsite: false, platform: directory };

  return { kind: 'website', isRealWebsite: true, platform: null };
}

/** Raccourci : l'entreprise a-t-elle son propre site web ? */
export function isRealWebsite(url: string | null | undefined): boolean {
  return classifyWebsite(url).isRealWebsite;
}

/**
 * Quand le "site web" est en fait un profil social, on recupere directement
 * le lien comme profil social — inutile d'aller scraper la page pour le
 * retrouver.
 */
export function socialProfilesFromUrl(url: string | null | undefined): SocialProfiles | null {
  const { kind, platform } = classifyWebsite(url);
  if (kind !== 'social' || !url) return null;

  const clean = url.trim();
  if (platform === 'Facebook') return { facebook: clean };
  if (platform === 'Instagram') return { instagram: clean };
  if (platform === 'LinkedIn') return { linkedin: clean };
  return null;
}
