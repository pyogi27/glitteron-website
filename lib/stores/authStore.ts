import { create } from 'zustand';
import type { WebsiteUser } from '@/lib/auth/types';

interface AuthState {
  /** Short-lived JWT — kept in memory only, never persisted */
  accessToken: string | null;
  user: WebsiteUser | null;
  setAuth: (token: string, user: WebsiteUser) => void;
  clearAuth: () => void;
}

// No `persist` middleware — the API requires the token to stay in-memory.
// Session is restored on mount via POST /refresh (httpOnly cookie).
export const useAuthStore = create<AuthState>()((set) => ({
  accessToken: null,
  user: null,
  setAuth: (accessToken, user) => set({ accessToken, user }),
  clearAuth: () => set({ accessToken: null, user: null }),
}));
