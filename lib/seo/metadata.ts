import { Metadata } from 'next';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'SaaS Template 2026';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://example.com';
const DEFAULT_DESCRIPTION = 'Template SaaS completo com Next.js, Stripe, Clerk, R2 e IA.';

interface GenerateMetadataParams {
  title?: string;
  description?: string;
  path?: string;
  ogImage?: string;
  noIndex?: boolean;
  keywords?: string[];
}

export function generateMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '',
  ogImage,
  noIndex = false,
  keywords = [],
}: GenerateMetadataParams = {}): Metadata {
  const fullTitle = title ? `${title} | ${APP_NAME}` : APP_NAME;
  const url = `${BASE_URL}${path}`;
  const defaultOgImage = `${BASE_URL}/og-image.png`;

  return {
    title: fullTitle,
    description,
    keywords: [
      'SaaS',
      'Next.js',
      'React',
      'TypeScript',
      'Stripe',
      'Clerk',
      'AI',
      ...keywords,
    ],
    authors: [{ name: APP_NAME }],
    creator: APP_NAME,
    publisher: APP_NAME,
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: 'website',
      locale: 'pt_BR',
      url,
      title: fullTitle,
      description,
      siteName: APP_NAME,
      images: [
        {
          url: ogImage || defaultOgImage,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImage || defaultOgImage],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    },
  };
}

export function generateArticleMetadata({
  title,
  description,
  path,
  ogImage,
  publishedTime,
  modifiedTime,
  authors,
  tags,
}: {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  publishedTime: string;
  modifiedTime?: string;
  authors?: string[];
  tags?: string[];
}): Metadata {
  const baseMetadata = generateMetadata({ title, description, path, ogImage });
  const url = `${BASE_URL}${path}`;

  return {
    ...baseMetadata,
    openGraph: {
      ...baseMetadata.openGraph,
      type: 'article',
      url,
      publishedTime,
      modifiedTime,
      authors,
      tags,
    },
  };
}
