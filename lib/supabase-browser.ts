import { createClient, type SupabaseClient } from '@supabase/supabase-js';
let client: SupabaseClient | null = null;
let loading: Promise<SupabaseClient | null> | null = null;
export async function supabaseBrowser() {
  if (client) return client;
  if (!loading)
    loading = fetch('/api/auth/config', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) return null;
        const config = (await response.json()) as {
          enabled?: boolean;
          url?: string;
          key?: string;
        };
        if (!config.enabled || !config.url || !config.key) return null;
        return (client ??= createClient(config.url, config.key, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
          },
        }));
      })
      .catch(() => null);
  return loading;
}
