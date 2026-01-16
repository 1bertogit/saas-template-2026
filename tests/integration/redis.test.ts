import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Upstash Redis
vi.mock('@upstash/redis', () => ({
  Redis: vi.fn().mockImplementation(() => ({
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  })),
}));

describe('Redis Cache Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset module cache to re-evaluate env variables
    vi.resetModules();
  });

  it('should return null when Redis is not configured', async () => {
    // Set env to not configured
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');

    const { cacheGet, cacheSet, cacheDel } = await import('@/lib/redis');

    expect(await cacheGet('test-key')).toBeNull();
    expect(await cacheSet('test-key', 'value')).toBe(false);
    expect(await cacheDel('test-key')).toBe(false);
  });

  it('cacheGetOrSet should fetch fresh data when cache misses', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');

    const { cacheGetOrSet } = await import('@/lib/redis');

    const fetcher = vi.fn().mockResolvedValue({ data: 'fresh' });
    const result = await cacheGetOrSet('test-key', fetcher, 3600);

    expect(fetcher).toHaveBeenCalled();
    expect(result).toEqual({ data: 'fresh' });
  });
});

describe('Rate Limit Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('should allow all requests when Redis is not configured', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');

    const { rateLimit } = await import('@/lib/rate-limit');

    const result = await rateLimit('user-123', 'api');

    expect(result.success).toBe(true);
    expect(result.limit).toBe(100);
    expect(result.remaining).toBe(100);
  });

  it('should have correct limits for different rate limit types', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');

    const { rateLimit } = await import('@/lib/rate-limit');

    const apiResult = await rateLimit('user-123', 'api');
    expect(apiResult.limit).toBe(100);

    const aiResult = await rateLimit('user-123', 'ai-chat');
    expect(aiResult.limit).toBe(20);

    const uploadResult = await rateLimit('user-123', 'upload');
    expect(uploadResult.limit).toBe(10);

    const authResult = await rateLimit('user-123', 'auth');
    expect(authResult.limit).toBe(5);
  });

  it('should return reset timestamp in the future', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');

    const { rateLimit } = await import('@/lib/rate-limit');
    const result = await rateLimit('user-123', 'api');

    expect(result.reset).toBeGreaterThan(Date.now());
  });
});
