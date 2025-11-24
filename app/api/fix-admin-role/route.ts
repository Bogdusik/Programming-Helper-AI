import { currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'

// Temporary endpoint to fix admin role for existing users
// This should be removed after fixing all users
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await currentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const userEmail = user.emailAddresses?.[0]?.emailAddress
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || []
    const isAdmin = userEmail && adminEmails.includes(userEmail.toLowerCase())

    if (!isAdmin) {
      return NextResponse.json({ 
        error: 'Your email is not in the admin list',
        yourEmail: userEmail,
        adminEmails: adminEmails.length > 0 ? adminEmails : 'ADMIN_EMAILS not set'
      }, { status: 403 })
    }

    // Find user in database
    // First check if role column exists by trying to query it
    let dbUser
    try {
      dbUser = await db.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          role: true,
        }
      })
    } catch (error: any) {
      // If role column doesn't exist, we need to add it first
      if (error?.message?.includes('role') || error?.message?.includes('does not exist')) {
        return NextResponse.json({ 
          error: 'Database schema is out of date. The role column does not exist.',
          solution: 'Please run "npx prisma db push" on your database or wait for the next deployment to sync the schema.',
          details: 'The database needs to be synced with the Prisma schema. This should happen automatically during deployment.'
        }, { status: 500 })
      }
      throw error
    }

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    // Update role to admin
    if (dbUser.role !== 'admin') {
      dbUser = await db.user.update({
        where: { id: user.id },
        data: { role: 'admin' }
      })

      logger.info('Admin role updated via fix endpoint', user.id, {
        email: userEmail,
        previousRole: 'user',
        newRole: 'admin'
      })

      return NextResponse.json({ 
        success: true,
        message: 'Admin role has been updated! Please refresh the page.',
        user: {
          id: dbUser.id,
          role: dbUser.role,
          email: userEmail
        }
      })
    } else {
      return NextResponse.json({ 
        success: true,
        message: 'You already have admin role',
        user: {
          id: dbUser.id,
          role: dbUser.role,
          email: userEmail
        }
      })
    }
  } catch (error) {
    logger.error('Error fixing admin role', undefined, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json({ 
      error: 'Failed to update admin role',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

