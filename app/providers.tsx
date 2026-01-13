'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';

export function Providers({ children }: { children: React.ReactNode }) {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  useEffect(() => {
    if (!apiKey || !host) return;
    posthog.init(apiKey, {
      api_host: host,
      autocapture: false,
    });
    return () => posthog.shutdown();
  }, [apiKey, host]);

  if (!apiKey || !host) return children;

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
