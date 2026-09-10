import {
  HttpError,
  jsonBody,
  requireUser,
  route,
  runtime,
  sameOrigin,
} from '@/lib/server';
import { verifySignature } from '@/lib/billing-crypto';
import { grantPayment } from '@/lib/razorpay';
export async function POST(request: Request) {
  return route(async () => {
    sameOrigin(request);
    const id = await requireUser(),
      b = await jsonBody(request),
      secret = runtime().RAZORPAY_KEY_SECRET;
    if (
      !secret ||
      !b ||
      typeof b.razorpay_order_id !== 'string' ||
      typeof b.razorpay_payment_id !== 'string' ||
      typeof b.razorpay_signature !== 'string' ||
      !(await verifySignature(
        `${b.razorpay_order_id}|${b.razorpay_payment_id}`,
        b.razorpay_signature,
        secret,
      ))
    )
      throw new HttpError(400, 'Payment confirmation is invalid.');
    await grantPayment(b.razorpay_payment_id, id);
    return { confirmed: true };
  });
}
