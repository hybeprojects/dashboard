import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../state/useAuthStore';
import api from '../lib/api';

export function useSupabaseSession() {
  const setUser = useAuthStore((s) => s.setUser);
  useEffect(() => {
    const session = supabase.auth.getSession().then((r) => r.data.session);
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email || '' });
      } else {
        setUser(null);
      }
    });
  }, [setUser]);
}

export async function backendLoginWithSupabase(accessToken: string) {
  // exchange supabase session.access_token with backend JWT
  const { data } = await api.post('/auth/supabase', { accessToken });
  localStorage.setItem('token', data.accessToken);
  return data;
}
