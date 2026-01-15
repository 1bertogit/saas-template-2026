import { Redis } from '@upstash/redis';

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

// Singleton instance
let redisInstance: Redis | null = null;

export function getRedis(): Redis | null {
  if (!redisUrl || !redisToken) {
    return null;
  }

  if (!redisInstance) {
    redisInstance = new Redis({
      url: redisUrl,
      token: redisToken,
    });
  }

  return redisInstance;
}

export const redis = getRedis();

// Cache utilities
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    return await redis.get<T>(key);
  } catch (error) {
    console.error('Redis cache get error:', error);
    return null;
  }
}

export async function cacheSet<T>(
  key: string,
  value: T,
  options?: { ex?: number; px?: number }
): Promise<boolean> {
  if (!redis) return false;
  try {
    if (options?.ex) {
      await redis.set(key, value, { ex: options.ex });
    } else if (options?.px) {
      await redis.set(key, value, { px: options.px });
    } else {
      await redis.set(key, value);
    }
    return true;
  } catch (error) {
    console.error('Redis cache set error:', error);
    return false;
  }
}

export async function cacheDel(key: string): Promise<boolean> {
  if (!redis) return false;
  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.error('Redis cache del error:', error);
    return false;
  }
}

// Cache with automatic JSON serialization
export async function cacheGetOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 3600
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    return cached;
  }

  const fresh = await fetcher();
  await cacheSet(key, fresh, { ex: ttlSeconds });
  return fresh;
}
