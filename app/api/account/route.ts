import { account, route, userId } from '@/lib/server';
export const dynamic = 'force-dynamic';
export async function GET() {
  return route(async () => account(await userId()));
}
