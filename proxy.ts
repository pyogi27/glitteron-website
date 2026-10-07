import { clerkMiddleware } from '@clerk/nextjs/server'

// Clerk's request middleware (Next 16 names this file proxy.ts). Routes are not
// gated here: account pages redirect client-side via useRequireAuth, and the
// backend rejects API calls without a valid Clerk token.
export default clerkMiddleware({ signInUrl: '/login', signUpUrl: '/signup' })

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|cur|heic|heif|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
