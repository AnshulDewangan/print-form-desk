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
  // These identity headers are provided by the Sites dispatcher, never by form fields.
  // The Sites dev plugin supplies its own local-only test sign-in.
  return (await headers()).get('oai-authenticated-user-id');
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
  };
  if (!id || !runtime().DB) return base;
  const row = await database()
    .prepare(
      "SELECT g.plan, g.expires_at FROM grants g JOIN orders o ON o.id = g.order_id WHERE g.user_id = ? AND g.mode = ? AND g.expires_at > ? AND o.refunded = 0 ORDER BY CASE g.plan WHEN 'shop' THEN 0 ELSE 1 END, g.expires_at DESC LIMIT 1",
    )
    .bind(id, billingMode(), Date.now())
    .first<{ plan: string; expires_at: number }>();
  if (row && isPlan(row.plan))
    return { ...base, plan: row.plan, expiresAt: row.expires_at };
  return base;
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
