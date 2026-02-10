import { NextResponse } from 'next/server'

/**
 * Clears site cookies and redirects to home. Use when stuck in Clerk redirect loop
 * (e.g. after switching Clerk apps or keys). Open: /api/clear-session
 */
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const origin = url.origin
  const res = NextResponse.redirect(`${origin}/`, 302)
  res.headers.set('Clear-Site-Data', '"cookies"')
  return res
}
