import { redis } from './redis';

const IDEMPOTENCY_TTL_SECONDS = 60 * 60 * 24; // 24 hours

/**
 * Check if a webhook event has already been processed.
 * Uses Redis to track processed event IDs for 24 hours.
 *
 * @param eventId - Unique identifier for the webhook event (e.g., Stripe event ID, Svix ID)
 * @param prefix - Prefix to namespace the key (e.g., 'stripe', 'clerk')
 * @returns true if the event was already processed, false if it's new
 */
export async function isWebhookProcessed(eventId: string, prefix: string): Promise<boolean> {
  if (!redis) {
    // If Redis is not configured, we can't track idempotency
    // Return false to process the event (with a warning)
    console.warn(`[Idempotency] Redis not configured - cannot track ${prefix}:${eventId}`);
    return false;
  }

  const key = `webhook:${prefix}:${eventId}`;

  try {
    const exists = await redis.exists(key);
    return exists === 1;
  } catch (error) {
    console.error(`[Idempotency] Error checking ${key}:`, error);
    return false; // Process on error to avoid dropping events
  }
}

/**
 * Mark a webhook event as processed.
 *
 * @param eventId - Unique identifier for the webhook event
 * @param prefix - Prefix to namespace the key
 */
export async function markWebhookProcessed(eventId: string, prefix: string): Promise<void> {
  if (!redis) {
    return;
  }

  const key = `webhook:${prefix}:${eventId}`;

  try {
    await redis.set(key, Date.now().toString(), { ex: IDEMPOTENCY_TTL_SECONDS });
  } catch (error) {
    console.error(`[Idempotency] Error marking ${key}:`, error);
  }
}

/**
 * Wrapper function to process webhook with idempotency check.
 *
 * @param eventId - Unique identifier for the webhook event
 * @param prefix - Prefix to namespace the key
 * @param processor - Async function to process the webhook
 * @returns Result of processor or null if already processed
 */
export async function processWebhookWithIdempotency<T>(
  eventId: string,
  prefix: string,
  processor: () => Promise<T>
): Promise<{ processed: boolean; result?: T; skipped?: boolean }> {
  // Check if already processed
  const alreadyProcessed = await isWebhookProcessed(eventId, prefix);

  if (alreadyProcessed) {
    console.log(`[Idempotency] Skipping duplicate ${prefix}:${eventId}`);
    return { processed: false, skipped: true };
  }

  // Process the webhook
  const result = await processor();

  // Mark as processed
  await markWebhookProcessed(eventId, prefix);

  return { processed: true, result };
}

/**
 * Validate webhook timestamp to prevent replay attacks.
 * Rejects webhooks older than the specified tolerance.
 *
 * @param timestamp - Unix timestamp or ISO string from webhook
 * @param toleranceMs - Maximum age in milliseconds (default: 5 minutes)
 * @returns true if timestamp is valid, false if too old
 */
export function isWebhookTimestampValid(
  timestamp: string | number,
  toleranceMs: number = 5 * 60 * 1000
): boolean {
  const webhookTime = typeof timestamp === 'string' ? parseInt(timestamp, 10) * 1000 : timestamp * 1000;
  const now = Date.now();
  const age = now - webhookTime;

  if (age > toleranceMs) {
    console.warn(`[Idempotency] Webhook timestamp too old: ${age}ms (max: ${toleranceMs}ms)`);
    return false;
  }

  if (age < -toleranceMs) {
    console.warn(`[Idempotency] Webhook timestamp in the future: ${-age}ms`);
    return false;
  }

  return true;
}
