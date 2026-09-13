import { runtime, response } from '@/lib/server';
export async function GET() {
  const r = runtime() as { SUPABASE_URL?: string; SUPABASE_ANON_KEY?: string };
  let googleEnabled = false;
  if (r.SUPABASE_URL && r.SUPABASE_ANON_KEY) {
    try {
      const settings = await fetch(`${r.SUPABASE_URL}/auth/v1/settings`, {
        headers: { apikey: r.SUPABASE_ANON_KEY },
        signal: AbortSignal.timeout(5000),
      });
      if (settings.ok)
        googleEnabled =
          ((await settings.json()) as { external?: { google?: boolean } })
            .external?.google === true;
    } catch {
      /* Email remains available while provider discovery recovers. */
    }
  }
  return response({
    googleEnabled,
    enabled: !!r.SUPABASE_URL && !!r.SUPABASE_ANON_KEY,
    url: r.SUPABASE_URL ?? null,
    key: r.SUPABASE_ANON_KEY ?? null,
  });
}
