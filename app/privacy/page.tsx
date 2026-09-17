import InfoPage from '../info-page';

export const metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return (
    <InfoPage eyebrow="Privacy" title="Privacy Policy">
      <p>
        Sahajly is designed so normal photo, signature and PDF work
        happens inside your browser. The files you choose for free tools are not
        uploaded to our server.
      </p>
      <h2>What we process</h2>
      <p>
        Free tools process selected files in tab memory. Application-pack
        downloads also process files on your device. Saved account templates
        store only size settings and template names, not customer files.
      </p>
      <h2>Account data</h2>
      <p>
        If you sign in, Supabase provides your account identity. We store the
        minimum data needed for templates and billing access: account ID,
        template settings, order IDs, payment IDs, plan name, mode and expiry
        time.
      </p>
      <h2>Payments</h2>
      <p>
        Payments are handled by Razorpay. Card, UPI, wallet and banking details
        are entered on Razorpay checkout, not inside this site.
      </p>
      <h2>Contact</h2>
      <p>
        For privacy questions or requests concerning your account data, email
        <a href="mailto:printandform@gmail.com"> printandform@gmail.com</a>.
        Include your account email and the request; do not include passwords or
        documents.
      </p>
    </InfoPage>
  );
}
