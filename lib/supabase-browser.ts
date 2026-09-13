import { createClient, type SupabaseClient } from '@supabase/supabase-js';
let client: SupabaseClient | null = null;
let googleEnabled = false;
export function hasGoogleSignIn() {
  return googleEnabled;
}
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
          googleEnabled?: boolean;
        };
        if (!config.enabled || !config.url || !config.key) return null;
        googleEnabled = config.googleEnabled === true;
        return (client ??= createClient(config.url, config.key, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
          },
        }));
      })
      .catch(() => null)
      .finally(() => {
        loading = null;
      });
  return loading;
}
