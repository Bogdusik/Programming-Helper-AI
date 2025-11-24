import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'

// Endpoint to check current database connection and show connection info
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Get DATABASE_URL (masked for security)
    const dbUrl = process.env.DATABASE_URL
    const maskedUrl = dbUrl 
      ? dbUrl.replace(/(:\/\/[^:]+:)([^@]+)(@)/, '$1***$3') // Mask password
      : 'NOT SET'
    
    // Test connection
    let connectionStatus = 'unknown'
    let error: string | null = null
    
    try {
      await db.$queryRaw`SELECT 1`
      connectionStatus = 'connected'
    } catch (err) {
      connectionStatus = 'failed'
      error = err instanceof Error ? err.message : 'Unknown error'
    }
    
    // Get database info
    let dbInfo: any = {}
    try {
      const result = await db.$queryRaw<Array<{ current_database: string }>>`
        SELECT current_database()
      `
      dbInfo.databaseName = result[0]?.current_database || 'unknown'
      
      // Get tables count
      const tables = await db.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `
      dbInfo.tablesCount = Number(tables[0]?.count || 0)
      
      // Get users count
      try {
        const users = await db.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*) as count FROM users
        `
        dbInfo.usersCount = Number(users[0]?.count || 0)
      } catch {
        dbInfo.usersCount = 'table does not exist'
      }
      
      // Get messages count
      try {
        const messages = await db.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*) as count FROM messages
        `
        dbInfo.messagesCount = Number(messages[0]?.count || 0)
      } catch {
        dbInfo.messagesCount = 'table does not exist'
      }
    } catch (err) {
      dbInfo.error = err instanceof Error ? err.message : 'Unknown error'
    }
    
    return NextResponse.json({
      connection: {
        status: connectionStatus,
        error: error || undefined,
        databaseUrl: maskedUrl,
        host: dbUrl ? new URL(dbUrl).hostname : undefined
      },
      database: dbInfo,
      instructions: {
        toChangeDatabase: [
          '1. Find your old DATABASE_URL',
          '2. Go to Vercel Dashboard → Settings → Environment Variables',
          '3. Update DATABASE_URL with old value',
          '4. Redeploy the project',
          '5. Call /api/final-schema-sync to sync schema'
        ]
      }
    })
  } catch (error) {
    logger.error('Error checking database', undefined, {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    return NextResponse.json({
      error: 'Failed to check database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

