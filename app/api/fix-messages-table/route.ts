import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'

// Endpoint to fix messages table structure
export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    logger.info('Fixing messages table structure', undefined)
    
    const results: any = {
      addedColumns: [],
      errors: []
    }
    
    // Check if messages table exists
    const tableCheck = await db.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' AND tablename = 'messages'
    `
    
    if (tableCheck.length === 0) {
      // Create messages table if it doesn't exist
      try {
        await db.$executeRawUnsafe(`
          CREATE TABLE "messages" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "chatSessionId" TEXT,
            "role" TEXT NOT NULL,
            "content" TEXT NOT NULL,
            "questionType" TEXT,
            "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
          )
        `)
        
        // Create indexes
        await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "messages_userId_timestamp_idx" ON "messages"("userId", "timestamp")`)
        await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "messages_chatSessionId_timestamp_idx" ON "messages"("chatSessionId", "timestamp")`)
        await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "messages_role_idx" ON "messages"("role")`)
        await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "messages_questionType_idx" ON "messages"("questionType")`)
        
        // Create foreign keys
        await db.$executeRawUnsafe(`
          DO $$ BEGIN 
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_userId_fkey') THEN 
              ALTER TABLE "messages" ADD CONSTRAINT "messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE; 
            END IF; 
          END $$;
        `)
        
        await db.$executeRawUnsafe(`
          DO $$ BEGIN 
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_chatSessionId_fkey') THEN 
              ALTER TABLE "messages" ADD CONSTRAINT "messages_chatSessionId_fkey" FOREIGN KEY ("chatSessionId") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE; 
            END IF; 
          END $$;
        `)
        
        results.addedColumns.push('messages table created')
        logger.info('Messages table created successfully', undefined)
      } catch (error) {
        results.errors.push(`Failed to create messages table: ${error instanceof Error ? error.message : 'Unknown'}`)
      }
    } else {
      // Table exists, check for missing columns
      const columns = await db.$queryRaw<Array<{ column_name: string }>>`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'messages'
      `
      
      const existingColumns = columns.map(c => c.column_name)
      const requiredColumns = [
        { name: 'chatSessionId', type: 'TEXT', nullable: true },
        { name: 'questionType', type: 'TEXT', nullable: true },
        { name: 'role', type: 'TEXT', nullable: false },
        { name: 'content', type: 'TEXT', nullable: false },
        { name: 'timestamp', type: 'TIMESTAMP(3)', nullable: false, default: 'CURRENT_TIMESTAMP' }
      ]
      
      for (const col of requiredColumns) {
        if (!existingColumns.includes(col.name)) {
          try {
            const nullable = col.nullable ? '' : ' NOT NULL'
            const defaultVal = col.default ? ` DEFAULT ${col.default}` : ''
            await db.$executeRawUnsafe(`ALTER TABLE "messages" ADD COLUMN "${col.name}" ${col.type}${nullable}${defaultVal}`)
            results.addedColumns.push(col.name)
            logger.info(`Added column ${col.name} to messages table`, undefined)
          } catch (error) {
            results.errors.push(`Failed to add column ${col.name}: ${error instanceof Error ? error.message : 'Unknown'}`)
          }
        }
      }
      
      // Check and create indexes
      const indexes = [
        { name: 'messages_userId_timestamp_idx', sql: 'CREATE INDEX IF NOT EXISTS "messages_userId_timestamp_idx" ON "messages"("userId", "timestamp")' },
        { name: 'messages_chatSessionId_timestamp_idx', sql: 'CREATE INDEX IF NOT EXISTS "messages_chatSessionId_timestamp_idx" ON "messages"("chatSessionId", "timestamp")' },
        { name: 'messages_role_idx', sql: 'CREATE INDEX IF NOT EXISTS "messages_role_idx" ON "messages"("role")' },
        { name: 'messages_questionType_idx', sql: 'CREATE INDEX IF NOT EXISTS "messages_questionType_idx" ON "messages"("questionType")' }
      ]
      
      for (const index of indexes) {
        try {
          await db.$executeRawUnsafe(index.sql)
        } catch (error) {
          // Index creation errors are not critical
          logger.info(`Index ${index.name} creation skipped`, undefined)
        }
      }
      
      // Check and create foreign keys
      const foreignKeys = [
        { name: 'messages_userId_fkey', sql: `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_userId_fkey') THEN ALTER TABLE "messages" ADD CONSTRAINT "messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;` },
        { name: 'messages_chatSessionId_fkey', sql: `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_chatSessionId_fkey') THEN ALTER TABLE "messages" ADD CONSTRAINT "messages_chatSessionId_fkey" FOREIGN KEY ("chatSessionId") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;` }
      ]
      
      for (const fk of foreignKeys) {
        try {
          await db.$executeRawUnsafe(fk.sql)
        } catch (error) {
          results.errors.push(`Failed to add foreign key ${fk.name}: ${error instanceof Error ? error.message : 'Unknown'}`)
        }
      }
    }
    
    return NextResponse.json({
      success: results.errors.length === 0 || results.addedColumns.length > 0,
      message: 'Messages table fixed',
      addedColumns: results.addedColumns,
      errors: results.errors.length > 0 ? results.errors : undefined
    })
  } catch (error) {
    logger.error('Error fixing messages table', undefined, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json({
      success: false,
      error: 'Failed to fix messages table',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

