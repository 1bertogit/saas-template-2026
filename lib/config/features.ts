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

  // Infrastructure
  REDIS_ENABLED: !!process.env.UPSTASH_REDIS_REST_URL,
  SENTRY_ENABLED: !!process.env.NEXT_PUBLIC_SENTRY_DSN || !!process.env.SENTRY_DSN,
  TRIGGER_ENABLED: !!process.env.TRIGGER_PROJECT_ID,

  // Rate Limiting
  RATE_LIMIT_ENABLED: !!process.env.UPSTASH_REDIS_REST_URL,

  // Marketing & SEO
  GTM_ENABLED: !!process.env.NEXT_PUBLIC_GTM_ID,
  SEARCH_CONSOLE_ENABLED: !!process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  META_PIXEL_ENABLED: !!process.env.NEXT_PUBLIC_META_PIXEL_ID,

  // UI/UX
  DARK_MODE_ENABLED: true, // Always available via next-themes
  I18N_ENABLED: true, // Always available via next-intl
} as const;

export type FeatureKey = keyof typeof FEATURES;

export function isFeatureEnabled(feature: FeatureKey): boolean {
  return FEATURES[feature];
}

export function requireFeature(feature: FeatureKey, errorMessage?: string): void {
  if (!FEATURES[feature]) {
    throw new Error(errorMessage || `Feature ${feature} is not enabled. Please configure the required environment variables.`);
  }
}

export function getEnabledFeatures(): FeatureKey[] {
  return (Object.keys(FEATURES) as FeatureKey[]).filter((key) => FEATURES[key]);
}

export function getDisabledFeatures(): FeatureKey[] {
  return (Object.keys(FEATURES) as FeatureKey[]).filter((key) => !FEATURES[key]);
}
