import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '../api/client';

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isHydrated: boolean;
  setSession: (token: string, user: AuthUser) => void;
  clearSession: () => void;
  markHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isHydrated: false,
      setSession: (token, user) => set({ token, user, isHydrated: true }),
      clearSession: () => set({ token: null, user: null, isHydrated: true }),
      markHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: 'flypy-auth',
      onRehydrateStorage: () => () => {
        useAuthStore.getState().markHydrated();
      },
    }
  )
);
