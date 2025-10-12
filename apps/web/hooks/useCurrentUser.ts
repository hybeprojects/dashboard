import { useEffect } from 'react';
import api from '../lib/api';
import { useAuthStore } from '../state/useAuthStore';
import { useEffect } from 'react';

export default function useCurrentUser() {
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/auth/me');
        if (!mounted) return;
        const data = res.data;
        if (data && data.user) {
          setUser({
            id: data.user.id,
            email: data.user.email,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
          });
        } else {
          setUser(null);
        }
      } catch (e) {
        setUser(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [setUser]);
}
