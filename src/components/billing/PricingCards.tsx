'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { fr } from '@/i18n/fr';
import { useSupabase } from '@/providers/SupabaseProvider';
import { useToast } from '@/providers/ToastProvider';
import { STRIPE_PLANS } from '@/lib/stripe/config';
import {
  Check,
  X,
  Crown,
  Zap,
  Globe,
} from 'lucide-react';

const plans = [
  {
    slug: 'free',
    name: fr.billing.gratuit,
    price: '0',
    icon: Globe,
    features: [
      { text: '2 recherches a vie', included: true },
      { text: '5 resultats visibles par recherche', included: true },
      { text: 'Export CSV', included: false },
      { text: 'Export Google Sheets / Notion', included: false },
      { text: 'Fiche entreprise detaillee', included: false },
    ],
  },
  {
    slug: 'premium',
    name: fr.billing.premium,
    price: '39,99',
    icon: Crown,
    popular: true,
    features: [
      { text: 'Recherches illimitees', included: true },
      { text: 'Jusqu\'a 60 resultats par recherche', included: true },
      { text: 'Export CSV', included: true },
      { text: 'Export Google Sheets / Notion', included: true },
      { text: 'Historique illimite', included: true },
      { text: 'Fiche entreprise detaillee', included: false },
    ],
  },
  {
    slug: 'ultra',
    name: fr.billing.ultra,
    price: '79',
    icon: Zap,
    features: [
      { text: 'Tout Premium inclus', included: true },
      { text: 'Fiche entreprise detaillee', included: true },
      { text: 'Horaires, avis, photos', included: true },
      { text: 'Generation brouillon email (bientot)', included: true },
      { text: 'Support prioritaire', included: true },
    ],
  },
];

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
        addToast('Erreur lors de la creation du paiement', 'error');
      }
    } catch {
      addToast('Erreur de connexion', 'error');
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/stripe/create-portal', {
        method: 'POST',
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      addToast('Erreur', 'error');
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {plans.map((plan) => {
        const isCurrentPlan = profile?.plan === plan.slug;
        const Icon = plan.icon;

        return (
          <div
            key={plan.slug}
            className={`relative rounded-2xl border-2 bg-surface p-6 transition-shadow hover:shadow-lg ${
              plan.popular
                ? 'border-primary shadow-md'
                : 'border-border'
            }`}
          >
            {plan.popular && (
              <Badge
                variant="primary"
                className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1"
              >
                {fr.billing.populaire}
              </Badge>
            )}

            <div className="text-center mb-6">
              <Icon
                className={`mx-auto h-10 w-10 mb-3 ${
                  plan.slug === 'ultra'
                    ? 'text-amber-500'
                    : plan.slug === 'premium'
                    ? 'text-primary'
                    : 'text-text-muted'
                }`}
              />
              <h3 className="text-xl font-bold text-text">{plan.name}</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold text-text">{plan.price}€</span>
                {plan.slug !== 'free' && (
                  <span className="text-text-muted">{fr.billing.parMois}</span>
                )}
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  {feature.included ? (
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <X className="h-4 w-4 text-gray-300 flex-shrink-0 mt-0.5" />
                  )}
                  <span
                    className={
                      feature.included ? 'text-text' : 'text-text-muted'
                    }
                  >
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>

            {isCurrentPlan ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={
                  plan.slug !== 'free' ? handleManageSubscription : undefined
                }
              >
                {plan.slug === 'free' ? 'Plan actuel' : fr.billing.gererAbonnement}
              </Button>
            ) : plan.slug === 'free' ? (
              <Button variant="ghost" className="w-full" disabled>
                Plan gratuit
              </Button>
            ) : (
              <Button
                variant={plan.popular ? 'primary' : 'outline'}
                className={`w-full ${plan.popular ? 'animate-pulse-glow' : ''}`}
                loading={loadingPlan === plan.slug}
                onClick={() => handleSubscribe(plan.slug)}
              >
                {plan.slug === 'premium'
                  ? fr.billing.passerAPremium
                  : fr.billing.passerAUltra}
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
