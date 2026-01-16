import { withSentryConfig } from '@sentry/nextjs';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.clerk.com' },
      { protocol: 'https', hostname: 'images.clerk.dev' },
      { protocol: 'https', hostname: '**.r2.dev' },
      { protocol: 'https', hostname: '**.r2.cloudflarestorage.com' },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

// Sentry configuration
const sentryWebpackPluginOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Suppress source map upload logs
  silent: !process.env.CI,

  // Upload source maps for better debugging
  widenClientFileUpload: true,

  // Automatically tree-shake Sentry logger
  disableLogger: true,

  // Hide source maps from client bundles
  hideSourceMaps: true,

  // Only upload in production
  disable: process.env.NODE_ENV !== 'production',
};

// Apply plugins in order: next-intl first, then Sentry
const withIntlConfig = withNextIntl(nextConfig);

// Export with or without Sentry based on configuration
const exportConfig = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(withIntlConfig, sentryWebpackPluginOptions)
  : withIntlConfig;

export default exportConfig;
