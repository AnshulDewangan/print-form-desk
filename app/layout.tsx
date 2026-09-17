import type { Metadata } from 'next';
import './globals.css';
import SiteFooter from './site-footer';
export const metadata: Metadata = {
  metadataBase: new URL('https://sites-project.anshuldewangan19.workers.dev'),
  title: {
    default: 'Sahajly | Free Photo and PDF Tools',
    template: '%s | Sahajly',
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
    title: 'Sahajly | Free Photo and PDF Tools',
    description:
      'Prepare photos, signatures and PDFs for online forms with clear, private browser tools.',
    url: '/',
    siteName: 'Sahajly',
    type: 'website',
    images: [{ url: '/brand/sahajly-social.png', width: 1536, height: 1024, alt: 'Sahajly — photo and PDF tools' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sahajly',
    description: 'Free photo, signature and PDF tools for online forms.',
  },
  icons: {
    icon: [{ url: '/sahajly-favicon.png', type: 'image/png' }],
    shortcut: [{ url: '/sahajly-favicon.png', type: 'image/png' }],
    apple: [{ url: '/brand/apple-touch-icon.png?v=sahajly-20260917', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/site.webmanifest?v=sahajly-20260917',
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

