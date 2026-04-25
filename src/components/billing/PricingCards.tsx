'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card3D } from '@/components/ui/Card3D';
import { useSupabase } from '@/providers/SupabaseProvider';
import { useToast } from '@/providers/ToastProvider';
import { STRIPE_PLANS } from '@/lib/stripe/config';
import { CheckCircle, Crown, Loader2, Mic, ChevronLeft, ChevronRight } from 'lucide-react';

const GAP = 24;
const CARD_NAMES = ['Gratuit', 'Premium', 'Ultra', 'Agence'];

export function PricingCards() {
  const { profile } = useSupabase();
  const { addToast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
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
  const isPaidHigher = (plan: string) =>
    (plan === 'premium' && (currentPlan === 'ultra' || currentPlan === 'agence')) ||
    (plan === 'ultra' && currentPlan === 'agence');

  return (
    <div className="relative mx-0 sm:mx-8">

      {/* ── Flèche gauche ── */}
      <button
        onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
        className={`absolute left-2 sm:-left-8 top-1/2 -translate-y-1/2 z-30 flex items-center gap-1.5 bg-white rounded-full p-2 sm:pl-2 sm:pr-3 sm:py-2.5 shadow-lg border border-gray-200 text-xs font-semibold text-text-secondary hover:text-primary hover:border-primary/30 transition-all duration-200 ${!canPrev ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">{CARD_NAMES[currentIndex - 1]}</span>
      </button>

      {/* ── Flèche droite ── */}
      <button
        onClick={() => setCurrentIndex(i => Math.min(totalPositions - 1, i + 1))}
        className={`absolute right-2 sm:-right-8 top-1/2 -translate-y-1/2 z-30 flex items-center gap-1.5 bg-white rounded-full p-2 sm:pl-3 sm:pr-2 sm:py-2.5 shadow-lg border border-gray-200 text-xs font-semibold text-text-secondary hover:text-violet-600 hover:border-violet-200 transition-all duration-200 ${!canNext ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <span className="hidden sm:inline">{canNext ? CARD_NAMES[currentIndex + visibleCount] : ''}</span>
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* ── Track (mesuré ici pour avoir la vraie largeur visible) ── */}
      <div ref={trackRef} className="overflow-hidden pt-8">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ gap: GAP, transform: `translateX(-${translateX}px)` }}
        >

          {/* ── GRATUIT ── */}
          <div style={{ width: cw, minWidth: cw, flexShrink: 0 }}>
            <Card3D intensity={6} className="relative rounded-2xl bg-white border border-gray-200 p-8 flex flex-col overflow-hidden" style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 10px 30px -5px rgba(0,0,0,0.1)', minHeight: 680 }}>
              <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-gray-100 opacity-60" />
              <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-gray-50 opacity-80" />
              <div className="relative mb-6">
                <h3 className="text-xl font-bold text-text mb-1">Gratuit</h3>
                <p className="text-sm text-text-muted">Pour tester sans risque</p>
              </div>
              <div className="relative mb-6">
                <span className="text-5xl font-black text-text">0€</span>
                <span className="text-text-muted ml-1 text-sm">/ mois</span>
              </div>
              <ul className="relative space-y-4 mb-8 flex-1">
                {['2 recherches maximum', '5 résultats visibles', 'Score de priorité des prospects'].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-text-secondary">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <div className="relative">
                {currentPlan === 'free'
                  ? <div className="block text-center rounded-xl border-2 border-primary/30 bg-primary-light py-3.5 font-semibold text-primary text-sm">✓ Plan actuel</div>
                  : <div className="block text-center rounded-xl border-2 border-gray-200 py-3.5 font-semibold text-text-muted text-sm">Plan gratuit</div>
                }
              </div>
            </Card3D>
          </div>

          {/* ── PREMIUM ── */}
          <div style={{ width: cw, minWidth: cw, flexShrink: 0 }}>
            <div className="relative">
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20 rounded-full bg-amber-400 px-5 py-1.5 text-xs font-bold text-gray-900 whitespace-nowrap shadow-lg shadow-amber-400/30 pointer-events-none">
                ⭐ LE PLUS POPULAIRE
              </div>
              <Card3D intensity={8} className="relative rounded-2xl bg-gradient-to-br from-primary via-indigo-600 to-purple-600 p-8 flex flex-col overflow-hidden" style={{ boxShadow: '0 8px 16px -2px rgba(99,102,241,0.35), 0 20px 50px -8px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.15)', minHeight: 680 }}>
                <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-white/5" />
                <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                <div className="relative mb-6 mt-2">
                  <h3 className="text-xl font-bold text-white mb-1">Premium</h3>
                  <p className="text-sm text-white/70">Pour les créateurs actifs</p>
                </div>
                <div className="relative mb-2">
                  <span className="text-5xl font-black text-white">39,99€</span>
                  <span className="text-white/70 ml-1 text-sm">/ mois</span>
                </div>
                <p className="relative text-xs text-white/50 mb-6">Sans engagement · Résiliez à tout moment</p>
                <ul className="relative space-y-4 mb-8 flex-1">
                  {['Recherches illimitées', '60 résultats par recherche', 'Coordonnées complètes', 'Export CSV, Google Sheets, Notion', 'Historique illimité & cliquable', 'Score de priorité des prospects', 'Mini-CRM intégré (suivi prospects)', 'Onglet entreprises avec site web'].map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-white/90">
                      <CheckCircle className="h-4 w-4 text-white flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <div className="relative">
                  {currentPlan === 'premium'
                    ? <button onClick={handleManageSubscription} className="block w-full text-center rounded-xl bg-white/20 border border-white/30 py-3.5 font-semibold text-white hover:bg-white/30 transition-colors text-sm">✓ Plan actuel · Gérer</button>
                    : isPaidHigher('premium')
                    ? <div className="block text-center rounded-xl bg-white/10 py-3.5 font-semibold text-white/50 text-sm">Plan inférieur</div>
                    : <button onClick={() => handleSubscribe('premium')} disabled={loadingPlan === 'premium'} className="block w-full text-center rounded-xl bg-white py-3.5 font-bold text-primary hover:bg-gray-50 transition-all text-base disabled:opacity-70 shadow-lg shadow-black/10">
                        {loadingPlan === 'premium' ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Chargement...</span> : 'Passer à Premium →'}
                      </button>
                  }
                </div>
              </Card3D>
            </div>
          </div>

          {/* ── ULTRA ── */}
          <div style={{ width: cw, minWidth: cw, flexShrink: 0 }}>
            <Card3D intensity={6} className="relative rounded-2xl p-8 flex flex-col overflow-hidden" style={{ background: 'linear-gradient(145deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3), 0 10px 30px -5px rgba(0,0,0,0.4), 0 0 0 1px rgba(251,191,36,0.15)', minHeight: 680 }}>
              <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #f59e0b, transparent)' }} />
              <div className="absolute -bottom-8 -left-6 h-24 w-24 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #a855f7, transparent)' }} />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
              <div className="absolute top-5 right-5 z-10">
                <div className="h-8 w-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
                  <Crown className="h-4 w-4 text-amber-400" />
                </div>
              </div>
              <div className="relative mb-6">
                <h3 className="text-xl font-bold text-white mb-1">Ultra</h3>
                <p className="text-sm text-white/50">Pour les agences &amp; freelances pro</p>
              </div>
              <div className="relative mb-6">
                <span className="text-5xl font-black text-white">59,99€</span>
                <span className="text-white/50 ml-1 text-sm">/ mois</span>
              </div>
              <ul className="relative space-y-4 mb-8 flex-1">
                {['Tout le plan Premium', 'Photos, avis & horaires détaillés', "Fiche de présentation de l'entreprise", 'Recherche email automatique', 'Recherche du dirigeant', 'Email de prospection personnalisé', 'Support prioritaire'].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-white/80">
                    <CheckCircle className="h-4 w-4 text-amber-400 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <div className="relative">
                {currentPlan === 'ultra'
                  ? <button onClick={handleManageSubscription} className="block w-full text-center rounded-xl border border-amber-400/30 bg-amber-400/10 py-3.5 font-semibold text-amber-400 hover:bg-amber-400/20 transition-colors text-sm">✓ Plan actuel · Gérer</button>
                  : isPaidHigher('ultra')
                  ? <div className="block text-center rounded-xl bg-white/10 py-3.5 font-semibold text-white/50 text-sm">Plan inférieur</div>
                  : <button onClick={() => handleSubscribe('ultra')} disabled={loadingPlan === 'ultra'} className="block w-full text-center rounded-xl py-3.5 font-bold text-gray-900 hover:opacity-90 transition-all disabled:opacity-70 shadow-lg shadow-amber-400/20 text-base" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #f59e0b 100%)' }}>
                      {loadingPlan === 'ultra' ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Chargement...</span> : 'Passer à Ultra'}
                    </button>
                }
              </div>
            </Card3D>
          </div>

          {/* ── AGENCE ── */}
          <div style={{ width: cw, minWidth: cw, flexShrink: 0 }}>
            <Card3D intensity={6} className="relative rounded-2xl p-8 flex flex-col overflow-hidden" style={{ background: 'linear-gradient(145deg, #0d0015 0%, #1a0030 50%, #0d001a 100%)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.4), 0 10px 30px -5px rgba(0,0,0,0.5), 0 0 0 1px rgba(167,139,250,0.2)', minHeight: 680 }}>
              <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #a855f7, transparent)' }} />
              <div className="absolute -bottom-8 -left-6 h-24 w-24 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/60 to-transparent" />
              <div className="absolute top-5 right-5 z-10">
                <div className="h-8 w-8 rounded-lg bg-violet-400/10 border border-violet-400/20 flex items-center justify-center">
                  <Mic className="h-4 w-4 text-violet-400" />
                </div>
              </div>
              <div className="relative mb-6">
                <h3 className="text-xl font-bold text-white mb-1">Agence</h3>
                <p className="text-sm text-white/50">Pour les commerciaux &amp; agences</p>
              </div>
              <div className="relative mb-6">
                <span className="text-5xl font-black text-white">179€</span>
                <span className="text-white/50 ml-1 text-sm">/ mois</span>
              </div>
              <ul className="relative space-y-4 mb-8 flex-1">
                {['Tout le plan Ultra', 'Analyse IA de vos appels', 'Score appel & prospect /10', 'Transcription complète', 'Objections & signaux détectés', 'Style de communication analysé', 'Email de suivi auto-rédigé'].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-white/80">
                    <CheckCircle className="h-4 w-4 text-violet-400 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <div className="relative">
                {currentPlan === 'agence'
                  ? <button onClick={handleManageSubscription} className="block w-full text-center rounded-xl border border-violet-400/30 bg-violet-400/10 py-3.5 font-semibold text-violet-400 hover:bg-violet-400/20 transition-colors text-sm">✓ Plan actuel · Gérer</button>
                  : <button onClick={() => handleSubscribe('agence')} disabled={loadingPlan === 'agence'} className="block w-full text-center rounded-xl py-3.5 font-bold text-white hover:opacity-90 transition-all disabled:opacity-70 shadow-lg shadow-violet-500/30 text-base" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #7c3aed 100%)' }}>
                      {loadingPlan === 'agence' ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Chargement...</span> : 'Passer à Agence'}
                    </button>
                }
              </div>
            </Card3D>
          </div>

        </div>
      </div>

      {/* ── Dots ── */}
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
