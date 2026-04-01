'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useSupabase } from '@/providers/SupabaseProvider';
import { useToast } from '@/providers/ToastProvider';
import { STRIPE_PLANS } from '@/lib/stripe/config';
import { CheckCircle, Crown, Loader2 } from 'lucide-react';

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
      if (data.url) {
        window.location.href = data.url;
      } else {
        addToast('Erreur lors de la création du paiement', 'error');
      }
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
            '2 recherches maximum',
            '5 résultats visibles',
          ].map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-text-secondary">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>
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

      {/* Premium — mis en avant */}
      <div className="relative rounded-2xl bg-gradient-to-br from-primary to-purple-600 border border-transparent p-8 shadow-2xl shadow-primary/25 flex flex-col scale-105">
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
        {currentPlan === 'premium' ? (
          <button
            onClick={handleManageSubscription}
            className="block w-full text-center rounded-xl bg-white/20 border border-white/30 py-3 font-semibold text-white hover:bg-white/30 transition-colors text-sm"
          >
            ✓ Plan actuel · Gérer
          </button>
        ) : currentPlan === 'ultra' ? (
          <div className="block text-center rounded-xl bg-white/10 py-3 font-semibold text-white/60 text-sm">
            Plan inférieur
          </div>
        ) : (
          <button
            onClick={() => handleSubscribe('premium')}
            disabled={loadingPlan === 'premium'}
            className="block w-full text-center rounded-xl bg-white py-3.5 font-bold text-primary hover:bg-gray-50 transition-colors text-base disabled:opacity-70"
          >
            {loadingPlan === 'premium' ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Chargement...
              </span>
            ) : 'Passer à Premium →'}
          </button>
        )}
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
            'Recherches illimitées',
            '60 résultats par recherche',
            'Coordonnées complètes',
            'Export CSV, Google Sheets, Notion',
            'Historique illimité & cliquable',
            'Score de priorité des prospects',
            'Mini-CRM intégré (suivi prospects)',
            'Onglet entreprises avec site web',
            'Fiche entreprise détaillée (photos, avis, horaires)',
            'Nom du dirigeant via Pappers.fr',
            'Fiche détaillée de l\'entreprise',
            'Recherche email automatique',
            'Email de prospection personnalisé',
            'Support prioritaire',
          ].map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-text-secondary">
              <CheckCircle className="h-4 w-4 text-amber-400 flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>
        {currentPlan === 'ultra' ? (
          <button
            onClick={handleManageSubscription}
            className="block w-full text-center rounded-xl border-2 border-amber-400/40 bg-amber-50 py-3 font-semibold text-amber-700 hover:bg-amber-100 transition-colors text-sm"
          >
            ✓ Plan actuel · Gérer
          </button>
        ) : (
          <button
            onClick={() => handleSubscribe('ultra')}
            disabled={loadingPlan === 'ultra'}
            className="block w-full text-center rounded-xl bg-gray-900 py-3 font-bold text-white hover:bg-gray-800 transition-colors disabled:opacity-70"
          >
            {loadingPlan === 'ultra' ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Chargement...
              </span>
            ) : 'Passer à Ultra'}
          </button>
        )}
      </div>

    </div>
  );
}
