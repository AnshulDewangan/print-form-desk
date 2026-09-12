import { createClient, type SupabaseClient } from '@supabase/supabase-js';
let client: SupabaseClient | null = null;
export function supabaseBrowser() {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {};
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return (client ??= createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }));
}
