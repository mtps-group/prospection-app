import { notFound } from 'next/navigation';
import { OFFRES_PRIVEES } from '@/lib/offres/config';
import { OffreForm } from './OffreForm';
import { CheckCircle, Globe, Shield, Zap } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function OffrePage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const offre = OFFRES_PRIVEES[slug];

  if (!offre) notFound();

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0a0a18 0%, #0f0f2e 40%, #0d0020 100%)' }}
    >
      {/* Glow décoratif */}
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20 blur-3xl" style={{ background: 'radial-gradient(circle, #4f46e5, transparent)' }} />

      <div className="w-full max-w-md relative">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">
              Prospect<span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Web</span>
            </span>
          </div>
          <div className="inline-flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3 py-1">
            <Shield className="h-3 w-3 text-indigo-400" />
            <span className="text-xs text-indigo-300 font-medium">Offre privée — accès restreint</span>
          </div>
        </div>

        {/* Carte principale */}
        <div
          className="rounded-2xl p-8 border"
          style={{
            background: 'rgba(255,255,255,0.04)',
            borderColor: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.1)',
          }}
        >
          {/* En-tête offre */}
          <div className="mb-6">
            <p className="text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-1">
              {offre.nomOffre}
            </p>
            <div className="flex items-end gap-2 mb-1">
              <span className="text-5xl font-black text-white">{offre.prix}€</span>
              <span className="text-white/40 text-sm mb-2">/ mois</span>
            </div>
            <p className="text-white/30 text-xs">Sans engagement · Résiliez à tout moment</p>
          </div>

          {/* Features */}
          <ul className="space-y-2.5 mb-8">
            {offre.features.map(f => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-white/75">
                <CheckCircle className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>

          {/* Séparateur */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-white/25 text-xs">Créez votre compte pour commencer</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {/* Formulaire */}
          <OffreForm offre={offre} slug={slug} />
        </div>

        {/* Trust signals */}
        <div className="flex items-center justify-center gap-6 mt-6">
          <div className="flex items-center gap-1.5 text-xs text-white/25">
            <Shield className="h-3.5 w-3.5" />
            Paiement sécurisé Stripe
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/25">
            <Zap className="h-3.5 w-3.5" />
            Accès immédiat après paiement
          </div>
        </div>
      </div>
    </div>
  );
}
