import InfoPage from '../info-page';

export const metadata = { title: 'About', alternates: { canonical: '/about' } };

export default function AboutPage() {
  return (
    <InfoPage eyebrow="About" title="About Sahajly">
      <p>
        Sahajly exists to make everyday tasks simpler. We bring useful tools
        into one clear, approachable workspace so you can spend less time
        figuring out software and more time getting things done.
      </p>
      <h2>Who it is for</h2>
      <p>
        Anyone with a small digital task to finish: a student preparing an
        application, a professional organizing documents, or a print shop
        handling repeat customer requests.
      </p>
      <h2>How it works</h2>
      <p>
        Most file work runs in the browser. The paid workspace saves reusable
        size templates and creates a single application ZIP, while avoiding
        storage of customer files in the account.
      </p>
      <h2>Useful today, built to grow</h2>
      <p>
        Today, Sahajly offers photo resizing, signature preparation, image
        compression, print sheets and PDF organization. Our wider purpose is
        everyday productivity. New services will appear as they become
        available; a paid pass includes only the features listed on Pricing.
      </p>
      <h2>Our approach</h2>
      <ul>
        <li>Clear steps and useful defaults, with control when you need it.</li>
        <li>Free core tools without an account.</li>
        <li>Local file processing for the tools available today.</li>
        <li>Honest descriptions of what a tool can and cannot do.</li>
      </ul>
      <p>
        Have a task we could make easier?{' '}
        <a href="/contact">Tell us about it.</a>
      </p>
    </InfoPage>
  );
}
