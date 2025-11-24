import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    tests: {}
  }

  try {
    // Test 1: Check Clerk authentication
    const clerkUser = await currentUser()
    results.tests.clerkAuth = {
      success: !!clerkUser,
      userId: clerkUser?.id,
      email: clerkUser?.emailAddresses?.[0]?.emailAddress
    }

    if (!clerkUser) {
      return NextResponse.json({
        ...results,
        error: 'Not authenticated'
      }, { status: 401 })
    }

    // Test 2: Check getCurrentUser()
    try {
      const dbUser = await getCurrentUser()
      results.tests.getCurrentUser = {
        success: !!dbUser,
        userId: dbUser?.id,
        role: dbUser?.role,
        isBlocked: dbUser?.isBlocked
      }
    } catch (error) {
      results.tests.getCurrentUser = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    }

    // Test 3: Check direct database query for stats
    try {
      const stats = await db.stats.findUnique({
        where: { userId: clerkUser.id }
      })
      results.tests.getStats = {
        success: true,
        statsExists: !!stats,
        stats: stats ? {
          questionsAsked: stats.questionsAsked,
          tasksCompleted: stats.tasksCompleted
        } : null
      }
    } catch (error) {
      results.tests.getStats = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // Test 4: Check user in database with all fields
    try {
      const fullUser = await db.user.findUnique({
        where: { id: clerkUser.id }
      })
      results.tests.getFullUser = {
        success: !!fullUser,
        hasAllFields: !!fullUser,
        fields: fullUser ? Object.keys(fullUser) : []
      }
    } catch (error) {
      results.tests.getFullUser = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    logger.error('Test endpoint failed', undefined, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json({
      ...results,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

