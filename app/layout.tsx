import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Print & Form Desk — Photo & Signature Workspace',
  description:
    'Crop and resize photos and signatures, prepare JPEGs under a size limit, and arrange mixed photos on printable PDF sheets. Images stay in your browser.',
  icons: { icon: '/favicon.svg' },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
