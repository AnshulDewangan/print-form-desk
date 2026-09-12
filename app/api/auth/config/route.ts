import { runtime, response } from '@/lib/server';
export function GET() {
  const r = runtime() as { SUPABASE_URL?: string; SUPABASE_ANON_KEY?: string };
  return response({
    enabled: !!r.SUPABASE_URL && !!r.SUPABASE_ANON_KEY,
    url: r.SUPABASE_URL ?? null,
    key: r.SUPABASE_ANON_KEY ?? null,
  });
}
