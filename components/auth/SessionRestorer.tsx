'use client';

import { useEffect } from 'react';
import { refreshToken, getMe } from '@/lib/auth/api';
import { useAuthStore } from '@/lib/stores/authStore';

/**
 * Mounted once in the root layout. On page load it silently calls POST /refresh
 * using the httpOnly cookie. If the cookie is valid, re-hydrates the in-memory
 * accessToken + user without any visible flash.
 */
export default function SessionRestorer() {
  const setAuth = useAuthStore(s => s.setAuth);

  useEffect(() => {
    (async () => {
      try {
        const { accessToken } = await refreshToken();
        const { user } = await getMe(accessToken);
        setAuth(accessToken, user);
      } catch {
        // Cookie absent or expired — user is logged out, nothing to do
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
