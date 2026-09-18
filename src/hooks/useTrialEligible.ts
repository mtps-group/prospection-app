'use client';

import { useEffect, useState } from 'react';
import { useSupabase } from '@/providers/SupabaseProvider';

/**
 * L'utilisateur peut-il encore profiter de l'essai Premium gratuit ?
 *
 * Indication d'affichage seulement : le serveur (create-checkout) revérifie
 * dans Stripe avant d'accorder l'essai. Pendant le chargement on suppose
 * l'essai disponible, c'est le cas de la quasi-totalité des comptes gratuits.
 */
export function useTrialEligible(): boolean {
  const { supabase, user, profile } = useSupabase();
  const [hadSubscription, setHadSubscription] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .then(({ count }) => setHadSubscription((count ?? 0) > 0));
  }, [supabase, user]);

  return profile?.plan === 'free' && hadSubscription !== true;
}
