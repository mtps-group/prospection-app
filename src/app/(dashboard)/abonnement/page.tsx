'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { PricingCards } from '@/components/billing/PricingCards';
import { useToast } from '@/providers/ToastProvider';
import { useSupabase } from '@/providers/SupabaseProvider';
import { fr } from '@/i18n/fr';
import { CreditCard, Shield, Zap } from 'lucide-react';

export default function AbonnementPage() {
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const { refreshProfile } = useSupabase();

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      addToast('Abonnement activé avec succès !', 'success');
      refreshProfile();
    }
    if (searchParams.get('canceled') === 'true') {
      addToast('Paiement annulé', 'info');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-text flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-lg shadow-primary/20">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            {fr.billing.titre}
          </h1>
          <p className="text-text-secondary mt-2">
            Choisissez le plan qui correspond à vos besoins de prospection
          </p>
        </div>
      </div>

      <PricingCards />

      {/* Trust signals */}
      <div className="flex flex-wrap items-center justify-center gap-6 pt-4">
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <Shield className="h-4 w-4" />
          Paiement sécurisé Stripe
        </div>
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <Zap className="h-4 w-4" />
          Activation instantanée
        </div>
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <CreditCard className="h-4 w-4" />
          Résiliation en 1 clic
        </div>
      </div>
    </div>
  );
}
