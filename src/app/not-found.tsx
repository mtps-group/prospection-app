import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-black text-primary/20 mb-4">404</div>
        <h1 className="text-2xl font-bold text-text mb-2">Page introuvable</h1>
        <p className="text-text-secondary mb-6">
          La page que vous cherchez n&apos;existe pas ou a ete deplacee.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover transition-colors"
          >
            Retour a l&apos;accueil
          </Link>
          <Link
            href="/recherche"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg border border-border text-text font-medium hover:bg-gray-50 transition-colors"
          >
            Lancer une recherche
          </Link>
        </div>
      </div>
    </div>
  );
}
