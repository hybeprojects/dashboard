import { useEffect } from 'react';

export function useCsrfBootstrap() {
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
        const url = apiBase ? `${apiBase.replace(/\/$/, '')}/csrf-token` : '/csrf-token';
        await fetch(url, { credentials: 'include' });
      } catch (e) {
        // ignore failures; server might not be configured in dev
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);
}
