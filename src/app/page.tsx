'use client';

import Link from 'next/link';
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
  TrendingUp,
  LayoutDashboard,
  Users,
  BarChart3,
  Shield,
  Target,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function LandingPage() {
  const { profile } = useSupabase();
  const isLoggedIn = !!profile;

  return (
    <div className="min-h-screen bg-white overflow-hidden">

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
              L&apos;outil N°1 de prospection pour créateurs de sites web
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-text leading-[1.1] mb-6 tracking-tight">
            Trouvez des clients{' '}
            <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              en 30 secondes
            </span>
          </h1>

          <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            ProspectWeb identifie automatiquement les <strong className="text-text">entreprises sans site web</strong> dans votre ville.
            Coordonnées, score de priorité, CRM intégré — tout pour closer vos premiers clients.
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
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-bold uppercase tracking-[0.15em] bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent mb-3">Tarifs</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-text mb-4">
              Un investissement qui se rembourse<br />dès le premier client
            </h2>
            <p className="text-text-secondary">Sans engagement · Annulez à tout moment · Paiement sécurisé</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 items-start">

            {/* Gratuit */}
            <div className="rounded-2xl bg-white border border-gray-200 p-8 flex flex-col hover:shadow-lg transition-shadow">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-text mb-1">Gratuit</h3>
                <p className="text-sm text-text-muted">Pour découvrir ProspectWeb</p>
              </div>
              <div className="mb-6">
                <span className="text-5xl font-black text-text">0€</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  '2 recherches maximum',
                  '5 résultats visibles',
                  'Export CSV, Sheets, Notion',
                  'Score de priorité',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-text-secondary">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={isLoggedIn ? '/recherche' : '/signup'}
                className="block text-center rounded-xl border-2 border-gray-200 py-3.5 font-bold text-text hover:bg-gray-50 transition-colors"
              >
                {isLoggedIn ? 'Mon espace' : 'Essayer gratuitement'}
              </Link>
            </div>

            {/* Premium — mis en avant */}
            <div className="relative rounded-2xl bg-gradient-to-br from-primary to-purple-600 p-8 shadow-2xl shadow-primary/30 flex flex-col md:scale-105 md:-mt-4 md:-mb-4">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 px-6 py-1.5 text-xs font-bold text-gray-900 whitespace-nowrap shadow-lg">
                ⭐ LE PLUS POPULAIRE
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-1">Premium</h3>
                <p className="text-sm text-white/60">Pour les créateurs qui veulent des résultats</p>
              </div>
              <div className="mb-2">
                <span className="text-5xl font-black text-white">39,99€</span>
                <span className="text-white/60 ml-1 text-sm">/ mois</span>
              </div>
              <p className="text-xs text-white/40 mb-6">= 1,33€/jour · Sans engagement</p>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  'Recherches illimitées',
                  '60 résultats par recherche',
                  'Coordonnées complètes',
                  'Export CSV, Google Sheets, Notion',
                  'Historique illimité & cliquable',
                  'Score de priorité des prospects',
                  'Mini-CRM intégré',
                  'Onglet "avec site web"',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-white/90">
                    <CheckCircle className="h-4 w-4 text-white flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={isLoggedIn ? '/abonnement' : '/signup'}
                className="block text-center rounded-xl bg-white py-4 font-bold text-primary hover:bg-gray-50 transition-colors text-base shadow-lg"
              >
                {isLoggedIn ? 'Passer à Premium →' : 'Commencer avec Premium →'}
              </Link>
            </div>

            {/* Ultra */}
            <div className="rounded-2xl bg-white border border-gray-200 p-8 flex flex-col relative hover:shadow-lg transition-shadow">
              <div className="absolute -top-3 right-6">
                <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full px-4 py-1 text-xs font-bold text-gray-900 shadow">
                  <Crown className="h-3.5 w-3.5" /> PRO
                </div>
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-bold text-text mb-1">Ultra</h3>
                <p className="text-sm text-text-muted">Pour les agences & freelances pro</p>
              </div>
              <div className="mb-6">
                <span className="text-5xl font-black text-text">59,99€</span>
                <span className="text-text-muted ml-1 text-sm">/ mois</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  'Tout le plan Premium',
                  'Fiche entreprise détaillée',
                  'Nom du dirigeant (Pappers)',
                  'Recherche email automatique',
                  'Génération de brouillon email IA',
                  'Support prioritaire',
                ].map((f, i) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-text-secondary">
                    <CheckCircle className={`h-4 w-4 flex-shrink-0 ${i === 0 ? 'text-primary' : 'text-amber-400'}`} />
                    {i === 0 ? <span className="font-semibold text-text">{f}</span> : f}
                  </li>
                ))}
              </ul>
              <Link
                href={isLoggedIn ? '/abonnement' : '/signup'}
                className="block text-center rounded-xl bg-gray-900 py-3.5 font-bold text-white hover:bg-gray-800 transition-colors"
              >
                {isLoggedIn ? 'Passer à Ultra' : 'Commencer avec Ultra'}
              </Link>
            </div>
          </div>

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
              <p className="text-sm text-text-muted max-w-xs">L&apos;outil de prospection automatique pour les créateurs de sites web en France.</p>
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
