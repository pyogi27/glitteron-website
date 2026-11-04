/** 32 random bytes, base64url: the backend's order-link token format. */
const TOKEN_FORMAT = /^[A-Za-z0-9_-]{43}$/

/** The order-link token from a URL fragment (`#t=…`), or null when absent or malformed. */
export function tokenFromHash(hash: string): string | null {
  const token = new URLSearchParams(hash.replace(/^#/, '')).get('t')
  return token && TOKEN_FORMAT.test(token) ? token : null
}

/** Same rule as the backend (and the Customer model): enough to catch typos, not a verifier. */
export const isPlausibleEmail = (email: string): boolean =>
  email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const GUEST_SESSION_MARK = 'litmeup-guest-session'

/** Checkout started a guest session in this browser (its cookie is httpOnly, so JS can't see it). */
export function markGuestSession(): void {
  try { localStorage.setItem(GUEST_SESSION_MARK, '1') } catch { /* storage blocked: the cookie just expires on its own */ }
}

/** True once after markGuestSession, so sign-in ends a leftover guest session without a request on every page. */
export function takeGuestSessionMark(): boolean {
  try {
    const marked = localStorage.getItem(GUEST_SESSION_MARK) === '1'
    if (marked) localStorage.removeItem(GUEST_SESSION_MARK)
    return marked
  } catch {
    return false
  }
}
