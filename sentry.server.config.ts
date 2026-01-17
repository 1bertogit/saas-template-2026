import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Environment
    environment: process.env.NODE_ENV,

    // Filter out expected errors
    ignoreErrors: [
      'NEXT_NOT_FOUND',
      'NEXT_REDIRECT',
    ],

    // Don't send errors in development unless explicitly enabled
    enabled: process.env.NODE_ENV === 'production' || process.env.SENTRY_DEBUG === 'true',
  });
}
