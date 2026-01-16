import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rateLimit } from '@/lib/rate-limit';

// Mock the redis module
vi.mock('@/lib/redis', () => ({
  getRedis: () => null, // Redis not configured in tests
}));

describe('rateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow requests when Redis is not configured', async () => {
    const result = await rateLimit('user-123', 'api');

    expect(result.success).toBe(true);
    expect(result.limit).toBe(100); // Default API limit
    expect(result.remaining).toBe(100);
  });

  it('should use correct limits for different rate limit types', async () => {
    const apiResult = await rateLimit('user-123', 'api');
    expect(apiResult.limit).toBe(100);

    const aiChatResult = await rateLimit('user-123', 'ai-chat');
    expect(aiChatResult.limit).toBe(20);

    const uploadResult = await rateLimit('user-123', 'upload');
    expect(uploadResult.limit).toBe(10);

    const authResult = await rateLimit('user-123', 'auth');
    expect(authResult.limit).toBe(5);
  });

  it('should return reset timestamp in the future', async () => {
    const result = await rateLimit('user-123', 'api');

    expect(result.reset).toBeGreaterThan(Date.now());
  });
});
