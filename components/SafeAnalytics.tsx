'use client';

import { useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

/**
 * Safe wrapper for Vercel Analytics and Speed Insights
 * Suppresses console errors from failed fetch requests
 */
export default function SafeAnalytics() {
  useEffect(() => {
    // Suppress fetch errors from Vercel Analytics
    const originalFetch = window.fetch;
    // eslint-disable-next-line no-console
    const originalConsoleError = console.error;
    // eslint-disable-next-line no-console
    const originalConsoleWarn = console.warn;

    // Override fetch to silently handle Vercel Analytics errors
    window.fetch = async (...args: Parameters<typeof fetch>) => {
      try {
        const response = await originalFetch(...args);
        // Check if response failed and is from Vercel Analytics
        if (!response.ok) {
          const url = args[0]?.toString() || '';
          if (
            url.includes('vercel-insights.com') ||
            url.includes('vercel.com/analytics') ||
            url.includes('speed-insights') ||
            url.includes('_vercel')
          ) {
            // Silently ignore analytics errors
            return new Response(null, { status: 200 });
          }
        }
        return response;
      } catch (error: unknown) {
        // Check if this is a Vercel Analytics request
        const url = args[0]?.toString() || '';
        if (
          url.includes('vercel-insights.com') ||
          url.includes('vercel.com/analytics') ||
          url.includes('speed-insights') ||
          url.includes('_vercel')
        ) {
          // Silently ignore analytics errors
          return new Response(null, { status: 200 });
        }
        throw error;
      }
    };

    // Override console.error to filter out Performance errors
    // eslint-disable-next-line no-console, @typescript-eslint/no-explicit-any
    console.error = (...args: any[]) => {
      const message = args[0]?.toString() || '';
      if (
        message.includes('Performance: Failed to fetch') ||
        message.includes('vercel-insights') ||
        message.includes('speed-insights') ||
        message.includes('_vercel') ||
        message.includes('ERR_BLOCKED_BY_CLIENT') ||
        (message.includes('Failed to fetch') && message.includes('Performance'))
      ) {
        // Silently ignore analytics errors
        return;
      }
      originalConsoleError.apply(console, args);
    };

    // Override console.warn to filter out known analytics warnings
    // eslint-disable-next-line no-console, @typescript-eslint/no-explicit-any
    console.warn = (...args: any[]) => {
      const message = args[0]?.toString() || '';
      if (
        message.includes('Vercel Web Analytics') ||
        message.includes('Speed Insights') ||
        message.includes('_vercel')
      ) {
        return;
      }
      originalConsoleWarn.apply(console, args);
    };

    // Capture resource loading errors (e.g. AdBlock blocking _vercel scripts)
    const handleResourceError = (event: Event) => {
      const target = event.target as (HTMLElement | null);
      if (!target) return;

      const isScript = target instanceof HTMLScriptElement;
      const isLink = target instanceof HTMLLinkElement;
      const url = isScript ? (target.src || '') : isLink ? (target.href || '') : '';

      if (
        url.includes('/_vercel/insights/') ||
        url.includes('/_vercel/speed-insights/') ||
        url.includes('vercel-insights.com') ||
        url.includes('speed-insights')
      ) {
        event.preventDefault();
        // Stop it from bubbling into the console as an uncaught resource error
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (event as any).stopImmediatePropagation?.();
      }
    };

    // Add global error handler for unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.toString() || '';
      if (
        reason.includes('vercel-insights') ||
        reason.includes('speed-insights') ||
        reason.includes('_vercel') ||
        reason.includes('Performance')
      ) {
        event.preventDefault();
        return;
      }
    };

    window.addEventListener('error', handleResourceError, true);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup on unmount
    return () => {
      window.fetch = originalFetch;
      // eslint-disable-next-line no-console
      console.error = originalConsoleError;
      // eslint-disable-next-line no-console
      console.warn = originalConsoleWarn;
      window.removeEventListener('error', handleResourceError, true);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
