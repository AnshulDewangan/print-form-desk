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
      <Link className="static-back" href="/">
        ← Back to tools
      </Link>
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <div className="static-copy">{children}</div>
    </main>
  );
}
