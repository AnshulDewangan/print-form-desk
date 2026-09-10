import { database, HttpError, route, runtime } from '@/lib/server';
import { verifySignature } from '@/lib/billing-crypto';
import { grantPayment, razorpay } from '@/lib/razorpay';
export async function POST(request: Request) {
  return route(async () => {
    const raw = await request.text(),
      secret = runtime().RAZORPAY_WEBHOOK_SECRET;
    if (raw.length > 100000) throw new HttpError(413, 'Request too large.');
    if (
      !secret ||
      !(await verifySignature(
        raw,
        request.headers.get('x-razorpay-signature') ?? '',
        secret,
      ))
    )
      throw new HttpError(400, 'Invalid webhook signature.');
    const event = JSON.parse(raw);
    if (event.event === 'payment.captured')
      await grantPayment(event.payload?.payment?.entity?.id ?? '');
    if (
      event.event === 'refund.created' ||
      event.event === 'refund.processed'
    ) {
      const paymentId = event.payload?.refund?.entity?.payment_id;
      if (
        typeof paymentId !== 'string' ||
        !/^pay_[a-zA-Z0-9]+$/.test(paymentId)
      )
        throw new HttpError(400, 'Invalid payment reference.');
      const payment = await razorpay(`payments/${paymentId}`);
      if (Number(payment.amount_refunded ?? 0) > 0)
        await database()
          .prepare('UPDATE orders SET refunded = 1 WHERE id = ?')
          .bind(payment.order_id)
          .run();
    }
    return { received: true };
  });
}
