import { create } from 'zustand';
import type { WebsiteUser } from '@/lib/auth/types';

interface AuthState {
  /** Backend profile of the signed-in Clerk user; null when signed out. */
  user: WebsiteUser | null;
  /** True once SessionRestorer knows whether a Clerk session exists (and loaded its profile). */
  hydrated: boolean;
  setUser: (user: WebsiteUser) => void;
  clearAuth: () => void;
  setHydrated: () => void;
}

// No `persist` — Clerk owns the session; tokens come from getAuthToken() per request.
export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  hydrated: false,
  setUser: (user) => set({ user }),
  clearAuth: () => set({ user: null }),
  setHydrated: () => set({ hydrated: true }),
}));
