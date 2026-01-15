import { Ratelimit } from '@upstash/ratelimit';
import { getRedis } from './redis';

type RateLimitType = 'api' | 'ai-chat' | 'upload' | 'auth';

// Rate limit configurations per type
const rateLimitConfigs: Record<RateLimitType, { requests: number; window: string }> = {
  'api': { requests: 100, window: '1m' },
  'ai-chat': { requests: 20, window: '1m' },
  'upload': { requests: 10, window: '1m' },
  'auth': { requests: 5, window: '1m' },
};

// Cache ratelimit instances
const rateLimiters = new Map<RateLimitType, Ratelimit>();

function getRateLimiter(type: RateLimitType): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;

  if (!rateLimiters.has(type)) {
    const config = rateLimitConfigs[type];
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.requests, config.window as `${number} s` | `${number} m` | `${number} h` | `${number} d`),
      analytics: true,
      prefix: `ratelimit:${type}`,
    });
    rateLimiters.set(type, limiter);
  }

  return rateLimiters.get(type)!;
}

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

export async function rateLimit(
  identifier: string,
  type: RateLimitType = 'api'
): Promise<RateLimitResult> {
  const limiter = getRateLimiter(type);

  // If Redis is not configured, allow all requests
  if (!limiter) {
    return {
      success: true,
      limit: rateLimitConfigs[type].requests,
      remaining: rateLimitConfigs[type].requests,
      reset: Date.now() + 60000,
    };
  }

  try {
    const result = await limiter.limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    console.error('Rate limit error:', error);
    // On error, allow the request but log
    return {
      success: true,
      limit: rateLimitConfigs[type].requests,
      remaining: rateLimitConfigs[type].requests,
      reset: Date.now() + 60000,
    };
  }
}

// Middleware helper for API routes
export async function withRateLimit(
  request: Request,
  identifier: string,
  type: RateLimitType = 'api'
): Promise<Response | null> {
  const result = await rateLimit(identifier, type);

  if (!result.success) {
    return new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.reset.toString(),
        'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
      },
    });
  }

  return null; // No rate limit hit, continue
}
