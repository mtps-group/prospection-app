'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <AlertTriangle className="mx-auto h-16 w-16 text-amber-500 mb-4" />
        <h1 className="text-2xl font-bold text-text mb-2">Une erreur est survenue</h1>
        <p className="text-text-secondary mb-6">
          Quelque chose s&apos;est mal passe. Veuillez reessayer ou contacter le support si le probleme persiste.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover transition-colors"
          >
            Reessayer
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg border border-border text-text font-medium hover:bg-gray-50 transition-colors"
          >
            Retour a l&apos;accueil
          </a>
        </div>
      </div>
    </div>
  );
}
