import { useEffect } from 'react';
import { useAuthStore } from '../state/useAuthStore';
import { me } from '../lib/auth';

export function useSupabaseSession() {
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const user = await me();
      if (mounted) setUser(user);
    })();
    return () => {
      mounted = false;
    };
  }, [setUser]);
}
