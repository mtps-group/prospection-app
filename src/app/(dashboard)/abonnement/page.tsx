'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { PricingCards } from '@/components/billing/PricingCards';
import { PREMIUM_TRIAL_DAYS } from '@/lib/stripe/config';
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
      if (searchParams.get('trial') === 'true') {
        const firstCharge = new Date(Date.now() + PREMIUM_TRIAL_DAYS * 24 * 60 * 60 * 1000)
          .toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
        addToast(`Votre essai Premium de ${PREMIUM_TRIAL_DAYS} jours a commencé ! Aucun prélèvement avant le ${firstCharge}.`, 'success');
      } else {
        addToast('Abonnement activé avec succès !', 'success');
      }
      // Le webhook Stripe peut arriver une ou deux secondes après la
      // redirection : on relit le profil une seconde fois pour afficher
      // le bon plan sans que l'utilisateur ait à recharger la page.
      refreshProfile();
      setTimeout(() => refreshProfile(), 3000);
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
