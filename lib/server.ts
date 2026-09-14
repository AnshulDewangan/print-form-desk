import { env } from 'cloudflare:workers';
import { headers } from 'next/headers';
import { PLANS, isPlan, type Account } from './plans';

type Runtime = {
  DB?: D1Database;
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
  RAZORPAY_WEBHOOK_SECRET?: string;
  BILLING_ENABLED?: string;
  BILLING_MODE?: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
};
export const runtime = () => env as unknown as Runtime;
export function database() {
  const db = runtime().DB;
  if (!db) throw new HttpError(503, 'Account storage is not connected yet.');
  return db;
}
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function userId() {
  const h = await headers();
  const token = h.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  const r = runtime();
  if (!token || !r.SUPABASE_URL || !r.SUPABASE_ANON_KEY) return null;
  try {
    const result = await fetch(`${r.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: r.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!result.ok) return null;
    const user = (await result.json()) as { id?: string };
    return typeof user.id === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        user.id,
      )
      ? `supabase:${user.id}`
      : null;
  } catch {
    return null;
  }
}
export async function requireUser() {
  const id = await userId();
  if (!id) throw new HttpError(401, 'Sign in to continue.');
  return id;
}
export function billingMode() {
  return runtime().BILLING_MODE === 'live' ? 'live' : 'test';
}
export function billingReady() {
  const r = runtime();
  return (
    r.BILLING_ENABLED === 'true' &&
    !!r.DB &&
    !!r.RAZORPAY_KEY_SECRET &&
    !!r.RAZORPAY_WEBHOOK_SECRET &&
    !!r.RAZORPAY_KEY_ID?.startsWith(`rzp_${billingMode()}_`)
  );
}
export async function account(id: string | null): Promise<Account> {
  const base: Account = {
    signedIn: !!id,
    plan: null,
    expiresAt: null,
    billingReady: billingReady(),
    testMode: billingMode() === 'test',
    storageReady: !!runtime().DB,
    templatesUsed: 0,
    templateLimit: null,
    orders: [],
  };
  if (!id || !runtime().DB) return base;
  const templateRow = await database()
    .prepare('SELECT COUNT(*) AS n FROM templates WHERE user_id = ?')
    .bind(id)
    .first<{ n: number }>();
  const orderRows = await database()
    .prepare(
      'SELECT o.id, o.plan, o.amount, o.created_at, o.refunded, g.expires_at FROM orders o LEFT JOIN grants g ON g.order_id = o.id WHERE o.user_id = ? AND o.mode = ? ORDER BY o.created_at DESC LIMIT 5',
    )
    .bind(id, billingMode())
    .all<{
      id: string;
      plan: string;
      amount: number;
      created_at: number;
      refunded: number;
      expires_at: number | null;
    }>();
  const row = await database()
    .prepare(
      "SELECT g.plan, g.expires_at FROM grants g JOIN orders o ON o.id = g.order_id WHERE g.user_id = ? AND g.mode = ? AND g.expires_at > ? AND o.refunded = 0 ORDER BY CASE g.plan WHEN 'shop' THEN 0 ELSE 1 END, g.expires_at DESC LIMIT 1",
    )
    .bind(id, billingMode(), Date.now())
    .first<{ plan: string; expires_at: number }>();
  const orders = orderRows.results.flatMap((order) =>
    isPlan(order.plan)
      ? [
          {
            id: order.id,
            plan: order.plan,
            amount: order.amount,
            createdAt: order.created_at,
            refunded: order.refunded === 1,
            active:
              order.refunded !== 1 &&
              typeof order.expires_at === 'number' &&
              order.expires_at > Date.now(),
          },
        ]
      : [],
  );
  const accountBase = {
    ...base,
    templatesUsed: templateRow?.n ?? 0,
    orders,
  };
  if (row && isPlan(row.plan))
    return {
      ...accountBase,
      plan: row.plan,
      expiresAt: row.expires_at,
      templateLimit: PLANS[row.plan].templates,
    };
  return accountBase;
}
export async function paidUser() {
  const id = await requireUser(),
    a = await account(id);
  if (!a.plan)
    throw new HttpError(403, 'An active Personal or Shop pass is required.');
  return { id, account: a, limit: PLANS[a.plan].templates };
}
export function sameOrigin(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin)
    throw new HttpError(403, 'Please submit from this website.');
}
export async function jsonBody(request: Request) {
  const body = await request.text();
  if (body.length > 16000)
    throw new HttpError(413, 'This request is too large.');
  try {
    return JSON.parse(body);
  } catch {
    throw new HttpError(400, 'Invalid request.');
  }
}
export function response(value: unknown, status = 200) {
  return Response.json(value, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}
export async function route(fn: () => Promise<unknown>) {
  try {
    return response(await fn());
  } catch (error) {
    if (error instanceof HttpError)
      return response({ error: error.message }, error.status);
    console.error('Account operation failed');
    return response(
      { error: 'This service is temporarily unavailable. Please try again.' },
      503,
    );
  }
}
