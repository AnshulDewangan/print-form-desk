import type { Metadata } from 'next';
import './globals.css';
import SiteFooter from './site-footer';
export const metadata: Metadata = {
  metadataBase: new URL('https://sites-project.anshuldewangan19.workers.dev'),
  title: {
    default: 'Print & Form Desk | Free Photo and PDF Tools',
    template: '%s | Print & Form Desk',
  },
  description:
    'Free browser-based photo, signature and PDF tools for online forms. Resize, compress, arrange, merge, extract, rotate and clean up files before you submit them.',
  keywords: [
    'photo resize',
    'signature resize',
    'compress image',
    'PDF tools',
    'merge PDF',
    'extract PDF pages',
    'passport photo size',
    'online form tools',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Print & Form Desk | Free Photo and PDF Tools',
    description:
      'Prepare photos, signatures and PDFs for online forms with clear, private browser tools.',
    url: '/',
    siteName: 'Print & Form Desk',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Print & Form Desk',
    description: 'Free photo, signature and PDF tools for online forms.',
  },
  icons: { icon: '/favicon.svg' },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="site-content">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
