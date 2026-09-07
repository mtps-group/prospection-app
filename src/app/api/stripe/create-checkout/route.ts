import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/client';
import { createOrRetrieveCustomer } from '@/lib/stripe/helpers';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const { priceId } = await request.json().catch(() => ({}));

    // Allowlist : uniquement les 3 tarifs actuellement vendus. Sans elle,
    // n'importe quel price ID du compte Stripe (ancien tarif, prix de test)
    // pouvait etre achete et donnait un plan payant via le webhook.
    const { STRIPE_PLANS } = await import('@/lib/stripe/config');
    const allowedPriceIds: string[] = [
      STRIPE_PLANS.premium.priceId,
      STRIPE_PLANS.ultra.priceId,
      STRIPE_PLANS.agence.priceId,
    ];
    if (!priceId || !allowedPriceIds.includes(priceId)) {
      return NextResponse.json({ error: 'Prix invalide' }, { status: 400 });
    }

    const customerId = await createOrRetrieveCustomer(user.id, user.email!);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/abonnement?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/abonnement?canceled=true`,
      metadata: {
        userId: user.id,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: 'Erreur lors de la creation du paiement' }, { status: 500 });
  }
}
