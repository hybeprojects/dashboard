import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuthStore } from '../state/useAuthStore';
import { useEffect } from 'react';

const fetchUser = async () => {
  const { data } = await api.get('/auth/me');
  return data.user;
};

export default function useCurrentUser() {
  const setUser = useAuthStore((s) => s.setUser);
  const { data: user, error } = useQuery(['currentUser'], fetchUser, {
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
