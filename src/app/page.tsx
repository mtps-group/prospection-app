import Link from 'next/link';
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
  FileSpreadsheet,
  BookOpen,
  TrendingUp,
  Clock,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Navbar ────────────────────────────────────── */}
      <nav className="border-b border-gray-100 bg-white/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Globe className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold text-text">
              Prospect<span className="text-primary">Web</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#comment-ca-marche" className="text-sm font-medium text-text-secondary hover:text-text transition-colors">Comment ça marche</a>
            <a href="#tarifs" className="text-sm font-medium text-text-secondary hover:text-text transition-colors">Tarifs</a>
            <a href="#faq" className="text-sm font-medium text-text-secondary hover:text-text transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-text-secondary hover:text-text transition-colors">
              Connexion
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover transition-colors shadow-sm"
            >
              Essayer gratuitement
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────── */}
      <section className="pt-16 pb-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-4 py-1.5 mb-5">
            <span className="text-sm font-semibold text-amber-700">
              🇫🇷 N°1 des outils de prospection web francophones
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-text leading-tight mb-5">
            Trouvez des entreprises{' '}
            <span className="text-primary">sans site web</span>
            {' '}en 30 secondes
          </h1>

          <p className="text-lg text-text-secondary max-w-xl mx-auto mb-8">
            Tapez un métier + une ville → obtenez instantanément la liste des
            prospects avec leurs coordonnées. Plus besoin de chercher manuellement sur Google Maps.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-5">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-lg font-bold text-white hover:bg-primary-hover transition-all shadow-lg shadow-primary/30 hover:-translate-y-0.5"
            >
              Commencer gratuitement
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#tarifs"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-200 px-8 py-4 text-lg font-semibold text-text hover:bg-gray-50 transition-colors"
            >
              Voir les tarifs
              <ChevronDown className="h-5 w-5" />
            </a>
          </div>

        </div>

        {/* Mockup résultats */}
        <div className="max-w-3xl mx-auto mt-10">
          <div className="rounded-2xl border border-gray-200 shadow-xl overflow-hidden bg-white">
            <div className="bg-gray-50 border-b border-gray-200 px-5 py-3 flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2 flex-1">
                <Search className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-500">Restaurant · Lyon</span>
              </div>
              <div className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">Rechercher</div>
            </div>
            <div className="p-5 grid gap-3 sm:grid-cols-2">
              {[
                { name: 'Le Bistrot du Vieux Lyon', address: '12 Rue Mercière, Lyon', phone: '04 78 XX XX XX' },
                { name: 'Brasserie des Quais', address: '5 Quai Saint-Antoine, Lyon', phone: '04 78 XX XX XX' },
                { name: 'Pizza Marco', address: '34 Rue de la République, Lyon', phone: '04 72 XX XX XX' },
                { name: 'Café de la Mairie', address: '2 Place des Terreaux, Lyon', phone: '04 78 XX XX XX' },
              ].map((r, i) => (
                <div key={i} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-semibold text-text text-sm">{r.name}</p>
                    <span className="rounded-full bg-red-100 text-red-600 text-xs font-semibold px-2 py-0.5 flex-shrink-0">Sans site</span>
                  </div>
                  <p className="text-xs text-text-secondary flex items-center gap-1.5 mb-1">
                    <MapPin className="h-3 w-3" />{r.address}
                  </p>
                  <p className="text-xs text-primary font-medium flex items-center gap-1.5">
                    <Phone className="h-3 w-3" />{r.phone}
                  </p>
                </div>
              ))}
            </div>
            <div className="px-5 pb-4 text-center">
              <p className="text-sm font-semibold text-primary">🎯 47 entreprises sans site web trouvées en 28 secondes</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats rapides ────────────────────────────── */}
      <section className="py-10 px-4 bg-primary">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
          {[
            { value: '60', label: 'prospects par recherche' },
            { value: '30s', label: 'pour obtenir les résultats' },
            { value: '800€', label: 'prix moyen d\'un site vitrine' },
            { value: '×20', label: 'ROI moyen de l\'outil' },
          ].map((stat) => (
            <div key={stat.value}>
              <p className="text-3xl font-black mb-1">{stat.value}</p>
              <p className="text-sm text-white/70">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Comment ça marche ────────────────────────── */}
      <section id="comment-ca-marche" className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-text">3 étapes, c'est tout</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { number: '1', icon: Search, title: 'Cherchez par métier & ville', desc: '"Plombier Bordeaux", "Coiffeur Nantes"… fonctionne partout en France.' },
              { number: '2', icon: Filter, title: 'On filtre automatiquement', desc: 'Seules les entreprises sans site web apparaissent — avec leurs coordonnées.' },
              { number: '3', icon: Download, title: 'Exportez & décrochez des missions', desc: 'CSV, Google Sheets ou Notion. Contactez vos prospects immédiatement.' },
            ].map((step) => (
              <div key={step.number} className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
                <div className="h-12 w-12 rounded-xl bg-primary-light flex items-center justify-center mx-auto mb-4">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-text mb-2">{step.title}</h3>
                <p className="text-sm text-text-secondary">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TARIFS (section principale) ──────────────── */}
      <section id="tarifs" className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Tarifs transparents</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-text mb-3">
              Commencez gratuitement,<br />évoluez quand vous êtes prêt
            </h2>
            <p className="text-text-secondary">Sans engagement · Résiliez à tout moment</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">

            {/* Gratuit */}
            <div className="rounded-2xl bg-white border border-gray-200 p-8 flex flex-col">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-text mb-1">Gratuit</h3>
                <p className="text-sm text-text-muted">Pour tester sans risque</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-black text-text">0€</span>
                <span className="text-text-muted ml-1 text-sm">/ mois</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  '2 recherches à vie',
                  '5 résultats visibles',
                  'Coordonnées de base',
                  'Aucune carte requise',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-text-secondary">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block text-center rounded-xl border-2 border-gray-200 py-3 font-semibold text-text hover:bg-gray-50 transition-colors"
              >
                Commencer gratuitement
              </Link>
            </div>

            {/* Premium — mis en avant */}
            <div className="relative rounded-2xl bg-primary border border-primary p-8 shadow-2xl shadow-primary/25 flex flex-col scale-105">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-5 py-1.5 text-xs font-bold text-gray-900 whitespace-nowrap shadow-lg">
                ⭐ LE PLUS POPULAIRE
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-1">Premium</h3>
                <p className="text-sm text-white/70">Pour les créateurs actifs</p>
              </div>
              <div className="mb-2">
                <span className="text-4xl font-black text-white">39,99€</span>
                <span className="text-white/70 ml-1 text-sm">/ mois</span>
              </div>
              <p className="text-xs text-white/60 mb-6">Sans engagement · Résiliez à tout moment</p>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  'Recherches illimitées',
                  '60 résultats par recherche',
                  'Coordonnées complètes',
                  'Recherche email (PagesJaunes)',
                  'Export CSV',
                  'Export Google Sheets',
                  'Export Notion',
                  'Historique illimité',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/90">
                    <CheckCircle className="h-4 w-4 text-white flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block text-center rounded-xl bg-white py-3.5 font-bold text-primary hover:bg-gray-50 transition-colors text-base"
              >
                Commencer avec Premium →
              </Link>
            </div>

            {/* Ultra */}
            <div className="rounded-2xl bg-white border border-gray-200 p-8 flex flex-col relative">
              <div className="absolute top-4 right-4">
                <Crown className="h-5 w-5 text-amber-400" />
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-bold text-text mb-1">Ultra</h3>
                <p className="text-sm text-text-muted">Pour les agences & freelances pro</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-black text-text">59,99€</span>
                <span className="text-text-muted ml-1 text-sm">/ mois</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  'Tout le plan Premium',
                  'Fiche entreprise détaillée',
                  'Photos de l\'établissement',
                  'Avis clients Google',
                  'Horaires d\'ouverture',
                  'Génération d\'emails IA',
                  'Support prioritaire',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-text-secondary">
                    <CheckCircle className="h-4 w-4 text-amber-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block text-center rounded-xl bg-gray-900 py-3 font-bold text-white hover:bg-gray-800 transition-colors"
              >
                Commencer avec Ultra
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ── Argument rentabilité (après tarifs) ──────── */}
      <section className="py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-8 flex flex-col sm:flex-row items-center gap-8">
            <div className="flex-1 text-center sm:text-left">
              <TrendingUp className="h-8 w-8 text-green-600 mb-3 mx-auto sm:mx-0" />
              <h3 className="text-xl font-bold text-text mb-2">1 client signé = l'abonnement remboursé</h3>
              <p className="text-sm text-text-secondary">
                Un site vitrine se vend en moyenne entre <strong>600€ et 1 500€</strong>. Avec un abonnement à 39,99€/mois,
                il suffit d'un seul contrat pour rentabiliser l'outil <strong>plus de 15 fois.</strong>
              </p>
            </div>
            <div className="flex-shrink-0 text-center bg-white rounded-2xl border border-green-100 px-8 py-6 shadow-sm">
              <p className="text-5xl font-black text-green-600 mb-1">×20</p>
              <p className="text-sm text-text-muted">ROI moyen</p>
              <p className="text-xs text-text-muted">(site à 800€ / 39,99€)</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Témoignages ─────────────────────────────── */}
      <section className="py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-text">Ce que disent nos utilisateurs</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                name: 'Thomas M.', role: 'Freelance web · Lyon', stars: 5,
                content: '«&nbsp;En 20 minutes, j\'ai trouvé 3 restaurants sans site. J\'en ai signé deux. L\'outil remboursé en quelques heures.&nbsp;»',
              },
              {
                name: 'Sarah L.', role: 'Agence web · Bordeaux', stars: 5,
                content: '«&nbsp;On l\'utilise chaque semaine. L\'export Notion nous fait gagner un temps fou. Je recommande à 100%.&nbsp;»',
              },
              {
                name: 'Karim B.', role: 'Intégrateur · Paris', stars: 5,
                content: '«&nbsp;La recherche email automatique est une tuerie. Avant je passais des heures. Maintenant c\'est en un clic.&nbsp;»',
              },
            ].map((t) => (
              <div key={t.name} className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-text-secondary mb-4 leading-relaxed" dangerouslySetInnerHTML={{ __html: t.content }} />
                <div>
                  <p className="font-semibold text-text text-sm">{t.name}</p>
                  <p className="text-xs text-text-muted">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────── */}
      <section id="faq" className="py-14 px-4 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-text">Questions fréquentes</h2>
          </div>
          <div className="space-y-3">
            {[
              {
                q: 'D\'où viennent les données ?',
                a: 'ProspectWeb utilise l\'API Google Maps — la source la plus complète et à jour pour les entreprises françaises. Toutes les informations sont publiquement disponibles.',
              },
              {
                q: 'Est-ce légal pour prospecter ?',
                a: 'Oui. Les données (nom, adresse, téléphone) sont publiques. Vous pouvez les utiliser pour de la prospection B2B, en respectant le RGPD dans vos communications.',
              },
              {
                q: 'La recherche d\'email fonctionne-t-elle à chaque fois ?',
                a: 'Non, le taux de succès dépend des entreprises. PagesJaunes ne référence pas tous les emails. En moyenne, vous en trouverez pour 20 à 40% des prospects.',
              },
              {
                q: 'Puis-je annuler à tout moment ?',
                a: 'Oui, depuis votre espace "Abonnement". La résiliation prend effet à la fin de la période en cours. Aucun frais caché.',
              },
            ].map((item) => (
              <details key={item.q} className="group rounded-xl border border-gray-200 bg-white overflow-hidden">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-semibold text-text hover:bg-gray-50 transition-colors list-none text-sm">
                  {item.q}
                  <ChevronDown className="h-4 w-4 text-text-muted group-open:rotate-180 transition-transform flex-shrink-0" />
                </summary>
                <div className="px-5 pb-4 text-sm text-text-secondary leading-relaxed border-t border-gray-100 pt-3">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Final ───────────────────────────────── */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-3xl bg-gradient-to-br from-primary to-primary-hover p-10 text-center text-white shadow-2xl shadow-primary/30">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Prêt à remplir votre pipeline ?
            </h2>
            <p className="text-white/80 mb-7 max-w-md mx-auto">
              Rejoignez des centaines de créateurs web qui trouvent de nouveaux clients chaque semaine.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-primary hover:bg-gray-100 transition-colors"
            >
              <Zap className="h-5 w-5" />
              Commencer gratuitement
            </Link>
            <p className="text-white/50 text-xs mt-3">
              2 recherches offertes · Sans carte bancaire
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────── */}
      <footer className="border-t border-gray-100 bg-gray-50 py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" />
            <span className="text-base font-bold text-text">
              Prospect<span className="text-primary">Web</span>
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-5 text-sm text-text-muted">
            <a href="#comment-ca-marche" className="hover:text-text transition-colors">Comment ça marche</a>
            <a href="#tarifs" className="hover:text-text transition-colors">Tarifs</a>
            <a href="#faq" className="hover:text-text transition-colors">FAQ</a>
            <Link href="/login" className="hover:text-text transition-colors">Connexion</Link>
            <Link href="/signup" className="hover:text-text transition-colors">S'inscrire</Link>
          </div>
          <p className="text-sm text-text-muted">&copy; {new Date().getFullYear()} ProspectWeb · Made in 🇫🇷</p>
        </div>
      </footer>

    </div>
  );
}
