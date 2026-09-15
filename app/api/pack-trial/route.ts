import {
  account,
  database,
  HttpError,
  requireUser,
  route,
  sameOrigin,
} from '@/lib/server';
export const dynamic = 'force-dynamic';
export async function GET() {
  return route(async () => {
    const id = await requireUser();
    const row = await database()
      .prepare('SELECT used FROM pack_trial_usage WHERE user_id = ?')
      .bind(id)
      .first<{ used: number }>();
    return { remaining: Math.max(0, 3 - (row?.used ?? 0)) };
  });
}
export async function POST(request: Request) {
  return route(async () => {
    sameOrigin(request);
    const id = await requireUser();
    if ((await account(id)).plan) return { remaining: null };
    const row = await database()
      .prepare(
        'INSERT INTO pack_trial_usage (user_id, used) VALUES (?, 1) ON CONFLICT(user_id) DO UPDATE SET used = used + 1 WHERE used < 3 RETURNING used',
      )
      .bind(id)
      .first<{ used: number }>();
    if (!row)
      throw new HttpError(
        403,
        'Your three free packs have been used. Choose a plan to create more.',
      );
    return { remaining: 3 - row.used };
  });
}
