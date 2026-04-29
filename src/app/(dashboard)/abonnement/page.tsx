'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { PricingCards } from '@/components/billing/PricingCards';
import { useToast } from '@/providers/ToastProvider';
import { useSupabase } from '@/providers/SupabaseProvider';
import { fr } from '@/i18n/fr';
import { CreditCard, Shield, Zap, CheckCircle, Crown } from 'lucide-react';

export default function AbonnementPage() {
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const { profile, refreshProfile } = useSupabase();
  const isEnterprise = profile?.plan === 'entreprise';

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

  if (isEnterprise) {
    return (
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-text flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-lg shadow-primary/20">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            {fr.billing.titre}
          </h1>
          <p className="text-text-secondary mt-2">Votre abonnement actif</p>
        </div>

        <div className="rounded-2xl p-8 border border-indigo-200/50 bg-gradient-to-br from-indigo-50 to-purple-50 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
              <Crown className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-text text-lg">Plan Entreprise</p>
              <p className="text-text-secondary text-sm">Offre sur mesure</p>
            </div>
          </div>
          <div className="mb-6">
            <span className="text-4xl font-black text-text">159€</span>
            <span className="text-text-muted ml-1 text-sm">/ mois</span>
          </div>
          <ul className="space-y-2.5 mb-6">
            {[
              'Recherches illimitées',
              '60 prospects par recherche',
              'Coordonnées complètes',
              'Export Excel, Google Sheets, Notion',
              'Historique illimité',
              'Support prioritaire',
            ].map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-text-secondary">
                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <a
            href="mailto:contact@prospectweb.fr"
            className="block text-center rounded-xl border-2 border-primary/30 bg-primary/5 py-3 font-semibold text-primary text-sm hover:bg-primary/10 transition-colors"
          >
            Contacter le support
          </a>
        </div>
      </div>
    );
  }

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
