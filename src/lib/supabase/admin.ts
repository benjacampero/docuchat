import { createClient } from "@supabase/supabase-js";

/**
 * Creates an admin Supabase client.
 * Uses service_role key if available, otherwise falls back to anon key.
 * The service_role key bypasses RLS - use with caution.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey || anonKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
