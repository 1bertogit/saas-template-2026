export const FEATURES = {
  AI_VERCEL_SDK: process.env.NEXT_PUBLIC_ENABLE_VERCEL_AI === 'true',
  AI_OPENROUTER: process.env.NEXT_PUBLIC_ENABLE_OPENROUTER === 'true' || !!process.env.OPENROUTER_API_KEY,
  STRIPE_ENABLED: !!process.env.STRIPE_SECRET_KEY,
  R2_ENABLED: !!process.env.R2_ACCOUNT_ID,
  EMAIL_ENABLED: !!process.env.RESEND_API_KEY,
  ANALYTICS_ENABLED: !!process.env.NEXT_PUBLIC_POSTHOG_KEY,
} as const;

export function isFeatureEnabled(feature: keyof typeof FEATURES): boolean {
  return FEATURES[feature];
}

export function requireFeature(feature: keyof typeof FEATURES, errorMessage?: string): void {
  if (!FEATURES[feature]) {
    throw new Error(errorMessage || `Feature \