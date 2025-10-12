import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '../lib/api';

type User = { id:string; email: string; firstName?: string; lastName?: string } | null;

type AuthState = {
  user: User;
  setUser: (u: User) => void;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch (error) {
          console.error('Failed to logout', error);
        }
        set({ user: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
