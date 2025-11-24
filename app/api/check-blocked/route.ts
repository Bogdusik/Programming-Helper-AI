import { currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'

// Disable caching for this endpoint to ensure fresh block status
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  let user = null
  try {
    user = await currentUser()
    
    if (!user) {
      return NextResponse.json({ isBlocked: false }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        }
      })
    }

    // Try to get user from database with retry logic
    let dbUser = null
    let retries = 3
    
    while (retries > 0 && !dbUser) {
      try {
        dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { isBlocked: true }
        })
        break
      } catch (dbError) {
        retries--
        if (retries === 0) {
          // If database query fails, log error but return false (not blocked) to prevent blocking users
          logger.error('Database error checking block status', user.id, {
            error: dbError instanceof Error ? dbError.message : 'Unknown database error',
          })
          return NextResponse.json({ isBlocked: false }, {
            headers: {
              'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            }
          })
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    return NextResponse.json({ 
      isBlocked: dbUser?.isBlocked ?? false 
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      }
    })
  } catch (error) {
    logger.error('Error checking block status', user?.id, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    // Return false (not blocked) on error to prevent blocking users due to system errors
    return NextResponse.json({ isBlocked: false }, { 
      status: 200, // Changed to 200 to prevent client errors
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      }
    })
  }
}

