const featureFlags = {
  enableAIProviders: process.env.ENABLE_AI_PROVIDERS === 'true',
  enableStripe: process.env.ENABLE_STRIPE === 'true',
  enableR2: process.env.ENABLE_R2 === 'true',
  enableEmail: process.env.ENABLE_EMAIL === 'true',
  enableAnalytics: process.env.ENABLE_ANALYTICS === 'true',
};

export default featureFlags;