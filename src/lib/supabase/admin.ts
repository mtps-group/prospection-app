import { createClient } from '@supabase/supabase-js';

// Admin client bypasses Row Level Security
// Only use in server-side code (webhooks, admin operations)
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
