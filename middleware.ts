import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher([
  '/chat(.*)',
  '/stats(.*)',
  '/admin(.*)'
])

const isPublicApiRoute = createRouteMatcher([
  '/api/trpc/stats.getGlobalStats(.*)'
])

export default clerkMiddleware((auth, req) => {
  if (isPublicApiRoute(req)) return
  
  // Protect other routes
  if (isProtectedRoute(req)) auth.protect()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
