import InfoPage from './info-page';
export default function NotFound() {
  return (
    <InfoPage eyebrow="Page not found" title="Let’s get you back on track.">
      <p>This page may have moved, or the link may be incorrect.</p>
      <p>
        <a className="landing-primary" href="/">
          Browse all tools →
        </a>
      </p>
      <p>
        Need a hand? <a href="/contact">Visit support</a>.
      </p>
    </InfoPage>
  );
}
