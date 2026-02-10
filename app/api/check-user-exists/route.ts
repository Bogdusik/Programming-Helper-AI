import { currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Check if user exists in database (was registered through sign-up)
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await currentUser()
    
    if (!user) {
      return NextResponse.json({ exists: false }, { status: 401 })
    }

    // Check if user exists in database; if not (e.g. created in Clerk via API), create them
    let dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true }
    })
    if (!dbUser) {
      const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || []
      const userEmail = user.emailAddresses?.[0]?.emailAddress
      const isAdmin = userEmail && adminEmails.includes(userEmail.toLowerCase())
      try {
        await db.user.create({
          data: {
            id: user.id,
            role: isAdmin ? 'admin' : 'user',
            isBlocked: false
          }
        })
        dbUser = { id: user.id }
      } catch (e) {
        if (e && typeof e === 'object' && e !== null && 'code' in e && (e as { code: string }).code === 'P2002') {
          dbUser = await db.user.findUnique({ where: { id: user.id }, select: { id: true } })
        }
      }
    }

    return NextResponse.json({ 
      exists: !!dbUser 
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      }
    })
  } catch {
    // On error, assume user doesn't exist to be safe
    return NextResponse.json({ exists: false }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      }
    })
  }
}

