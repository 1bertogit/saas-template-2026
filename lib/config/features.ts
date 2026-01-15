export const FEATURES = {
  // AI Providers
  AI_VERCEL_SDK: process.env.NEXT_PUBLIC_ENABLE_VERCEL_AI === 'true',
  AI_OPENROUTER: process.env.NEXT_PUBLIC_ENABLE_OPENROUTER === 'true' || !!process.env.OPENROUTER_API_KEY,
  AI_ANTHROPIC: !!process.env.ANTHROPIC_API_KEY,

  // Core Services
  STRIPE_ENABLED: !!process.env.STRIPE_SECRET_KEY,
  R2_ENABLED: !!process.env.R2_ACCOUNT_ID,
  EMAIL_ENABLED: !!process.env.RESEND_API_KEY,
  ANALYTICS_ENABLED: !!process.env.NEXT_PUBLIC_POSTHOG_KEY,

  // Infrastructure (new)
  REDIS_ENABLED: !!process.env.UPSTASH_REDIS_REST_URL,
  SENTRY_ENABLED: !!process.env.NEXT_PUBLIC_SENTRY_DSN || !!process.env.SENTRY_DSN,
  TRIGGER_ENABLED: !!process.env.TRIGGER_PROJECT_ID,

  // Rate Limiting
  RATE_LIMIT_ENABLED: !!process.env.UPSTASH_REDIS_REST_URL,
} as const;

export function isFeatureEnabled(feature: keyof typeof FEATURES): boolean {
  return FEATURES[feature];
}

export function requireFeature(feature: keyof typeof FEATURES, errorMessage?: string): void {
  if (!FEATURES[feature]) {
    throw new Error(errorMessage || `Feature \