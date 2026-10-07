'use client';

import { useEffect, useState } from 'react';
import { useAuth, useClerk } from '@clerk/nextjs';
import { getMe, setTokenGetter } from '@/lib/auth/api';
import { useAuthStore } from '@/lib/stores/authStore';
import type { ApiError } from '@/lib/auth/types';

/**
 * Mounted once inside ClerkProvider. Hands Clerk's getToken to the API helpers and
 * mirrors the Clerk session into the auth store: on sign-in it loads the backend
 * profile (GET /me, which links or creates the website account on first use), on
 * sign-out it clears it. If the backend refuses a signed-in user (inactive account,
 * unverified email) it says so here rather than bouncing them through /login.
 */
export default function SessionRestorer() {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth();
  const { signOut } = useClerk();
  const setUser = useAuthStore(s => s.setUser);
  const clearAuth = useAuthStore(s => s.clearAuth);
  const setHydrated = useAuthStore(s => s.setHydrated);
  const [profileError, setProfileError] = useState<string | null>(null);

  // During render, not in an effect: sibling components' effects can fire first.
  setTokenGetter(getToken);

  useEffect(() => {
    if (!isLoaded) return;
    setProfileError(null);
    if (!isSignedIn) {
      clearAuth();
      setHydrated();
      return;
    }
    let cancelled = false;
    getMe()
      .then(({ user }) => { if (!cancelled) setUser(user); })
      .catch((err: ApiError) => {
        if (cancelled) return;
        clearAuth();
        setProfileError(err.message ?? 'We could not load your account.');
      })
      .finally(() => { if (!cancelled) setHydrated(); });
    return () => { cancelled = true; };
  }, [isLoaded, isSignedIn, userId, setUser, clearAuth, setHydrated]);

  if (!profileError) return null;
  return (
    <div role="alert" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-[calc(100%-32px)] max-w-[440px] rounded-xl px-5 py-4 shadow-lg font-sans text-[13px] font-light"
      style={{ background: '#1A1210', color: '#EDE8E0' }}>
      <p>{profileError}</p>
      <button
        type="button"
        onClick={() => signOut({ redirectUrl: '/' })}
        className="mt-3 rounded-3xl px-5 py-2 text-[11px] font-medium tracking-[0.12em] uppercase transition-all hover:brightness-110"
        style={{ background: '#C4714A', color: '#EDE8E0' }}
      >
        Sign out
      </button>
    </div>
  );
}
