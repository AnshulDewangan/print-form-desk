import { PLANS, isPlan } from '@/lib/plans';
import {
  account,
  billingReady,
  billingMode,
  database,
  HttpError,
  jsonBody,
  requireUser,
  route,
  runtime,
  sameOrigin,
} from '@/lib/server';
import { razorpay } from '@/lib/razorpay';
export async function POST(request: Request) {
  return route(async () => {
    sameOrigin(request);
    const id = await requireUser();
    if (!billingReady())
      throw new HttpError(
        503,
        'Purchases are not open yet. No payment has been taken.',
      );
    const body = await jsonBody(request);
    const planId: unknown = body?.plan;
    if (!isPlan(planId)) throw new HttpError(400, 'Choose Personal or Shop.');
    if ((await account(id)).plan)
      throw new HttpError(
        409,
        'Your pass is still active. You can buy another when it expires.',
      );
    const recent = await database()
      .prepare(
        'SELECT COUNT(*) AS n FROM orders WHERE user_id = ? AND created_at > ?',
      )
      .bind(id, Date.now() - 3600000)
      .first<{ n: number }>();
    if ((recent?.n ?? 0) >= 10)
      throw new HttpError(
        429,
        'Too many checkout attempts. Please try again in an hour.',
      );
    const plan = PLANS[planId];
    const order = await razorpay('orders', {
      amount: plan.amount,
      currency: 'INR',
      receipt: crypto.randomUUID(),
    });
    if (typeof order.id !== 'string' || !/^order_[a-zA-Z0-9]+$/.test(order.id))
      throw new HttpError(502, 'Could not create checkout.');
    await database()
      .prepare(
        'INSERT INTO orders (id, user_id, plan, mode, amount, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .bind(order.id, id, planId, billingMode(), plan.amount, Date.now())
      .run();
    return {
      orderId: order.id,
      key: runtime().RAZORPAY_KEY_ID,
      amount: plan.amount,
      currency: 'INR',
      name: plan.name,
      testMode: billingMode() === 'test',
    };
  });
}
