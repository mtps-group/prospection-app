import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { createAdminClient } from '@/lib/supabase/admin';
import Stripe from 'stripe';

import { ENTREPRISE_PRICE_ID } from '@/lib/offres/config';

// Résout le plan depuis un price ID
function resolvePlan(priceId: string | null | undefined): 'premium' | 'ultra' | 'agence' | 'entreprise' {
  if (priceId === process.env.STRIPE_ULTRA_PRICE_ID) return 'ultra';
  if (priceId === process.env.STRIPE_AGENCE_PRICE_ID) return 'agence';
  if (priceId === ENTREPRISE_PRICE_ID) return 'entreprise';
  return 'premium';
}

// Trouve le user_id via stripe_customer_id — fiable même si subscriptions est vide
async function getUserIdByCustomer(supabase: ReturnType<typeof createAdminClient>, customerId: string): Promise<string | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();
  return data?.id ?? null;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {

      // ── Paiement checkout réussi ─────────────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        if (!subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const subItem = subscription.items.data[0];
        const priceId = subItem?.price.id;
        const plan = resolvePlan(priceId);

        // userId depuis metadata OU depuis stripe_customer_id (double filet)
        const resolvedUserId = userId ?? await getUserIdByCustomer(supabase, customerId);
        if (!resolvedUserId) {
          console.error('checkout.session.completed: userId introuvable', { userId, customerId });
          break;
        }

        await supabase.from('profiles').update({ plan }).eq('id', resolvedUserId);

        await supabase.from('subscriptions').upsert({
          id: subscriptionId,
          user_id: resolvedUserId,
          status: subscription.status,
          price_id: priceId,
          current_period_start: subItem ? new Date(subItem.current_period_start * 1000).toISOString() : new Date().toISOString(),
          current_period_end: subItem ? new Date(subItem.current_period_end * 1000).toISOString() : new Date().toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
        });

        console.log(`✅ Plan mis à jour → ${plan} pour user ${resolvedUserId}`);
        break;
      }

      // ── Abonnement créé (backup de checkout.session.completed) ───────────
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const subItem = subscription.items.data[0];
        const priceId = subItem?.price.id;
        const plan = resolvePlan(priceId);
        const customerId = subscription.customer as string;

        // Chercher user_id dans subscriptions d'abord, puis fallback sur profiles
        let userId: string | null = null;
        const { data: existingSub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('id', subscription.id)
          .single();

        userId = existingSub?.user_id ?? await getUserIdByCustomer(supabase, customerId);

        if (!userId) {
          // Dernier recours : récupérer le customer Stripe pour avoir supabase_user_id
          const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
          userId = customer.metadata?.supabase_user_id ?? null;
        }

        if (!userId) {
          console.error(`${event.type}: userId introuvable pour customer ${customerId}`);
          break;
        }

        if (subscription.status === 'active' || subscription.status === 'trialing') {
          await supabase.from('profiles').update({ plan }).eq('id', userId);
        }

        await supabase.from('subscriptions').upsert({
          id: subscription.id,
          user_id: userId,
          status: subscription.status,
          price_id: priceId,
          current_period_start: subItem ? new Date(subItem.current_period_start * 1000).toISOString() : new Date().toISOString(),
          current_period_end: subItem ? new Date(subItem.current_period_end * 1000).toISOString() : new Date().toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        });

        console.log(`✅ ${event.type}: plan ${plan} pour user ${userId}`);
        break;
      }

      // ── Abonnement annulé ────────────────────────────────────────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        let userId: string | null = null;
        const { data: existingSub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('id', subscription.id)
          .single();

        userId = existingSub?.user_id ?? await getUserIdByCustomer(supabase, customerId);

        if (userId) {
          await supabase.from('profiles').update({ plan: 'free' }).eq('id', userId);
        }

        await supabase.from('subscriptions').update({
          status: 'canceled',
          updated_at: new Date().toISOString(),
        }).eq('id', subscription.id);

        console.log(`✅ Abonnement annulé, retour free pour user ${userId}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.error('Paiement échoué pour customer:', invoice.customer);
        break;
      }
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
