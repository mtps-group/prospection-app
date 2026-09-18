import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/client';
import { createOrRetrieveCustomer } from '@/lib/stripe/helpers';
import { STRIPE_PLANS, PREMIUM_TRIAL_DAYS } from '@/lib/stripe/config';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Session expirée, reconnectez-vous.' }, { status: 401 });
    }

    const { priceId } = await request.json().catch(() => ({}));

    // Allowlist : uniquement les tarifs actuellement vendus (mensuels et
    // annuels). Sans elle, n'importe quel price ID du compte Stripe (ancien
    // tarif, prix de test) pouvait etre achete et donnait un plan payant via
    // le webhook.
    const allowedPriceIds: string[] = [
      STRIPE_PLANS.premium.priceId,
      STRIPE_PLANS.premium.priceIdYearly,
      STRIPE_PLANS.ultra.priceId,
      STRIPE_PLANS.ultra.priceIdYearly,
      STRIPE_PLANS.agence.priceId,
      STRIPE_PLANS.agence.priceIdYearly,
    ];
    if (!priceId || !allowedPriceIds.includes(priceId)) {
      return NextResponse.json({ error: 'Prix invalide' }, { status: 400 });
    }

    const customerId = await createOrRetrieveCustomer(user.id, user.email!);

    // Essai gratuit : Premium uniquement, et une seule fois par client.
    // Stripe fait foi (la table subscriptions a pu manquer des evenements
    // quand le webhook etait mal configure).
    const isPremium =
      priceId === STRIPE_PLANS.premium.priceId ||
      priceId === STRIPE_PLANS.premium.priceIdYearly;
    let withTrial = false;
    if (isPremium) {
      const previous = await stripe.subscriptions.list({
        customer: customerId,
        status: 'all',
        limit: 1,
      });
      withTrial = previous.data.length === 0;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      // La carte est toujours demandee, meme pendant l'essai : le premier
      // prelevement part automatiquement a la fin des 7 jours.
      payment_method_collection: 'always',
      ...(withTrial && {
        subscription_data: {
          trial_period_days: PREMIUM_TRIAL_DAYS,
          metadata: { userId: user.id },
        },
      }),
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/abonnement?success=true${withTrial ? '&trial=true' : ''}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/abonnement?canceled=true`,
      metadata: {
        userId: user.id,
      },
    });

    return NextResponse.json({ url: session.url, trial: withTrial });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: 'Erreur lors de la creation du paiement' }, { status: 500 });
  }
}
