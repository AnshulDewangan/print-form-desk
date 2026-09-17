'use client';
import { usePathname } from 'next/navigation';
export default function SiteFooter() {
  const pathname = usePathname();
  return (
    <footer className="site-footer">
      <div>
        <a href="/" aria-label="Sahajly home"><img className="sahajly-wordmark" src="/brand/sahajly-wordmark.svg" alt="Sahajly" width={198} height={60} /></a>
        <p>Prepare photos, signatures and PDFs for your next application.</p>
      </div>
      <nav aria-label="Footer navigation">
        <a
          className={pathname === '/' ? 'active' : ''}
          aria-current={pathname === '/' ? 'page' : undefined}
          href="/"
        >
          All tools
        </a>
        <a
          className={pathname === '/about' ? 'active' : ''}
          aria-current={pathname === '/about' ? 'page' : undefined}
          href="/about"
        >
          About
        </a>
        <a
          className={pathname === '/pricing' ? 'active' : ''}
          aria-current={pathname === '/pricing' ? 'page' : undefined}
          href="/pricing"
        >
          Pricing
        </a>
        <a
          className={pathname === '/contact' ? 'active' : ''}
          aria-current={pathname === '/contact' ? 'page' : undefined}
          href="/contact"
        >
          Help & support
        </a>
        <a
          className={pathname === '/privacy' ? 'active' : ''}
          aria-current={pathname === '/privacy' ? 'page' : undefined}
          href="/privacy"
        >
          Privacy
        </a>
        <a
          className={pathname === '/terms' ? 'active' : ''}
          aria-current={pathname === '/terms' ? 'page' : undefined}
          href="/terms"
        >
          Terms
        </a>
        <a
          className={pathname === '/refunds' ? 'active' : ''}
          aria-current={pathname === '/refunds' ? 'page' : undefined}
          href="/refunds"
        >
          Refunds
        </a>
      </nav>
      <p className="footer-note">
        Your original files stay unchanged. Check your download before
        submitting it.
      </p>
    </footer>
  );
}
