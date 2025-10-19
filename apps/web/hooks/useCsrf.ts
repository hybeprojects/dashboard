import { useEffect } from 'react';

export function useCsrfBootstrap() {
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
        const url = apiBase ? `${apiBase.replace(/\/$/, '')}/csrf-token` : '/csrf-token';

        // Don't attempt cross-origin fetches with credentials from the browser
        // as they commonly fail due to CORS or cookie restrictions and produce
        // noisy `TypeError: Failed to fetch` errors that Sentry captures.
        if (typeof window !== 'undefined') {
          let targetOrigin = new URL(url, window.location.origin).origin;
          const currentOrigin = window.location.origin;

          if (targetOrigin !== currentOrigin) {
            // If the API is on a different origin, skip the client-side CSRF bootstrap.
            // The server or a proxy should handle CSRF token bootstrapping for cross-origin setups.
            // Keep this silent to avoid noise in logs.
            return;
          }
        }

        await fetch(url, { credentials: 'include' });
      } catch (e) {
        // ignore failures; server might not be configured in dev or CORS may block the request
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);
}
