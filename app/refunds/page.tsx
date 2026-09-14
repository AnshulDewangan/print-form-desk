import InfoPage from '../info-page';

export const metadata = { title: 'Refund Policy · Print & Form Desk' };

export default function RefundsPage() {
  return (
    <InfoPage eyebrow="Refunds" title="Refund Policy">
      <p>
        Print & Form Desk passes are short-duration digital access passes.
        Because the tools can be used immediately after access is activated,
        refunds are reviewed case by case.
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
        <a href="mailto:printandform@gmail.com?subject=Payment%20support">
          printandform@gmail.com
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
