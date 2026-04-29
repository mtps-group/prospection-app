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

    const { priceId, successUrl, cancelUrl } = await request.json();

    if (!priceId) {
      return NextResponse.json({ error: 'Prix requis' }, { status: 400 });
    }

    const customerId = await createOrRetrieveCustomer(user.id, user.email!);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}${successUrl ?? '/abonnement?success=true'}`,
      cancel_url: `${appUrl}${cancelUrl ?? '/abonnement?canceled=true'}`,
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
