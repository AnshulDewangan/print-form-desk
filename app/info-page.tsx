import type { ReactNode } from 'react';
import Link from 'next/link';

export default function InfoPage({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="static-page">
      <nav className="info-nav" aria-label="Page navigation">
        <Link href="/"><img className="sahajly-wordmark" src="/brand/sahajly-wordmark.svg" alt="Sahajly" width={198} height={60} /></Link>
        <Link href="/pricing">Pricing</Link>
        <Link href="/contact">Help & support</Link>
      </nav>
      <Link className="static-back" href="/">
        ← Back to tools
      </Link>
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <div className="static-copy">{children}</div>
    </main>
  );
}
