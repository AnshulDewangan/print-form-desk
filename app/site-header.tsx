'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
export default function SiteHeader() {
  const path = usePathname();
  return (
    <header className="sahajly-header">
      <Link href="/" aria-label="Sahajly home">
        <Image
          unoptimized
          className="sahajly-wordmark"
          src="/brand/sahajly-wordmark.svg"
          alt="Sahajly"
          width={198}
          height={60}
        />
      </Link>
      <nav aria-label="Main navigation">
        {[
          ['/', 'All tools'],
          ['/pricing', 'Pricing'],
          ['/contact', 'Support'],
        ].map(([href, label]) => (
          <Link
            key={href}
            href={href}
            aria-current={path === href ? 'page' : undefined}
          >
            {label}
          </Link>
        ))}
        <Link className="account-link" href="/workspace?workspace=plans">
          My account <span aria-hidden="true">↗</span>
        </Link>
      </nav>
    </header>
  );
}
