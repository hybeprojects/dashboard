import { create } from 'zustand';

type User = { id: string; email: string; firstName?: string; lastName?: string } | null;

type AuthState = {
  user: User;
  setUser: (u: User) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => {
    if (typeof window !== 'undefined') localStorage.removeItem('token');
    set({ user: null });
  },
}));
