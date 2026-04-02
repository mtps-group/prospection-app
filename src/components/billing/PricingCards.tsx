'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { useSupabase } from '@/providers/SupabaseProvider';
import { useToast } from '@/providers/ToastProvider';
import { STRIPE_PLANS } from '@/lib/stripe/config';
import { CheckCircle, Crown, Loader2 } from 'lucide-react';

// ── Carte 3D avec effet tilt au survol ────────────────────────────────────────
function Card3D({
  children,
  className = '',
  intensity = 12,
}: {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');
  const [shine, setShine] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotX = (y - 0.5) * -intensity;
    const rotY = (x - 0.5) * intensity;
    setTransform(
      `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(8px)`
    );
    setShine({ x: x * 100, y: y * 100, opacity: 0.12 });
  }, [intensity]);

  const handleMouseLeave = useCallback(() => {
    setTransform('perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0px)');
    setShine({ x: 50, y: 50, opacity: 0 });
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: transform || 'perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0px)',
        transition: transform ? 'transform 0.08s ease-out' : 'transform 0.4s ease-out',
        willChange: 'transform',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Reflet lumineux qui suit la souris */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl z-10"
        style={{
          background: `radial-gradient(circle at ${shine.x}% ${shine.y}%, rgba(255,255,255,${shine.opacity * 2.5}) 0%, transparent 65%)`,
          transition: 'opacity 0.15s',
        }}
      />
      {children}
    </div>
  );
}

// ── Composant principal ────────────────────────────────────────────────────────
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
    <div className="grid gap-8 md:grid-cols-3 items-center" style={{ perspective: '1200px' }}>

      {/* ── GRATUIT ─────────────────────────────────────────────────────────── */}
      <Card3D
        intensity={10}
        className="relative rounded-2xl bg-white border border-gray-200 p-8 flex flex-col overflow-hidden"
        style={{
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 10px 30px -5px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.04)',
        } as React.CSSProperties}
      >
        {/* Fond décoratif */}
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

      {/* ── PREMIUM (mis en avant) ───────────────────────────────────────────── */}
      <Card3D
        intensity={14}
        className="relative rounded-2xl bg-gradient-to-br from-primary via-indigo-600 to-purple-600 border border-transparent p-8 flex flex-col overflow-hidden scale-105"
        style={{
          boxShadow: '0 8px 16px -2px rgba(99,102,241,0.35), 0 20px 50px -8px rgba(99,102,241,0.4), 0 0 0 1px rgba(99,102,241,0.2), inset 0 1px 0 rgba(255,255,255,0.15)',
        } as React.CSSProperties}
      >
        {/* Badge */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 rounded-full bg-amber-400 px-5 py-1.5 text-xs font-bold text-gray-900 whitespace-nowrap shadow-lg shadow-amber-400/30">
          ⭐ LE PLUS POPULAIRE
        </div>

        {/* Cercles décoratifs */}
        <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-white/5" />
        <div className="absolute top-1/2 -right-4 h-16 w-16 rounded-full bg-white/5" />

        {/* Ligne de brillance en haut */}
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
              className="block w-full text-center rounded-xl bg-white py-3.5 font-bold text-primary hover:bg-gray-50 transition-all hover:scale-[1.02] active:scale-[0.98] text-base disabled:opacity-70 shadow-lg shadow-black/10"
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

      {/* ── ULTRA ───────────────────────────────────────────────────────────── */}
      <Card3D
        intensity={10}
        className="relative rounded-2xl p-8 flex flex-col overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3), 0 10px 30px -5px rgba(0,0,0,0.4), 0 0 0 1px rgba(251,191,36,0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
        } as React.CSSProperties}
      >
        {/* Cercles décoratifs */}
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #f59e0b, transparent)' }} />
        <div className="absolute -bottom-8 -left-6 h-24 w-24 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #a855f7, transparent)' }} />

        {/* Ligne dorée en haut */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

        {/* Icône couronne */}
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
              className="block w-full text-center rounded-xl py-3 font-bold text-gray-900 hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 shadow-lg shadow-amber-400/20"
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

    </div>
  );
}
