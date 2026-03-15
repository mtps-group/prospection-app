import { stripe } from './client';
import { createAdminClient } from '@/lib/supabase/admin';

export async function createOrRetrieveCustomer(userId: string, email: string) {
  const supabase = createAdminClient();

  // Check if customer already exists in our DB
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (profile?.stripe_customer_id) {
    return profile.stripe_customer_id;
  }

  // Create a new Stripe customer
  const customer = await stripe.customers.create({
    email,
    metadata: {
      supabase_user_id: userId,
    },
  });

  // Save the Stripe customer ID in our DB
  await supabase
    .from('profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', userId);

  return customer.id;
}
