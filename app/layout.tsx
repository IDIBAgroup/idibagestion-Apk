import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import localFont from 'next/font/local';
import './globals.css';
import { Providers } from './providers';

const expose = localFont({
  src: './fonts/Expose-Variable.ttf',
  variable: '--font-expose',
  weight: '400 900',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'IDIBAGES - ERP',
  applicationName: 'IDIBAGES',
  description: 'Plateforme de gestion et de pilotage d’entreprise.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/pwa/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/logo-default.png', type: 'image/png' }],
  },
  appleWebApp: { capable: true, title: 'IDIBAGES', statusBarStyle: 'black-translucent' },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#081C2D',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={expose.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
