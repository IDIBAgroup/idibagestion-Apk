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
  icons: { icon: '/brand/options/04-monogram.png' },
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
