import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuthStore } from '../state/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import { me } from '../lib/auth';

export default function useCurrentUser() {
  const setUser = useAuthStore((s) => s.setUser);

  const { data: user, error } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      return await me();
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
