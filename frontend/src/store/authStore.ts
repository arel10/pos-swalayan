import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '../types';

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: localStorage.getItem('pos_access_token'),
      user: null,
      setAuth: (token, user) => {
        localStorage.setItem('pos_access_token', token);
        set({ token, user });
      },
      clearAuth: () => {
        localStorage.removeItem('pos_access_token');
        localStorage.removeItem('pos_user');
        set({ token: null, user: null });
      },
      isAuthenticated: () => !!get().token,
      isAdmin: () => get().user?.role === 'admin',
    }),
    {
      name: 'pos_user',
      // Only persist user object, not token (token is in localStorage directly)
      partialize: (state) => ({ user: state.user }),
    }
  )
);
