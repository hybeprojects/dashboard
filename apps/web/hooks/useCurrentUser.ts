import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../state/useAuthStore';
import { useEffect } from 'react';
import { createClient } from '../lib/supabase/client';

export default function useCurrentUser() {
  const supabase = createClient();
  const setUser = useAuthStore((s) => s.setUser);

  const { data: user, error } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (user) {
      setUser(user);
    }
    if (error) {
      setUser(null);
    }
  }, [user, error, setUser]);

  return { user, error };
}
