import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '../state/useAuthStore';

export default function useRequireAuth() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    // If the store has been initialized and user is null, redirect to login
    if (typeof window === 'undefined') return;
    // The app initializes session on _app via useSupabaseSession; if user is null after that, redirect
    if (user === null) {
      router.replace('/login');
    }
  }, [user, router]);
}
