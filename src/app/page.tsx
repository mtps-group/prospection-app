'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Card3D } from '@/components/ui/Card3D';
import { useSupabase } from '@/providers/SupabaseProvider';
import {
  Globe,
  Search,
  Filter,
  Download,
  ArrowRight,
  Star,
  Zap,
  Crown,
  CheckCircle,
  MapPin,
  Phone,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  LayoutDashboard,
  Users,
  BarChart3,
  Shield,
  Target,
  Clock,
  Sparkles,
  Mic,
} from 'lucide-react';

const GAP = 24;

const CARD_NAMES = ['Gratuit', 'Premium', 'Ultra', 'Agence'];

function LandingPricingSlider({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [currentIndex, setCurrentIndex] = useState(1); // 1 = Premium visible en premier
  const [visibleCount, setVisibleCount] = useState(3);
  const trackRef = useRef<HTMLDivElement>(null);
  const [cardW, setCardW] = useState(0);

  const measure = useCallback(() => {
    if (trackRef.current) {
      const w = trackRef.current.clientWidth;
      const vc = w < 640 ? 1 : 3;
      setVisibleCount(vc);
      setCardW((w - GAP * (vc - 1)) / vc);
      setCurrentIndex(prev => Math.min(prev, 4 - vc));
    }
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  const translateX = cardW > 0 ? currentIndex * (cardW + GAP) : 0;
  const cw = cardW > 0 ? cardW : undefined;
  const totalPositions = 4 - visibleCount + 1;
  const canPrev = currentIndex > 0;
  const canNext = currentIndex < totalPositions - 1;

  return (
    <div className="relative mx-0 sm:mx-8">

      {/* Flèche gauche */}
      <button
        onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
        className={`absolute left-2 sm:-left-8 top-1/2 -translate-y-1/2 z-30 flex items-center gap-1 bg-white rounded-full p-2 sm:pl-2 sm:pr-3 sm:py-2.5 shadow-lg border border-gray-200 text-xs font-semibold text-text-secondary hover:text-primary hover:border-primary/30 hover:shadow-xl transition-all duration-200 ${!canPrev ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">{CARD_NAMES[currentIndex - 1]}</span>
      </button>

      {/* Flèche droite */}
      <button
        onClick={() => setCurrentIndex(i => Math.min(totalPositions - 1, i + 1))}
        className={`absolute right-2 sm:-right-8 top-1/2 -translate-y-1/2 z-30 flex items-center gap-1 bg-white rounded-full p-2 sm:pl-3 sm:pr-2 sm:py-2.5 shadow-lg border border-gray-200 text-xs font-semibold text-text-secondary hover:text-violet-600 hover:border-violet-200 hover:shadow-xl transition-all duration-200 ${!canNext ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <span className="hidden sm:inline">{canNext ? CARD_NAMES[currentIndex + visibleCount] : ''}</span>
        <ChevronRight className="h-4 w-4" />
      </button>

      <div ref={trackRef} className="overflow-hidden pt-8">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ gap: GAP, transform: `translateX(-${translateX}px)` }}
        >
          {/* Gratuit */}
          <div style={{ width: cw, minWidth: cw, flexShrink: 0 }} className="flex flex-col">
            <Card3D intensity={6} className="relative rounded-2xl bg-white border border-gray-200 p-8 flex flex-col overflow-hidden h-full" style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 10px 30px -5px rgba(0,0,0,0.1)', minHeight: 680 }}>
              <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-gray-100 opacity-60" />
              <div className="relative mb-5">
                <h3 className="text-xl font-bold text-text mb-1">Gratuit</h3>
                <p className="text-sm text-text-muted">Pour découvrir l&apos;outil</p>
              </div>
              <div className="relative mb-5">
                <span className="text-5xl font-black text-text">0€</span>
              </div>
              <ul className="relative space-y-3 mb-8 flex-1">
                {['2 recherches maximum', '5 résultats visibles', 'Score de priorité'].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-text-secondary">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link href={isLoggedIn ? '/recherche' : '/signup'} className="relative block text-center rounded-xl border-2 border-gray-200 py-3.5 font-bold text-text hover:bg-gray-50 transition-colors text-base">
                {isLoggedIn ? 'Mon espace' : 'Essayer gratuitement'}
              </Link>
            </Card3D>
          </div>

          {/* Premium */}
          <div style={{ width: cw, minWidth: cw, flexShrink: 0 }} className="relative flex flex-col">
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20 rounded-full bg-amber-400 px-5 py-1.5 text-xs font-bold text-gray-900 whitespace-nowrap shadow-lg shadow-amber-400/30 pointer-events-none">
              ⭐ LE PLUS POPULAIRE
            </div>
            <Card3D intensity={8} className="relative rounded-2xl bg-gradient-to-br from-primary via-indigo-600 to-purple-600 p-8 flex flex-col overflow-hidden flex-1" style={{ boxShadow: '0 8px 16px -2px rgba(99,102,241,0.35), 0 20px 50px -8px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.15)', minHeight: 680 }}>
              <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-white/5" />
              <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5" />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
              <div className="relative mb-5">
                <h3 className="text-xl font-bold text-white mb-1">Premium</h3>
                <p className="text-sm text-white/70">Pour les créateurs actifs</p>
              </div>
              <div className="relative mb-2">
                <span className="text-5xl font-black text-white">39,99€</span>
                <span className="text-white/70 ml-1 text-sm">/ mois</span>
              </div>
              <p className="relative text-xs text-white/50 mb-6">= 1,33€/jour · Sans engagement</p>
              <ul className="relative space-y-3 mb-8 flex-1">
                {['Recherches illimitées', '60 résultats par recherche', 'Coordonnées complètes', 'Export CSV, Google Sheets, Notion', 'Historique illimité & cliquable', 'Score de priorité des prospects', 'Mini-CRM intégré', 'Onglet "avec site web"'].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-white/90">
                    <CheckCircle className="h-4 w-4 text-white flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link href={isLoggedIn ? '/abonnement' : '/signup'} className="relative block text-center rounded-xl bg-white py-4 font-bold text-primary hover:bg-gray-50 transition-colors text-base shadow-lg">
                {isLoggedIn ? 'Passer à Premium →' : 'Commencer avec Premium →'}
              </Link>
            </Card3D>
          </div>

          {/* Ultra */}
          <div style={{ width: cw, minWidth: cw, flexShrink: 0 }} className="flex flex-col">
            <Card3D intensity={6} className="relative rounded-2xl p-8 flex flex-col overflow-hidden h-full" style={{ background: 'linear-gradient(145deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3), 0 10px 30px -5px rgba(0,0,0,0.4), 0 0 0 1px rgba(251,191,36,0.15)', minHeight: 680 }}>
              <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #f59e0b, transparent)' }} />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
              <div className="absolute top-5 right-5 z-10">
                <div className="h-8 w-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
                  <Crown className="h-4 w-4 text-amber-400" />
                </div>
              </div>
              <div className="relative mb-5">
                <h3 className="text-xl font-bold text-white mb-1">Ultra</h3>
                <p className="text-sm text-white/50">Pour les agences &amp; freelances pro</p>
              </div>
              <div className="relative mb-5">
                <span className="text-5xl font-black text-white">59,99€</span>
                <span className="text-white/50 ml-1 text-sm">/ mois</span>
              </div>
              <ul className="relative space-y-3 mb-8 flex-1">
                {['Tout le plan Premium', 'Photos, avis & horaires détaillés', "Fiche de présentation de l'entreprise", 'Recherche email automatique', 'Recherche du dirigeant', 'Email de prospection personnalisé', 'Support prioritaire'].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-white/80">
                    <CheckCircle className="h-4 w-4 text-amber-400 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link href={isLoggedIn ? '/abonnement' : '/signup'} className="relative block text-center rounded-xl py-3.5 font-bold text-gray-900 hover:opacity-90 transition-all shadow-lg shadow-amber-400/20 text-base" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #f59e0b 100%)' }}>
                {isLoggedIn ? 'Passer à Ultra' : 'Commencer avec Ultra'}
              </Link>
            </Card3D>
          </div>

          {/* Agence */}
          <div style={{ width: cw, minWidth: cw, flexShrink: 0 }} className="flex flex-col">
            <Card3D intensity={6} className="relative rounded-2xl p-8 flex flex-col overflow-hidden h-full" style={{ background: 'linear-gradient(145deg, #0d0015 0%, #1a0030 50%, #0d001a 100%)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.4), 0 10px 30px -5px rgba(0,0,0,0.5), 0 0 0 1px rgba(167,139,250,0.2)', minHeight: 680 }}>
              <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #a855f7, transparent)' }} />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/60 to-transparent" />
              <div className="absolute top-5 right-5 z-10">
                <div className="h-8 w-8 rounded-lg bg-violet-400/10 border border-violet-400/20 flex items-center justify-center">
                  <Mic className="h-4 w-4 text-violet-400" />
                </div>
              </div>
              <div className="relative mb-5">
                <h3 className="text-xl font-bold text-white mb-1">Agence</h3>
                <p className="text-sm text-white/50">Pour les commerciaux &amp; agences</p>
              </div>
              <div className="relative mb-5">
                <span className="text-5xl font-black text-white">179€</span>
                <span className="text-white/50 ml-1 text-sm">/ mois</span>
              </div>
              <ul className="relative space-y-3 mb-8 flex-1">
                {['Tout le plan Ultra', 'Analyse IA de vos appels', 'Score appel & prospect /10', 'Transcription complète', 'Objections & signaux détectés', 'Style de communication analysé', 'Email de suivi auto-rédigé'].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-white/80">
                    <CheckCircle className="h-4 w-4 text-violet-400 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link href={isLoggedIn ? '/abonnement' : '/signup'} className="relative block text-center rounded-xl py-3.5 font-bold text-white hover:opacity-90 transition-all shadow-lg shadow-violet-500/30 text-base" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)' }}>
                {isLoggedIn ? 'Passer à Agence' : 'Commencer avec Agence'}
              </Link>
            </Card3D>
          </div>
        </div>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-6">
        {Array.from({ length: totalPositions }, (_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-2 rounded-full transition-all duration-300 ${currentIndex === i ? 'w-6 bg-primary' : 'w-2 bg-gray-300 hover:bg-gray-400'}`}
          />
        ))}
      </div>
    </div>
  );
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'À qui s\'adresse ProspectWeb ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'ProspectWeb s\'adresse à tous ceux qui ont besoin de trouver de nouveaux clients : commerciaux, entrepreneurs, freelances, agences web, artisans, consultants, TPE et PME. Si vous avez besoin d\'une liste de prospects qualifiés avec leurs coordonnées, ProspectWeb est fait pour vous.',
      },
    },
    {
      '@type': 'Question',
      name: 'Quelles informations obtient-on sur chaque prospect ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Pour chaque entreprise trouvée, vous obtenez : le nom, l\'adresse complète, le numéro de téléphone, le site web (si disponible), la note Google, le nombre d\'avis, le lien Google Maps et le type d\'activité. Tout ce qu\'il faut pour contacter directement vos prospects.',
      },
    },
    {
      '@type': 'Question',
      name: 'Combien de temps faut-il pour obtenir une liste de prospects ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Moins de 10 secondes. Vous tapez un secteur d\'activité et une ville, et ProspectWeb vous retourne instantanément jusqu\'à 60 entreprises avec leurs coordonnées complètes, prêtes à être contactées ou exportées.',
      },
    },
    {
      '@type': 'Question',
      name: 'D\'où viennent les données ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'ProspectWeb utilise l\'API officielle Google Maps — la source la plus complète et à jour pour les entreprises françaises. Toutes les informations sont publiquement disponibles.',
      },
    },
    {
      '@type': 'Question',
      name: 'Est-ce légal pour prospecter ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Oui. Les données (nom, adresse, téléphone) sont publiques et accessibles à tous. Vous pouvez les utiliser pour de la prospection B2B, en respectant le RGPD dans vos communications.',
      },
    },
    {
      '@type': 'Question',
      name: 'Puis-je exporter ma liste de prospects ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Oui. Vous pouvez exporter vos prospects en fichier Excel (.xlsx), vers Google Sheets en un clic, ou vers une base de données Notion. Les exports incluent toutes les coordonnées : nom, téléphone, adresse, site web, note Google.',
      },
    },
    {
      '@type': 'Question',
      name: 'Puis-je annuler à tout moment ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Oui, en un clic depuis votre espace Abonnement. La résiliation prend effet à la fin de la période en cours. Aucun frais caché, jamais.',
      },
    },
    {
      '@type': 'Question',
      name: 'Le plan gratuit est-il vraiment gratuit ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Oui, 100%. Vous avez 2 recherches et 5 résultats visibles sans aucune carte bancaire. C\'est fait pour que vous puissiez tester l\'outil avant de vous engager.',
      },
    },
  ],
};

export default function LandingPage() {
  const { profile, loading } = useSupabase();
  const router = useRouter();
  const isLoggedIn = !!profile;
  const [hasAuthCode, setHasAuthCode] = useState(false);

  // Si l'URL contient ?code= → callback OAuth/magic link Supabase
  // Rediriger vers le route handler /callback qui exchange le code en session
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      setHasAuthCode(true);
      window.location.replace(`/callback?code=${encodeURIComponent(code)}`);
    }
  }, []);

  // Rediriger automatiquement les utilisateurs connectés vers l'app
  // Évite qu'un client entreprise voie les tarifs publics en revenant sur la landing
  useEffect(() => {
    if (!loading && isLoggedIn) {
      router.replace('/recherche');
    }
  }, [loading, isLoggedIn, router]);

  // Pendant le chargement, callback en cours, ou connecté → spinner (évite le flash)
  if (hasAuthCode || loading || isLoggedIn) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* ── Navbar ────────────────────────────────────── */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
              <Globe className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-xl font-bold text-text">
              Prospect<span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">Web</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#fonctionnalites" className="text-sm font-medium text-text-secondary hover:text-text transition-colors">Fonctionnalités</a>
            <a href="#comment-ca-marche" className="text-sm font-medium text-text-secondary hover:text-text transition-colors">Comment ça marche</a>
            <a href="#tarifs" className="text-sm font-medium text-text-secondary hover:text-text transition-colors">Tarifs</a>
            <a href="#faq" className="text-sm font-medium text-text-secondary hover:text-text transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link
                href="/recherche"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-purple-500 px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-all shadow-lg shadow-primary/25"
              >
                <LayoutDashboard className="h-4 w-4" />
                Mon espace
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-text-secondary hover:text-text transition-colors">
                  Connexion
                </Link>
                <Link
                  href="/signup"
                  className="rounded-xl bg-gradient-to-r from-primary to-purple-500 px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-all shadow-lg shadow-primary/25"
                >
                  Essayer gratuitement
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────── */}
      <section className="relative pt-20 pb-16 px-4">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-primary/5 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 px-5 py-2 mb-6 animate-fade-in">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              L&apos;outil N°1 pour générer des listes de prospects qualifiés
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-text leading-[1.1] mb-6 tracking-tight">
            Une liste de prospects<br />
            <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              en quelques secondes
            </span>
          </h1>

          <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            Tapez un secteur d&apos;activité et une ville — ProspectWeb vous retourne instantanément jusqu&apos;à <strong className="text-text">60 entreprises avec leurs coordonnées complètes</strong> : téléphone, adresse, site web, note Google. Prêt à exporter et à contacter.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <Link
              href={isLoggedIn ? '/recherche' : '/signup'}
              className="group inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-primary to-purple-500 px-10 py-5 text-lg font-bold text-white hover:opacity-90 transition-all shadow-2xl shadow-primary/30 hover:-translate-y-1 hover:shadow-primary/40"
            >
              {isLoggedIn ? 'Accéder à mon espace' : 'Commencer gratuitement'}
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#tarifs"
              className="inline-flex items-center gap-2 rounded-2xl border-2 border-gray-200 px-8 py-5 text-lg font-semibold text-text hover:border-primary/30 hover:bg-primary/5 transition-all"
            >
              Voir les tarifs
            </a>
          </div>

          <p className="text-sm text-text-muted">
            Gratuit · Sans carte bancaire · 2 recherches offertes
          </p>
        </div>

        {/* ── Mockup interactif ──────── */}
        <div className="max-w-4xl mx-auto mt-14 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-3xl blur-2xl -z-10 scale-105" />
          <div className="rounded-2xl border border-gray-200/80 shadow-2xl overflow-hidden bg-white">
            {/* Barre de recherche mockup */}
            <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 px-6 py-4 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-4 py-2.5 flex-1 max-w-sm">
                  <Search className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-500">Restaurant · Lyon</span>
                </div>
                <div className="rounded-xl bg-gradient-to-r from-primary to-purple-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20">Rechercher</div>
              </div>
            </div>

            {/* Stats bar */}
            <div className="bg-gradient-to-r from-primary/5 to-purple-500/5 border-b border-gray-100 px-6 py-2.5 flex items-center gap-6">
              <span className="text-xs font-semibold text-primary">47 résultats</span>
              <span className="text-xs text-text-muted">Tri : Score de priorité</span>
              <span className="text-xs text-text-muted flex items-center gap-1">
                <Clock className="h-3 w-3" /> 28 secondes
              </span>
            </div>

            {/* Résultats */}
            <div className="p-5 grid gap-3 sm:grid-cols-2">
              {[
                { name: 'Le Bistrot du Vieux Lyon', address: '12 Rue Mercière, Lyon', phone: '04 78 37 XX XX', score: 92, label: '🔥 Priorité haute' },
                { name: 'Brasserie des Quais', address: '5 Quai Saint-Antoine, Lyon', phone: '04 78 42 XX XX', score: 87, label: '🔥 Priorité haute' },
                { name: 'Pizza Marco', address: '34 Rue de la République, Lyon', phone: '04 72 56 XX XX', score: 74, label: '⚡ Bon prospect' },
                { name: 'Café de la Mairie', address: '2 Place des Terreaux, Lyon', phone: '04 78 28 XX XX', score: 68, label: '⚡ Bon prospect' },
              ].map((r, i) => (
                <div key={i} className="rounded-xl border border-gray-100 bg-white hover:shadow-md transition-shadow p-4 group cursor-default">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-bold text-text text-sm">{r.name}</p>
                    <span className="rounded-full bg-red-50 text-red-600 text-xs font-bold px-2.5 py-0.5 flex-shrink-0 border border-red-100">Sans site</span>
                  </div>
                  <div className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold mb-2 ${r.score >= 80 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                    {r.label} · {r.score}/100
                  </div>
                  <p className="text-xs text-text-secondary flex items-center gap-1.5 mb-1">
                    <MapPin className="h-3 w-3" />{r.address}
                  </p>
                  <p className="text-xs font-semibold flex items-center gap-1.5 text-primary">
                    <Phone className="h-3 w-3" />{r.phone}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Logos compatibilité ────────────────────────── */}
      <section className="py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-xs font-semibold text-text-muted uppercase tracking-[0.2em] mb-6">
            Exportez vos prospects en un clic vers
          </p>
          <div className="flex items-center justify-center gap-12 opacity-60">
            <div className="flex items-center gap-2">
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="#23A566"/><path d="M14 2v6h6" fill="#169E53"/><path d="M8 13h8M8 16h8M8 10h3" stroke="white" strokeWidth="1.2" strokeLinecap="round"/></svg>
              <span className="text-sm font-bold text-text">Google Sheets</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4" fill="#000"/><path d="M6.5 6.5h5l4.5 6V7h1.5v11H13l-4.5-6.5V18H6.5V6.5z" fill="white"/></svg>
              <span className="text-sm font-bold text-text">Notion</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4" fill="#2563EB"/><path d="M7 8h10M7 12h10M7 16h6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
              <span className="text-sm font-bold text-text">CSV / Excel</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Fonctionnalités clés ──────────────────────── */}
      <section id="fonctionnalites" className="py-20 px-4 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-bold uppercase tracking-[0.15em] bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent mb-3">Fonctionnalités</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-text mb-4">
              Tout ce qu&apos;il faut pour<br />décrocher des missions
            </h2>
            <p className="text-text-secondary max-w-lg mx-auto">ProspectWeb n&apos;est pas un simple annuaire. C&apos;est une vraie machine à prospects.</p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Search, color: 'from-blue-500 to-cyan-500',
                title: 'Recherche ultra-rapide',
                desc: 'Tapez un métier + ville et obtenez jusqu\'à 60 entreprises sans site web en quelques secondes.',
              },
              {
                icon: BarChart3, color: 'from-red-500 to-orange-500',
                title: 'Score de priorité',
                desc: 'Chaque prospect est noté de 0 à 100 selon 6 critères (note, avis, secteur...). Concentrez-vous sur les meilleurs.',
              },
              {
                icon: Users, color: 'from-purple-500 to-pink-500',
                title: 'Mini-CRM intégré',
                desc: 'Suivez vos prospects : À contacter → Contacté → Intéressé → Signé. Votre pipeline commercial en un coup d\'œil.',
              },
              {
                icon: Download, color: 'from-green-500 to-emerald-500',
                title: 'Export en 1 clic',
                desc: 'Google Sheets, Notion ou CSV. Exportez toute votre liste et commencez à prospecter immédiatement.',
              },
              {
                icon: Target, color: 'from-amber-500 to-orange-500',
                title: 'Fiche entreprise détaillée',
                desc: 'Horaires, photos, avis clients, email, dirigeant — toutes les infos pour personnaliser votre approche.',
              },
              {
                icon: Shield, color: 'from-indigo-500 to-blue-500',
                title: 'Données fiables & légales',
                desc: 'Source : Google Maps API officielle. Données publiques, mises à jour automatiquement, conformes RGPD.',
              },
            ].map((f) => (
              <div key={f.title} className="group rounded-2xl border border-gray-100 bg-white p-6 hover:shadow-xl hover:-translate-y-1 hover:border-primary/20 transition-all duration-300">
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <f.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-text mb-2">{f.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comment ça marche ────────────────────────── */}
      <section id="comment-ca-marche" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-bold uppercase tracking-[0.15em] bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent mb-3">Simple & efficace</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-text">3 étapes pour trouver des clients</h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                number: '01',
                icon: Search,
                title: 'Cherchez',
                desc: '"Plombier Bordeaux", "Coiffeur Nantes"… fonctionne partout en France avec Google Maps.',
              },
              {
                number: '02',
                icon: Filter,
                title: 'On filtre & on score',
                desc: 'Seules les entreprises sans site web apparaissent, classées par score de priorité.',
              },
              {
                number: '03',
                icon: Download,
                title: 'Exportez & prospectez',
                desc: 'CSV, Sheets, Notion. Appelez, envoyez un email, décrochez des contrats.',
              },
            ].map((step) => (
              <div key={step.number} className="relative text-center group">
                <div className="text-6xl font-black bg-gradient-to-b from-primary/15 to-transparent bg-clip-text text-transparent mb-4">{step.number}</div>
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center mx-auto mb-5 shadow-xl shadow-primary/20 group-hover:scale-110 transition-transform">
                  <step.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-text mb-2">{step.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social proof: chiffres ──────────────────── */}
      <section className="py-16 px-4 bg-gradient-to-r from-primary to-purple-600">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
          {[
            { value: '10K+', label: 'Prospects trouvés' },
            { value: '60', label: 'Résultats / recherche' },
            { value: '30s', label: 'Temps de recherche' },
            { value: '×20', label: 'ROI moyen' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-4xl sm:text-5xl font-black mb-1">{s.value}</p>
              <p className="text-sm text-white/70 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TARIFS ─────────────────────────────────────── */}
      <section id="tarifs" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-bold uppercase tracking-[0.15em] bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent mb-3">Tarifs</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-text mb-4">
              Un investissement qui se rembourse<br />dès le premier client
            </h2>
            <p className="text-text-secondary">Sans engagement · Annulez à tout moment · Paiement sécurisé</p>
          </div>

          <LandingPricingSlider isLoggedIn={isLoggedIn} />


          {/* Garantie */}
          <div className="mt-10 text-center">
            <p className="inline-flex items-center gap-2 text-sm text-text-muted bg-gray-50 rounded-full px-5 py-2 border border-gray-100">
              <Shield className="h-4 w-4" />
              Paiement sécurisé par Stripe · Résiliation en 1 clic · Aucun frais caché
            </p>
          </div>
        </div>
      </section>

      {/* ── ROI ──────────────────────────────────────── */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-3xl bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border border-green-200/60 p-10 flex flex-col sm:flex-row items-center gap-10">
            <div className="flex-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-1.5 mb-4">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-bold text-green-700">Rentabilité immédiate</span>
              </div>
              <h3 className="text-2xl font-extrabold text-text mb-3">1 seul client signé = 15 mois d&apos;abonnement</h3>
              <p className="text-text-secondary leading-relaxed">
                Un site vitrine se vend entre <strong className="text-text">600€ et 1 500€</strong>. Avec un abonnement à 39,99€/mois,
                votre ROI est de <strong className="text-green-600">×20</strong> dès le premier contrat.
              </p>
            </div>
            <div className="flex-shrink-0 text-center bg-white rounded-2xl border border-green-100 px-10 py-8 shadow-lg">
              <p className="text-6xl font-black bg-gradient-to-b from-green-500 to-emerald-600 bg-clip-text text-transparent mb-2">×20</p>
              <p className="text-sm font-semibold text-text-muted">ROI moyen</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Témoignages ─────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-bold uppercase tracking-[0.15em] bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent mb-3">Témoignages</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-text">Ils utilisent ProspectWeb au quotidien</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                name: 'Thomas M.', role: 'Freelance web · Lyon', stars: 5,
                content: 'En 20 minutes, j\'ai trouvé 3 restaurants sans site. J\'en ai signé deux. L\'outil remboursé en quelques heures.',
              },
              {
                name: 'Sarah L.', role: 'Agence web · Bordeaux', stars: 5,
                content: 'On l\'utilise chaque semaine. Le score de priorité nous fait gagner un temps fou. Je recommande à 100%.',
              },
              {
                name: 'Karim B.', role: 'Intégrateur · Paris', stars: 5,
                content: 'Le mini-CRM est parfait pour suivre mes prospects. Avant je faisais ça sur Excel, maintenant tout est centralisé.',
              },
            ].map((t) => (
              <div key={t.name} className="rounded-2xl border border-gray-100 bg-white p-7 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-text-secondary mb-5 leading-relaxed italic">&laquo; {t.content} &raquo;</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-text text-sm">{t.name}</p>
                    <p className="text-xs text-text-muted">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────── */}
      <section id="faq" className="py-20 px-4 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-bold uppercase tracking-[0.15em] bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent mb-3">FAQ</p>
            <h2 className="text-3xl font-extrabold text-text">Questions fréquentes</h2>
          </div>
          <div className="space-y-3">
            {[
              {
                q: 'D\'où viennent les données ?',
                a: 'ProspectWeb utilise l\'API officielle Google Maps — la source la plus complète et à jour pour les entreprises françaises. Toutes les informations sont publiquement disponibles.',
              },
              {
                q: 'Est-ce légal pour prospecter ?',
                a: 'Oui. Les données (nom, adresse, téléphone) sont publiques et accessibles à tous. Vous pouvez les utiliser pour de la prospection B2B, en respectant le RGPD dans vos communications.',
              },
              {
                q: 'Puis-je annuler à tout moment ?',
                a: 'Oui, en un clic depuis votre espace "Abonnement". La résiliation prend effet à la fin de la période en cours. Aucun frais caché, jamais.',
              },
              {
                q: 'Le plan gratuit est-il vraiment gratuit ?',
                a: 'Oui, 100%. Vous avez 2 recherches et 5 résultats visibles sans aucune carte bancaire. C\'est fait pour que vous puissiez tester l\'outil avant de vous engager.',
              },
              {
                q: 'Combien de temps pour trouver un client ?',
                a: 'Nos utilisateurs trouvent en moyenne leurs premiers prospects en moins de 5 minutes. La conversion dépend de votre approche commerciale, mais l\'outil vous donne toutes les cartes en main.',
              },
            ].map((item) => (
              <details key={item.q} className="group rounded-2xl border border-gray-200 bg-white overflow-hidden hover:shadow-md transition-shadow">
                <summary className="flex items-center justify-between px-6 py-5 cursor-pointer font-bold text-text hover:bg-gray-50 transition-colors list-none text-sm">
                  {item.q}
                  <ChevronDown className="h-5 w-5 text-text-muted group-open:rotate-180 transition-transform flex-shrink-0" />
                </summary>
                <div className="px-6 pb-5 text-sm text-text-secondary leading-relaxed border-t border-gray-100 pt-4">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Final ───────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative rounded-3xl bg-gradient-to-br from-primary via-purple-600 to-pink-500 p-12 sm:p-16 text-center text-white shadow-2xl shadow-primary/30 overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 leading-tight">
                Prêt à remplir votre<br />carnet de commandes ?
              </h2>
              <p className="text-white/70 mb-8 max-w-md mx-auto text-lg">
                Rejoignez les créateurs web qui trouvent de nouveaux clients chaque semaine avec ProspectWeb.
              </p>
              <Link
                href="/signup"
                className="group inline-flex items-center gap-3 rounded-2xl bg-white px-10 py-5 text-lg font-bold text-primary hover:bg-gray-50 transition-all shadow-xl hover:-translate-y-1"
              >
                <Zap className="h-5 w-5" />
                Commencer gratuitement
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <p className="text-white/40 text-sm mt-4">
                2 recherches offertes · Sans carte bancaire · Résultat en 30 secondes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────── */}
      <footer className="border-t border-gray-100 bg-white py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                  <Globe className="h-4.5 w-4.5 text-white" />
                </div>
                <span className="text-lg font-bold text-text">
                  Prospect<span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">Web</span>
                </span>
              </div>
              <p className="text-sm text-text-muted max-w-xs">Générez une liste de prospects qualifiés avec coordonnées complètes en quelques secondes. Pour commerciaux, freelances, agences et entrepreneurs.</p>
            </div>
            <div className="flex flex-wrap gap-x-10 gap-y-3 text-sm text-text-muted">
              <a href="#fonctionnalites" className="hover:text-text transition-colors">Fonctionnalités</a>
              <a href="#comment-ca-marche" className="hover:text-text transition-colors">Comment ça marche</a>
              <a href="#tarifs" className="hover:text-text transition-colors">Tarifs</a>
              <a href="#faq" className="hover:text-text transition-colors">FAQ</a>
              <Link href="/privacy" className="hover:text-text transition-colors">Confidentialité</Link>
              <Link href="/login" className="hover:text-text transition-colors">Connexion</Link>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-text-muted">&copy; {new Date().getFullYear()} ProspectWeb. Tous droits réservés.</p>
            <p className="text-sm text-text-muted">Made with ❤️ in 🇫🇷</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
