import { database, runtime, billingMode, HttpError } from './server';
import { PLANS, isPlan } from './plans';
import { validateCapturedPayment } from './billing-crypto';

export async function razorpay(path: string, body?: object) {
  const r = runtime();
  if (!r.RAZORPAY_KEY_ID || !r.RAZORPAY_KEY_SECRET)
    throw new HttpError(503, 'Payments are not connected yet.');
  const result = await fetch(`https://api.razorpay.com/v1/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization: `Basic ${btoa(`${r.RAZORPAY_KEY_ID}:${r.RAZORPAY_KEY_SECRET}`)}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  if (!result.ok)
    throw new HttpError(
      502,
      'The payment provider could not complete this request. Please try again.',
    );
  return result.json() as Promise<Record<string, any>>;
}
export async function grantPayment(paymentId: string, owner?: string) {
  if (!/^pay_[a-zA-Z0-9]+$/.test(paymentId))
    throw new HttpError(400, 'Invalid payment reference.');
  const payment = await razorpay(`payments/${paymentId}`);
  const order = await database()
    .prepare(
      'SELECT id, user_id, plan, amount, mode, refunded FROM orders WHERE id = ?',
    )
    .bind(payment.order_id ?? '')
    .first<{
      id: string;
      user_id: string;
      plan: string;
      amount: number;
      mode: string;
      refunded: number;
    }>();
  if (
    !order ||
    (owner && order.user_id !== owner) ||
    order.mode !== billingMode()
  )
    throw new HttpError(403, 'This payment does not belong to this account.');
  if (!isPlan(order.plan) || order.refunded)
    throw new HttpError(409, 'This payment cannot activate a pass.');
  try {
    validateCapturedPayment(payment, order);
  } catch {
    throw new HttpError(
      409,
      'Payment has not been confirmed. If charged, do not pay again; confirmation can take a moment.',
    );
  }
  // The unique order/payment keys make checkout retries and webhook delivery idempotent.
  const createdAt = Number(payment.created_at);
  if (!Number.isFinite(createdAt) || createdAt <= 0)
    throw new HttpError(502, 'Payment timestamp is unavailable.');
  await database()
    .prepare(
      'INSERT OR IGNORE INTO grants (payment_id, order_id, user_id, plan, mode, expires_at) SELECT ?, ?, ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM orders WHERE id = ? AND refunded = 0)',
    )
    .bind(
      paymentId,
      order.id,
      order.user_id,
      order.plan,
      order.mode,
      createdAt * 1000 + PLANS[order.plan].days * 86400000,
      order.id,
    )
    .run();
}
