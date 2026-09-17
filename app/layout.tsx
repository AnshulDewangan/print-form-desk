import type { Metadata } from 'next';
import './globals.css';
import SiteFooter from './site-footer';
import FileAssistant from './file-assistant';
export const metadata: Metadata = {
  metadataBase: new URL('https://sites-project.anshuldewangan19.workers.dev'),
  title: {
    default: 'Sahajly — Everyday tasks, made simple',
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
  openGraph: {
    title: 'Sahajly — Everyday tasks, made simple',
    description:
      'Simple, private image and PDF tools for everyday tasks. Resize, compress, combine and organize files in your browser.',
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
    icon: [{ url: '/sahajly-solo.svg?v=20260917-3', type: 'image/svg+xml' }],
    shortcut: [{ url: '/sahajly-solo.svg?v=20260917-3', type: 'image/svg+xml' }],
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
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <div className="site-content">{children}</div>
        <SiteFooter />
        <FileAssistant />
      </body>
    </html>
  );
}

