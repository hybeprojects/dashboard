import { useEffect } from 'react';
import * as React from 'react';
import { useAuthStore } from '../state/useAuthStore';
import { me } from '../lib/auth';

export function useAuthSession() {
  const setUser = useAuthStore((s) => s.setUser);

  React.useEffect(() => {
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
