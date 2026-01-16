import './globals.css';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { Providers } from './providers';
import { GoogleTagManager, GoogleTagManagerNoscript } from '@/components/analytics/google-tag-manager';
import { MetaPixel } from '@/components/analytics/meta-pixel';
import { OrganizationJsonLd, WebsiteJsonLd, SoftwareApplicationJsonLd } from '@/components/seo/json-ld';
import { generateMetadata as generateSeoMetadata } from '@/lib/seo/metadata';

const inter = Inter({ subsets: ['latin'] });

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'SaaS Template 2026';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://example.com';

export const metadata = generateSeoMetadata({
  description: 'Template SaaS completo com Next.js, Stripe, Clerk, R2 e IA. Pronto para produção com autenticação, pagamentos, storage e inteligência artificial.',
  keywords: ['template', 'boilerplate', 'startup', 'empreendedorismo'],
});

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <ClerkProvider>
      <html lang={locale} suppressHydrationWarning>
        <head>
          <GoogleTagManager />
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#000000" />
          <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        </head>
        <body className={inter.className}>
          <GoogleTagManagerNoscript />
          <MetaPixel />
          <OrganizationJsonLd
            name={APP_NAME}
            url={BASE_URL}
            logo={`${BASE_URL}/logo.png`}
          />
          <WebsiteJsonLd
            name={APP_NAME}
            url={BASE_URL}
            description="Template SaaS completo para lançar seu produto rapidamente"
          />
          <SoftwareApplicationJsonLd
            name={APP_NAME}
            description="Plataforma SaaS com autenticação, pagamentos e IA integrada"
            applicationCategory="BusinessApplication"
            offers={{ price: '0', priceCurrency: 'BRL' }}
          />
          <NextIntlClientProvider messages={messages}>
            <Providers>{children}</Providers>
          </NextIntlClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
