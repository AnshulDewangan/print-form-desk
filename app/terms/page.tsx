import InfoPage from '../info-page';

export const metadata = { title: 'Terms' };

export default function TermsPage() {
  return (
    <InfoPage eyebrow="Terms" title="Terms & Conditions">
      <p>
        Sahajly provides file-preparation tools for photos,
        signatures, images and PDFs. You are responsible for checking the final
        file against the official form or portal instructions before submitting
        it.
      </p>
      <h2>Use of tools</h2>
      <p>
        The app helps resize, compress, arrange, merge and extract files. It
        does not certify that a file will be accepted by any government, exam,
        employer, bank or private portal.
      </p>
      <h2>Paid access</h2>
      <p>
        Paid passes unlock application-pack downloads and saved templates for
        the stated period. Passes do not renew automatically. Test-mode
        purchases are only for testing and do not represent real paid access.
      </p>
      <h2>User responsibility</h2>
      <p>
        Do not use the app for unlawful documents, forged identity material, or
        files you do not have permission to process. Keep your account and email
        secure.
      </p>
      <h2>Availability</h2>
      <p>
        We try to keep the service available, but browser limits, network
        issues, payment-provider issues or hosting issues may interrupt access.
        Keep your own copy of downloaded files.
      </p>
    </InfoPage>
  );
}
