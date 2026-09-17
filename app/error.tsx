'use client';
export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main id="main-content" className="static-page">
      <p className="eyebrow">SOMETHING WENT WRONG</p>
      <h1>We couldn’t open this page.</h1>
      <p>Try again. Your original files on your device are unchanged.</p>
      <button className="landing-primary" onClick={reset}>
        Try again
      </button>
      <p>
        <a href="/">Back to all tools</a> · <a href="/contact">Get help</a>
      </p>
    </main>
  );
}
