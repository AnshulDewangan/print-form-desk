export async function verifySignature(
  body: string,
  signature: string,
  secret: string,
) {
  if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  const bytes = Uint8Array.from(signature.match(/../g)!, (h) =>
    parseInt(h, 16),
  );
  return crypto.subtle.verify(
    'HMAC',
    key,
    bytes,
    new TextEncoder().encode(body),
  );
}
export function validateCapturedPayment(
  payment: Record<string, unknown>,
  order: { id: string; amount: number },
) {
  if (
    payment.order_id !== order.id ||
    payment.amount !== order.amount ||
    payment.currency !== 'INR' ||
    payment.status !== 'captured' ||
    payment.captured !== true ||
    Number(payment.amount_refunded ?? 0) !== 0
  )
    throw new Error('Payment is not a matching, captured payment.');
}
