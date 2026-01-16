'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

declare global {
  interface Window {
    fbq: (
      action: string,
      event: string,
      params?: Record<string, unknown>
    ) => void;
    _fbq: unknown;
  }
}

function MetaPixelPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (META_PIXEL_ID && typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'PageView');
    }
  }, [pathname, searchParams]);

  return null;
}

export function MetaPixel() {
  if (!META_PIXEL_ID) return null;

  return (
    <>
      <Script
        id="meta-pixel-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
      <Suspense fallback={null}>
        <MetaPixelPageView />
      </Suspense>
    </>
  );
}

// Standard Events
export function metaPixelEvent(
  event: MetaPixelStandardEvent,
  params?: Record<string, unknown>
) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', event, params);
  }
}

// Custom Events
export function metaPixelCustomEvent(
  event: string,
  params?: Record<string, unknown>
) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('trackCustom', event, params);
  }
}

// Standard event types
type MetaPixelStandardEvent =
  | 'AddPaymentInfo'
  | 'AddToCart'
  | 'AddToWishlist'
  | 'CompleteRegistration'
  | 'Contact'
  | 'CustomizeProduct'
  | 'Donate'
  | 'FindLocation'
  | 'InitiateCheckout'
  | 'Lead'
  | 'PageView'
  | 'Purchase'
  | 'Schedule'
  | 'Search'
  | 'StartTrial'
  | 'SubmitApplication'
  | 'Subscribe'
  | 'ViewContent';

// Pre-built event helpers
export const metaPixel = {
  // E-commerce events
  addToCart: (params: { content_ids?: string[]; content_type?: string; value?: number; currency?: string }) =>
    metaPixelEvent('AddToCart', params),

  initiateCheckout: (params: { content_ids?: string[]; value?: number; currency?: string; num_items?: number }) =>
    metaPixelEvent('InitiateCheckout', params),

  purchase: (params: { content_ids?: string[]; content_type?: string; value: number; currency: string }) =>
    metaPixelEvent('Purchase', params),

  // Lead generation events
  lead: (params?: { content_name?: string; content_category?: string; value?: number; currency?: string }) =>
    metaPixelEvent('Lead', params),

  completeRegistration: (params?: { content_name?: string; status?: string; value?: number; currency?: string }) =>
    metaPixelEvent('CompleteRegistration', params),

  // Subscription events
  startTrial: (params?: { value?: number; currency?: string; predicted_ltv?: number }) =>
    metaPixelEvent('StartTrial', params),

  subscribe: (params: { value: number; currency: string; predicted_ltv?: number }) =>
    metaPixelEvent('Subscribe', params),

  // Content events
  viewContent: (params?: { content_ids?: string[]; content_type?: string; content_name?: string; value?: number; currency?: string }) =>
    metaPixelEvent('ViewContent', params),

  search: (params?: { search_string?: string; content_ids?: string[]; content_category?: string }) =>
    metaPixelEvent('Search', params),

  // Contact events
  contact: () => metaPixelEvent('Contact'),
};
