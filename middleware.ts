import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/chat(.*)',
  '/stats(.*)',
  '/admin(.*)',
  '/settings(.*)',
  '/tasks(.*)'
])

// Routes that are accessible even when blocked (they handle their own auth)
const isBlockedAllowedRoute = createRouteMatcher([
  '/blocked(.*)',
  '/contact(.*)',
  '/privacy(.*)',
  '/terms(.*)'
])

// Public API routes that don't require authentication (Clerk skips these)
const isPublicApiRoute = createRouteMatcher([
  '/api/trpc/stats.getGlobalStats(.*)',
  '/api/health(.*)',
  '/api/check-clerk-env(.*)',
  '/api/clear-session(.*)',
  '/api/diagnose(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (isPublicApiRoute(req)) {
    return NextResponse.next()
  }
  
  // Allow blocked and contact pages without protection (they handle their own auth)
  if (isBlockedAllowedRoute(req)) {
    return NextResponse.next()
  }
  
  // Protect other routes
  // Note: Block status check is handled on client-side and in tRPC procedures
  // because middleware runs in Edge Runtime which doesn't support Prisma
  if (isProtectedRoute(req)) {
    try {
      // Use auth() to check authentication status safely
      // This prevents unhandled rejection errors
      const { userId } = await auth()
      
      if (!userId) {
        const requestUrl = new URL(req.url)
        // Post sign-up: Clerk redirects to /chat?fromSignUp=true but session may not be in first request yet
        if (requestUrl.pathname === '/chat' && requestUrl.searchParams.get('fromSignUp') === 'true') {
          return NextResponse.next()
        }
        // RSC/prefetch requests during client-side navigation often get auth() null
        // (Clerk known issue). Allow them through so switching chats doesn't redirect to sign-in.
        const isRscOrPrefetch =
          req.headers.get('RSC') === '1' ||
          req.headers.get('Next-Router-Prefetch') === '1'
        const referer = req.headers.get('Referer')
        const requestOrigin = requestUrl.origin
        const isSameOriginNav = referer?.startsWith(requestOrigin)
        if (isRscOrPrefetch && isSameOriginNav) {
          return NextResponse.next()
        }
        // True unauthenticated access (e.g. direct URL) - redirect to sign-in
        const signInUrl = new URL('/sign-in', req.url)
        signInUrl.searchParams.set('redirect_url', req.url)
        return NextResponse.redirect(signInUrl)
      }
      
      // User is authenticated - allow access
      return NextResponse.next()
    } catch {
      // Auth error (e.g. invalid session, keys mismatch) → clear cookies first to break redirect loop
      const clearUrl = new URL('/api/clear-session', req.url)
      return NextResponse.redirect(clearUrl)
    }
  }
  
  // Allow all other routes
  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
