import InfoPage from '../info-page';
import { SUPPORT_EMAIL } from '@/lib/site';

export const metadata = {
  title: 'Refund Policy',
  alternates: { canonical: '/refunds' },
};

export default function RefundsPage() {
  return (
    <InfoPage eyebrow="Refunds" title="Refund Policy">
      <p>
        Sahajly passes are short-duration digital access passes. Because the
        tools can be used immediately after access is activated, refunds are
        reviewed case by case.
      </p>
      <h2>When to contact us</h2>
      <p>
        Contact support if payment was deducted but access did not activate, you
        paid twice by mistake, or a technical issue prevented use soon after
        purchase.
      </p>
      <h2>Information needed</h2>
      <p>
        Email{' '}
        <a href={`mailto:${SUPPORT_EMAIL}?subject=Sahajly%20payment%20support`}>
          {SUPPORT_EMAIL}
        </a>{' '}
        to request help with a payment. Sending a request does not automatically
        approve a refund.
      </p>
      <p>
        Include your login email, approximate payment time, plan, and Razorpay
        payment ID if available. Do not send card numbers, UPI PINs, passwords
        or OTPs.
      </p>
      <h2>Processing</h2>
      <p>
        Approved refunds are processed through the payment provider. Refund
        timing depends on Razorpay and the customer’s bank or wallet provider.
      </p>
    </InfoPage>
  );
}
