import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { createAdminClient } from '@/lib/supabase/admin';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const subscriptionId = session.subscription as string;

        if (!userId) break;

        // Get subscription details to determine plan
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const subItem = subscription.items.data[0];
        const priceId = subItem?.price.id;

        // Determine which plan based on price ID
        let plan = 'premium';
        if (priceId === process.env.STRIPE_ULTRA_PRICE_ID) {
          plan = 'ultra';
        }

        // Update profile plan
        await supabase
          .from('profiles')
          .update({ plan })
          .eq('id', userId);

        // Create subscription record
        // In Stripe SDK v20+, current_period is on SubscriptionItem, not Subscription
        await supabase.from('subscriptions').upsert({
          id: subscriptionId,
          user_id: userId,
          status: subscription.status,
          price_id: priceId,
          current_period_start: subItem ? new Date(subItem.current_period_start * 1000).toISOString() : new Date().toISOString(),
          current_period_end: subItem ? new Date(subItem.current_period_end * 1000).toISOString() : new Date().toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
        });

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const subItem = subscription.items.data[0];
        const priceId = subItem?.price.id;

        let plan = 'premium';
        if (priceId === process.env.STRIPE_ULTRA_PRICE_ID) {
          plan = 'ultra';
        }

        // Update subscription record
        // In Stripe SDK v20+, current_period is on SubscriptionItem, not Subscription
        await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            price_id: priceId,
            current_period_start: subItem ? new Date(subItem.current_period_start * 1000).toISOString() : undefined,
            current_period_end: subItem ? new Date(subItem.current_period_end * 1000).toISOString() : undefined,
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          })
          .eq('id', subscription.id);

        // Update profile plan if subscription is active
        if (subscription.status === 'active') {
          const { data: sub } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('id', subscription.id)
            .single();

          if (sub) {
            await supabase
              .from('profiles')
              .update({ plan })
              .eq('id', sub.user_id);
          }
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        // Downgrade to free
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('id', subscription.id)
          .single();

        if (sub) {
          await supabase
            .from('profiles')
            .update({ plan: 'free' })
            .eq('id', sub.user_id);
        }

        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('id', subscription.id);

        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.error('Payment failed for customer:', invoice.customer);
        break;
      }
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
