'use client';

import { useState } from 'react';
import { Card3D } from '@/components/ui/Card3D';
import { useSupabase } from '@/providers/SupabaseProvider';
import { useToast } from '@/providers/ToastProvider';
import { STRIPE_PLANS } from '@/lib/stripe/config';
import { CheckCircle, Crown, Loader2, Mic } from 'lucide-react';

export function PricingCards() {
  const { profile } = useSupabase();
  const { addToast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = async (planSlug: string) => {
    const stripePlan = STRIPE_PLANS[planSlug as keyof typeof STRIPE_PLANS];
    if (!stripePlan) return;
    setLoadingPlan(planSlug);
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: stripePlan.priceId }),
      });
      const data = await response.json();
      if (data.url) window.location.href = data.url;
      else addToast('Erreur lors de la création du paiement', 'error');
    } catch {
      addToast('Erreur de connexion', 'error');
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/stripe/create-portal', { method: 'POST' });
      const data = await response.json();
      if (data.url) window.location.href = data.url;
    } catch {
      addToast('Erreur', 'error');
    }
  };

  const currentPlan = profile?.plan || 'free';

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 items-center" style={{ perspective: '1200px' }}>

      {/* ── GRATUIT ─────────────────────────────────────────────────────────── */}
      <Card3D
        intensity={6}
        className="relative rounded-2xl bg-white border border-gray-200 p-8 flex flex-col overflow-hidden"
        style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 10px 30px -5px rgba(0,0,0,0.1)' }}
      >
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gray-100 opacity-60" />
        <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-gray-50 opacity-80" />

        <div className="relative mb-6">
          <h3 className="text-lg font-bold text-text mb-1">Gratuit</h3>
          <p className="text-sm text-text-muted">Pour tester sans risque</p>
        </div>
        <div className="relative mb-6">
          <span className="text-4xl font-black text-text">0€</span>
          <span className="text-text-muted ml-1 text-sm">/ mois</span>
        </div>
        <ul className="relative space-y-3 mb-8 flex-1">
          {['2 recherches maximum', '5 résultats visibles'].map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-text-secondary">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>
        <div className="relative">
          {currentPlan === 'free' ? (
            <div className="block text-center rounded-xl border-2 border-primary/30 bg-primary-light py-3 font-semibold text-primary text-sm">
              ✓ Plan actuel
            </div>
          ) : (
            <div className="block text-center rounded-xl border-2 border-gray-200 py-3 font-semibold text-text-muted text-sm">
              Plan gratuit
            </div>
          )}
        </div>
      </Card3D>

      {/* ── PREMIUM ─────────────────────────────────────────────────────────── */}
      {/* Wrapper sans overflow pour que le badge ne soit pas coupé */}
      <div className="relative scale-105">
        {/* Badge HORS de la carte pour éviter overflow-hidden */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 rounded-full bg-amber-400 px-5 py-1.5 text-xs font-bold text-gray-900 whitespace-nowrap shadow-lg shadow-amber-400/30 pointer-events-none">
          ⭐ LE PLUS POPULAIRE
        </div>

        <Card3D
          intensity={8}
          className="relative rounded-2xl bg-gradient-to-br from-primary via-indigo-600 to-purple-600 p-8 flex flex-col overflow-hidden"
          style={{ boxShadow: '0 8px 16px -2px rgba(99,102,241,0.35), 0 20px 50px -8px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.15)' }}
        >
          <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-white/5" />
          <div className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-white/5" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

          <div className="relative mb-6 mt-2">
            <h3 className="text-lg font-bold text-white mb-1">Premium</h3>
            <p className="text-sm text-white/70">Pour les créateurs actifs</p>
          </div>
          <div className="relative mb-2">
            <span className="text-4xl font-black text-white">39,99€</span>
            <span className="text-white/70 ml-1 text-sm">/ mois</span>
          </div>
          <p className="relative text-xs text-white/50 mb-6">Sans engagement · Résiliez à tout moment</p>
          <ul className="relative space-y-3 mb-8 flex-1">
            {[
              'Recherches illimitées',
              '60 résultats par recherche',
              'Coordonnées complètes',
              'Export CSV, Google Sheets, Notion',
              'Historique illimité & cliquable',
              'Score de priorité des prospects',
              'Mini-CRM intégré (suivi prospects)',
              'Onglet entreprises avec site web',
            ].map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-white/90">
                <CheckCircle className="h-4 w-4 text-white flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <div className="relative">
            {currentPlan === 'premium' ? (
              <button
                onClick={handleManageSubscription}
                className="block w-full text-center rounded-xl bg-white/20 border border-white/30 py-3 font-semibold text-white hover:bg-white/30 transition-colors text-sm"
              >
                ✓ Plan actuel · Gérer
              </button>
            ) : currentPlan === 'ultra' ? (
              <div className="block text-center rounded-xl bg-white/10 py-3 font-semibold text-white/50 text-sm">
                Plan inférieur
              </div>
            ) : (
              <button
                onClick={() => handleSubscribe('premium')}
                disabled={loadingPlan === 'premium'}
                className="block w-full text-center rounded-xl bg-white py-3.5 font-bold text-primary hover:bg-gray-50 transition-all text-base disabled:opacity-70 shadow-lg shadow-black/10"
              >
                {loadingPlan === 'premium' ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Chargement...
                  </span>
                ) : 'Passer à Premium →'}
              </button>
            )}
          </div>
        </Card3D>
      </div>

      {/* ── ULTRA ───────────────────────────────────────────────────────────── */}
      <Card3D
        intensity={6}
        className="relative rounded-2xl p-8 flex flex-col overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3), 0 10px 30px -5px rgba(0,0,0,0.4), 0 0 0 1px rgba(251,191,36,0.15)',
        }}
      >
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #f59e0b, transparent)' }} />
        <div className="absolute -bottom-8 -left-6 h-24 w-24 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #a855f7, transparent)' }} />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

        <div className="absolute top-5 right-5 z-10">
          <div className="h-8 w-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
            <Crown className="h-4 w-4 text-amber-400" />
          </div>
        </div>

        <div className="relative mb-6">
          <h3 className="text-lg font-bold text-white mb-1">Ultra</h3>
          <p className="text-sm text-white/50">Pour les agences &amp; freelances pro</p>
        </div>
        <div className="relative mb-6">
          <span className="text-4xl font-black text-white">59,99€</span>
          <span className="text-white/50 ml-1 text-sm">/ mois</span>
        </div>
        <ul className="relative space-y-3 mb-8 flex-1">
          {[
            'Tout le plan Premium',
            'Photos, avis & horaires détaillés',
            'Fiche de présentation de l\'entreprise',
            'Recherche email automatique',
            'Recherche du dirigeant',
            'Email de prospection personnalisé',
            'Support prioritaire',
          ].map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-white/80">
              <CheckCircle className="h-4 w-4 text-amber-400 flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>
        <div className="relative">
          {currentPlan === 'ultra' ? (
            <button
              onClick={handleManageSubscription}
              className="block w-full text-center rounded-xl border border-amber-400/30 bg-amber-400/10 py-3 font-semibold text-amber-400 hover:bg-amber-400/20 transition-colors text-sm"
            >
              ✓ Plan actuel · Gérer
            </button>
          ) : (
            <button
              onClick={() => handleSubscribe('ultra')}
              disabled={loadingPlan === 'ultra'}
              className="block w-full text-center rounded-xl py-3 font-bold text-gray-900 hover:opacity-90 transition-all disabled:opacity-70 shadow-lg shadow-amber-400/20"
              style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #f59e0b 100%)' }}
            >
              {loadingPlan === 'ultra' ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Chargement...
                </span>
              ) : 'Passer à Ultra'}
            </button>
          )}
        </div>
      </Card3D>

      {/* ── AGENCE ──────────────────────────────────────────────────────────── */}
      <Card3D
        intensity={6}
        className="relative rounded-2xl p-8 flex flex-col overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #0d0015 0%, #1a0030 50%, #0d001a 100%)',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.4), 0 10px 30px -5px rgba(0,0,0,0.5), 0 0 0 1px rgba(167,139,250,0.2)',
        }}
      >
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #a855f7, transparent)' }} />
        <div className="absolute -bottom-8 -left-6 h-24 w-24 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/60 to-transparent" />

        <div className="absolute top-5 right-5 z-10">
          <div className="h-8 w-8 rounded-lg bg-violet-400/10 border border-violet-400/20 flex items-center justify-center">
            <Mic className="h-4 w-4 text-violet-400" />
          </div>
        </div>

        <div className="relative mb-6">
          <h3 className="text-lg font-bold text-white mb-1">Agence</h3>
          <p className="text-sm text-white/50">Pour les commerciaux & agences</p>
        </div>
        <div className="relative mb-6">
          <span className="text-4xl font-black text-white">179€</span>
          <span className="text-white/50 ml-1 text-sm">/ mois</span>
        </div>
        <ul className="relative space-y-3 mb-8 flex-1">
          {[
            'Tout le plan Ultra',
            'Analyse IA de vos appels',
            'Score appel & prospect /10',
            'Transcription complète',
            'Objections & signaux détectés',
            'Style de communication analysé',
            'Email de suivi auto-rédigé',
          ].map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-white/80">
              <CheckCircle className="h-4 w-4 text-violet-400 flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>
        <div className="relative">
          {currentPlan === 'agence' ? (
            <button
              onClick={handleManageSubscription}
              className="block w-full text-center rounded-xl border border-violet-400/30 bg-violet-400/10 py-3 font-semibold text-violet-400 hover:bg-violet-400/20 transition-colors text-sm"
            >
              ✓ Plan actuel · Gérer
            </button>
          ) : (
            <button
              onClick={() => handleSubscribe('agence')}
              disabled={loadingPlan === 'agence'}
              className="block w-full text-center rounded-xl py-3 font-bold text-white hover:opacity-90 transition-all disabled:opacity-70 shadow-lg shadow-violet-500/30"
              style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #7c3aed 100%)' }}
            >
              {loadingPlan === 'agence' ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Chargement...
                </span>
              ) : 'Passer à Agence'}
            </button>
          )}
        </div>
      </Card3D>

    </div>
  );
}
