import { useEffect } from 'react';
import getSupabase from '../lib/supabase';
import { useAuthStore } from '../state/useAuthStore';
import api from '../lib/api';

export function useSupabaseSession() {
  const setUser = useAuthStore((s) => s.setUser);
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    supabase.auth.getSession().then((r) => {
      const session = r.data.session;
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email || '' });
        // exchange supabase token with backend
        if ((session as any).access_token) {
          backendLoginWithSupabase((session as any).access_token).catch(() => {});
        }
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email || '' });
        if ((session as any).access_token) {
          backendLoginWithSupabase((session as any).access_token).catch(() => {});
        }
      } else {
        setUser(null);
        if (typeof window !== 'undefined') localStorage.removeItem('token');
      }
    });

    return () => {
      sub?.subscription?.unsubscribe?.();
    };
  }, [setUser]);
}

export async function backendLoginWithSupabase(accessToken: string) {
  // exchange supabase session.access_token with backend JWT
  const { data } = await api.post('/auth/supabase', { accessToken });
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', data.accessToken);
  }
  return data;
}
