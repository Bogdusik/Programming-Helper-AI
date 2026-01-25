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
    const originalConsoleError = console.error;

    // Override fetch to silently handle Vercel Analytics errors
    window.fetch = async (...args) => {
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
      } catch (error: any) {
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
    console.error = (...args: any[]) => {
      const message = args[0]?.toString() || '';
      if (
        message.includes('Performance: Failed to fetch') ||
        message.includes('vercel-insights') ||
        message.includes('speed-insights') ||
        message.includes('_vercel') ||
        (message.includes('Failed to fetch') && message.includes('Performance'))
      ) {
        // Silently ignore analytics errors
        return;
      }
      originalConsoleError.apply(console, args);
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

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup on unmount
    return () => {
      window.fetch = originalFetch;
      console.error = originalConsoleError;
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
