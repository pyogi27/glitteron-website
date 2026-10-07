'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useAuthStore } from '@/lib/stores/authStore';

/**
 * Account-only pages: send visitors with no Clerk session to /login (Clerk returns
 * them here via redirect_url). Keyed on Clerk's own state, not the backend profile:
 * a signed-in user whose profile failed to load would otherwise loop through /login
 * (SessionRestorer shows them the error instead). True once the page may render.
 */
export function useRequireAuth(): boolean {
  const hydrated = useAuthStore(s => s.hydrated);
  const user = useAuthStore(s => s.user);
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.replace(`/login?redirect_url=${encodeURIComponent(pathname)}`);
  }, [isLoaded, isSignedIn, router, pathname]);

  return hydrated && !!user;
}
