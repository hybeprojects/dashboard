import { useEffect } from 'react';

export function useCsrfBootstrap() {
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // Always call the local proxy so the browser only makes a same-origin request.
        const url = '/api/csrf-token';
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
