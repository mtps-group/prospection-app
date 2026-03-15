'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { PricingCards } from '@/components/billing/PricingCards';
import { useToast } from '@/providers/ToastProvider';
import { useSupabase } from '@/providers/SupabaseProvider';
import { fr } from '@/i18n/fr';
import { CreditCard } from 'lucide-react';

export default function AbonnementPage() {
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const { refreshProfile } = useSupabase();

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      addToast('Abonnement active avec succes !', 'success');
      refreshProfile();
    }
    if (searchParams.get('canceled') === 'true') {
      addToast('Paiement annule', 'info');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-primary" />
          {fr.billing.titre}
        </h1>
        <p className="text-text-secondary mt-1">
          Choisissez le plan qui correspond a vos besoins de prospection
        </p>
      </div>

      <PricingCards />
    </div>
  );
}
