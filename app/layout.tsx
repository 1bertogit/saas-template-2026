import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { Providers } from './providers';
import { GoogleTagManager, GoogleTagManagerNoscript } from '@/components/analytics/google-tag-manager';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SaaS Template 2026',
  description: 'Template SaaS completo com Next.js, Stripe, Clerk, R2 e IA.',
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="pt-BR">
        <head>
          <GoogleTagManager />
        </head>
        <body className={inter.className}>
          <GoogleTagManagerNoscript />
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
