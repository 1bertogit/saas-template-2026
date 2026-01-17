'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { ThemeProvider } from 'next-themes';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  useEffect(() => {
    if (!apiKey || !host) return;
    posthog.init(apiKey, {
      api_host: host,
      autocapture: false,
    });
    return () => {
      // PostHog cleanup - reset on unmount
      posthog.reset();
    };
  }, [apiKey, host]);

  const content = (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );

  if (!apiKey || !host) return content;

  return <PostHogProvider client={posthog}>{content}</PostHogProvider>;
}
