import { NextResponse } from 'next/server'

/**
 * Public route to verify which Clerk keys the running deployment sees.
 * Open: https://your-app.vercel.app/api/check-clerk-env
 * Compare publishableKeyPrefix with the start of your key in Clerk Dashboard.
 */
export const dynamic = 'force-dynamic'

export async function GET() {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  const skSet = Boolean(process.env.CLERK_SECRET_KEY)
  return NextResponse.json({
    ok: true,
    publishableKeyPrefix: pk ? `${pk.slice(0, 24)}...` : null,
    publishableKeySet: Boolean(pk),
    secretKeySet: skSet,
    hint: 'Compare publishableKeyPrefix with Clerk Dashboard → API keys. If it shows the OLD key, redeploy with "Clear build cache" or push a commit to force a new build.',
  })
}
