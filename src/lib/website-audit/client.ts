/**
 * Audit technique d'un site web :
 * - Niveau 1 : checks rapides custom (HTTPS, mobile, tech, SEO basics)
 * - Niveau 2 : scores Lighthouse via Google PageSpeed Insights API (gratuit)
 */

export interface WebsiteAudit {
  url: string;
  // Niveau 1 (custom, instantané)
  https: boolean;
  mobileFriendly: boolean;
  technology: string | null;
  hasTitle: boolean;
  hasMetaDescription: boolean;
  hasFavicon: boolean;
  estimatedAge: string | null;
  // Niveau 2 (Lighthouse via Google)
  performanceScore: number | null;
  seoScore: number | null;
  accessibilityScore: number | null;
  bestPracticesScore: number | null;
  // Recommandations
  recommendations: string[];
  // Erreurs / warnings
  warnings: string[];
}

const TECH_PATTERNS: Array<{ name: string; patterns: RegExp[]; ageHint?: string }> = [
  {
    name: 'WordPress',
    patterns: [/wp-content/i, /wp-includes/i, /<meta name="generator" content="WordPress/i],
    ageHint: 'thème souvent obsolète',
  },
  {
    name: 'Wix',
    patterns: [/wixstatic\.com/i, /static\.wixstatic/i, /<meta name="generator" content="Wix/i],
    ageHint: 'rapide à monter mais limité SEO',
  },
  {
    name: 'Shopify',
    patterns: [/cdn\.shopify\.com/i, /<meta name="generator" content="Shopify/i],
    ageHint: 'spécialisé e-commerce',
  },
  {
    name: 'Squarespace',
    patterns: [/squarespace\.com/i, /static1\.squarespace/i],
    ageHint: 'plateforme tout-en-un',
  },
  {
    name: 'Webflow',
    patterns: [/webflow\.com/i, /<meta name="generator" content="Webflow/i],
    ageHint: 'plateforme moderne',
  },
  {
    name: 'Joomla',
    patterns: [/<meta name="generator" content="Joomla/i, /\/components\/com_/i],
    ageHint: 'CMS vieillissant',
  },
  {
    name: 'Drupal',
    patterns: [/<meta name="generator" content="Drupal/i, /\/sites\/default\/files\//i],
    ageHint: 'CMS technique',
  },
  {
    name: 'Site statique HTML',
    patterns: [/<!DOCTYPE html>(?![\s\S]*<script[\s\S]*(react|vue|angular))/i],
    ageHint: 'généralement vieux, codé main',
  },
];

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ProspectWeb-Audit/1.0)',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });
    clearTimeout(timeout);
    if (!response.ok) return null;
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
      if (total >= 300_000) {
        await reader.cancel();
        break;
      }
    }
    return text;
  } catch {
    return null;
  }
}

function detectTechnology(html: string): { name: string; ageHint?: string } | null {
  for (const tech of TECH_PATTERNS) {
    for (const pattern of tech.patterns) {
      if (pattern.test(html)) {
        return { name: tech.name, ageHint: tech.ageHint };
      }
    }
  }
  return null;
}

async function fetchLighthouseScores(url: string): Promise<{
  performance: number | null;
  seo: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  recommendations: string[];
}> {
  try {
    const params = new URLSearchParams({
      url,
      strategy: 'mobile',
    });
    params.append('category', 'performance');
    params.append('category', 'seo');
    params.append('category', 'accessibility');
    params.append('category', 'best-practices');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45_000);
    const apiUrl = `https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed?${params.toString()}`;
    const response = await fetch(apiUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      console.error('Lighthouse API error:', response.status);
      return { performance: null, seo: null, accessibility: null, bestPractices: null, recommendations: [] };
    }

    const data = await response.json();
    const categories = data?.lighthouseResult?.categories || {};
    const audits = data?.lighthouseResult?.audits || {};

    const score = (cat: { score?: number | null }) =>
      cat?.score !== null && cat?.score !== undefined ? Math.round(cat.score * 100) : null;

    // Extraction des top recommandations
    const recommendations: string[] = [];
    const importantAudits = ['unused-css-rules', 'render-blocking-resources', 'unused-javascript', 'uses-optimized-images', 'uses-webp-images', 'efficient-animated-content', 'modern-image-formats'];
    for (const auditKey of importantAudits) {
      const audit = audits[auditKey];
      if (audit?.score !== null && audit?.score < 0.9 && audit?.title) {
        recommendations.push(audit.title);
        if (recommendations.length >= 4) break;
      }
    }

    return {
      performance: score(categories.performance),
      seo: score(categories.seo),
      accessibility: score(categories.accessibility),
      bestPractices: score(categories['best-practices']),
      recommendations,
    };
  } catch (err) {
    console.error('Lighthouse error:', err);
    return { performance: null, seo: null, accessibility: null, bestPractices: null, recommendations: [] };
  }
}

export async function auditWebsite(url: string): Promise<WebsiteAudit> {
  const warnings: string[] = [];

  // Normalize URL
  let normalizedUrl = url;
  if (!/^https?:\/\//i.test(normalizedUrl)) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  const audit: WebsiteAudit = {
    url: normalizedUrl,
    https: normalizedUrl.startsWith('https://'),
    mobileFriendly: false,
    technology: null,
    hasTitle: false,
    hasMetaDescription: false,
    hasFavicon: false,
    estimatedAge: null,
    performanceScore: null,
    seoScore: null,
    accessibilityScore: null,
    bestPracticesScore: null,
    recommendations: [],
    warnings,
  };

  // 1. Fetch HTML pour les checks rapides
  const html = await fetchHtml(normalizedUrl);

  if (html) {
    // Mobile friendly : check viewport meta
    audit.mobileFriendly = /<meta[^>]+name=["']viewport["'][^>]*>/i.test(html);

    // Title
    audit.hasTitle = /<title[^>]*>[^<]+<\/title>/i.test(html);

    // Meta description
    audit.hasMetaDescription = /<meta[^>]+name=["']description["'][^>]+content=["'][^"']+["']/i.test(html);

    // Favicon
    audit.hasFavicon = /<link[^>]+rel=["'](?:icon|shortcut icon)["']/i.test(html);

    // Technology + age hint
    const tech = detectTechnology(html);
    if (tech) {
      audit.technology = tech.name;
      audit.estimatedAge = tech.ageHint || null;
    }
  } else {
    warnings.push('Impossible de charger le site (timeout ou bloqué)');
  }

  // 2. Lighthouse en parallèle (lent mais gratuit)
  const lighthouse = await fetchLighthouseScores(normalizedUrl);
  audit.performanceScore = lighthouse.performance;
  audit.seoScore = lighthouse.seo;
  audit.accessibilityScore = lighthouse.accessibility;
  audit.bestPracticesScore = lighthouse.bestPractices;
  audit.recommendations = lighthouse.recommendations;

  return audit;
}
