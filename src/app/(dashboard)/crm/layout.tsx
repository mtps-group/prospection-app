'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, BarChart3 } from 'lucide-react';

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStats = pathname === '/crm/stats';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-text flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Users className="h-5 w-5 text-white" />
          </div>
          CRM
        </h1>
        <p className="text-text-secondary mt-2">Pipeline complet de votre prospection</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        <Link
          href="/crm"
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            !isStats
              ? 'bg-white text-primary shadow-sm'
              : 'text-text-muted hover:text-text'
          }`}
        >
          <Users className="h-4 w-4" />
          Mes prospects
        </Link>
        <Link
          href="/crm/stats"
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            isStats
              ? 'bg-white text-primary shadow-sm'
              : 'text-text-muted hover:text-text'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          Statistiques
        </Link>
      </div>

      {/* Contenu de l'onglet */}
      {children}
    </div>
  );
}
