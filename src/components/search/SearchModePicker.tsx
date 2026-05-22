'use client';

import { Globe, Calendar, Lock, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useSupabase } from '@/providers/SupabaseProvider';

export type SearchMode = 'places' | 'companies';

interface SearchModePickerProps {
  onSelect: (mode: SearchMode) => void;
}

export function SearchModePicker({ onSelect }: SearchModePickerProps) {
  const { profile, loading } = useSupabase();
  const isUltraPlus = profile?.plan === 'ultra' || profile?.plan === 'agence';

  // Tant que le profil n'est pas charge, on ne rend rien (evite le flash 'lock' et le skeleton lent)
  // La page reste lisible (header, etc.) pendant ces ~200ms
  if (loading || !profile) {
    return null;
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Mode 1 : Recherche standard Google Places */}
      <button
        onClick={() => onSelect('places')}
        className="group relative overflow-hidden rounded-2xl border-2 border-gray-200 dark:border-violet-500/20 bg-white p-6 text-left transition-all hover:border-primary hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5"
      >
        <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br from-blue-500/10 to-cyan-500/10 group-hover:from-blue-500/20 group-hover:to-cyan-500/20 transition-colors" />
        <div className="relative space-y-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Globe className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-text mb-1">Toutes les entreprises</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Recherche classique par activité et ville.<br />
              Idéal pour explorer un marché géographique.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <Tag>📍 Géolocalisé</Tag>
            <Tag>📞 Coordonnées</Tag>
            <Tag>⭐ Avis Google</Tag>
          </div>
          <div className="pt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:gap-2.5 transition-all">
            Commencer
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </button>

      {/* Mode 2 : Recherche par date de creation (Ultra+) */}
      {isUltraPlus ? (
        <button
          onClick={() => onSelect('companies')}
          className="group relative overflow-hidden rounded-2xl border-2 border-violet-300 dark:border-violet-500/40 bg-gradient-to-br from-violet-50 to-pink-50 dark:from-violet-500/10 dark:to-pink-500/10 p-6 text-left transition-all hover:border-violet-500 hover:shadow-lg hover:shadow-violet-500/20 hover:-translate-y-0.5"
        >
          <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br from-violet-500/20 to-pink-500/20 group-hover:from-violet-500/30 group-hover:to-pink-500/30 transition-colors" />
          <div className="absolute top-3 right-3 z-10 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 px-2 py-0.5 text-[10px] font-bold text-gray-900 shadow-md">
            <Sparkles className="h-3 w-3" />
            NOUVEAU
          </div>
          <div className="relative space-y-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text mb-1">Entreprises récentes</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Cible les sociétés créées récemment.<br />
                Elles n&apos;ont souvent <strong>pas encore de site web</strong>.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <Tag highlight>📅 Date de création</Tag>
              <Tag>🏛️ Forme juridique</Tag>
              <Tag>👤 Dirigeant</Tag>
            </div>
            <div className="pt-2 inline-flex items-center gap-1.5 text-sm font-bold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent group-hover:gap-2.5 transition-all">
              Découvrir
              <ArrowRight className="h-4 w-4 text-violet-600" />
            </div>
          </div>
        </button>
      ) : (
        <Link
          href="/abonnement"
          className="group relative overflow-hidden rounded-2xl border-2 border-amber-300 dark:border-amber-500/30 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 p-6 text-left transition-all hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/20 hover:-translate-y-0.5 block"
        >
          <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20" />
          <div className="absolute top-3 right-3 z-10 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 px-2.5 py-1 text-[10px] font-bold text-gray-900 shadow-md">
            <Lock className="h-3 w-3" />
            ULTRA
          </div>
          <div className="relative space-y-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-lg shadow-violet-500/30 opacity-90">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text mb-1">Entreprises récentes</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Cible les sociétés créées récemment.<br />
                Elles n&apos;ont souvent <strong>pas encore de site web</strong>.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1 opacity-75">
              <Tag highlight>📅 Date de création</Tag>
              <Tag>🏛️ Forme juridique</Tag>
              <Tag>👤 Dirigeant</Tag>
            </div>
            <div className="pt-2 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 px-3 py-1.5 text-xs font-bold text-gray-900 shadow-md group-hover:scale-105 transition-transform">
              <Lock className="h-3 w-3" />
              Passer à Ultra
              <ArrowRight className="h-3 w-3" />
            </div>
          </div>
        </Link>
      )}
    </div>
  );
}

function Tag({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
      highlight
        ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-300 dark:border-violet-500/40'
        : 'bg-gray-100 dark:bg-white/5 text-text-secondary border border-gray-200 dark:border-violet-500/15'
    }`}>
      {children}
    </span>
  );
}
