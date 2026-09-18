'use client';

import { useState } from 'react';
import { Crown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/providers/ToastProvider';
import { useTrialEligible } from '@/hooks/useTrialEligible';
import { STRIPE_PLANS, PREMIUM_TRIAL_DAYS } from '@/lib/stripe/config';

interface StartTrialButtonProps {
  /** 'button' = gros bouton CTA ; 'link' = lien souligné dans une phrase */
  variant?: 'button' | 'link';
  className?: string;
}

/**
 * CTA du paywall : envoie directement vers le paiement Stripe de Premium
 * mensuel (avec l'essai si l'utilisateur y a droit), sans détour par la page
 * des tarifs — chaque clic en moins compte à ce moment-là.
 */
export function StartTrialButton({ variant = 'button', className }: StartTrialButtonProps) {
  const eligible = useTrialEligible();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const label = eligible
    ? `Essayer Premium ${PREMIUM_TRIAL_DAYS} jours gratuitement`
    : 'Passer à Premium';

  const start = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: STRIPE_PLANS.premium.priceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      addToast(data.error || 'Impossible de lancer le paiement', 'error');
    } catch {
      addToast('Erreur de connexion', 'error');
    }
    setLoading(false);
  };

  if (variant === 'link') {
    return (
      <button
        type="button"
        onClick={start}
        disabled={loading}
        className={`font-bold underline inline-flex items-center gap-1 disabled:opacity-60 ${className ?? ''}`}
      >
        {loading && <Loader2 className="h-3 w-3 animate-spin" />}
        {label} →
      </button>
    );
  }

  return (
    <div className={className}>
      <Button size="lg" className="animate-pulse-glow" onClick={start} disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
        {label}
      </Button>
      {eligible && (
        <p className="mt-2 text-xs text-text-muted">
          Puis {STRIPE_PLANS.premium.priceMonthly} €/mois · Annulable en 1 clic avant la fin de l&apos;essai
        </p>
      )}
    </div>
  );
}
