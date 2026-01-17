import { PostHog } from 'posthog-node';

let posthogClient: PostHog | null = null;

function getClient() {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY || !process.env.NEXT_PUBLIC_POSTHOG_HOST) {
    return null;
  }

  if (!posthogClient) {
    posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    });
  }

  return posthogClient;
}

export async function trackEvent({
  userId,
  event,
  properties = {},
}: {
  userId: string;
  event: string;
  properties?: Record<string, unknown>;
}) {
  const client = getClient();
  if (!client) return;

  client.capture({
    distinctId: userId,
    event,
    properties,
  });

  await client.flush();
}

export async function identifyUser({
  userId,
  properties = {},
}: {
  userId: string;
  properties?: Record<string, unknown>;
}) {
  const client = getClient();
  if (!client) return;

  client.identify({
    distinctId: userId,
    properties,
  });

  await client.flush();
}

export const EVENTS = {
  USER_SIGNED_UP: 'user_signed_up',
  USER_SIGNED_IN: 'user_signed_in',
  SUBSCRIPTION_STARTED: 'subscription_started',
  SUBSCRIPTION_CANCELED: 'subscription_canceled',
  FILE_UPLOADED: 'file_uploaded',
  AI_GENERATION: 'ai_generation',
} as const;
