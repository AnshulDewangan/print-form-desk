import InfoPage from '../info-page';

export const metadata = { title: 'About' };

export default function AboutPage() {
  return (
    <InfoPage eyebrow="About" title="About Sahajly">
      <p>
        Sahajly helps people prepare upload-ready photos, signatures,
        print sheets and PDFs without installing heavy software.
      </p>
      <h2>Who it is for</h2>
      <p>
        It is useful for students, job applicants, form fillers, small print
        shops and cyber cafés that repeatedly prepare documents for online
        portals.
      </p>
      <h2>How it works</h2>
      <p>
        Most file work runs in the browser. The paid workspace saves reusable
        size templates and creates a single application ZIP, while avoiding
        storage of customer files in the account.
      </p>
    </InfoPage>
  );
}
