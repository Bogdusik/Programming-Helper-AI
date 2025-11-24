import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'

// Complete schema synchronization endpoint
// Creates ALL missing tables from Prisma schema
export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    logger.info('Starting complete schema synchronization', undefined)
    
    const results: any = {
      removedColumns: [],
      createdTables: [],
      errors: []
    }
    
    // Step 1: Remove old columns from users table
    try {
      const userColumns = await db.$queryRaw<Array<{ column_name: string }>>`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users'
      `
      
      const existingColumns = userColumns.map(c => c.column_name)
      const columnsToRemove = ['email', 'name', 'emailVerified', 'image']
      
      for (const col of columnsToRemove) {
        if (existingColumns.includes(col)) {
          try {
            await db.$executeRawUnsafe(`ALTER TABLE users DROP COLUMN IF EXISTS "${col}" CASCADE`)
            results.removedColumns.push(col)
            logger.info(`Removed column ${col} from users table`, undefined)
          } catch (error) {
            results.errors.push(`Failed to remove column ${col}: ${error instanceof Error ? error.message : 'Unknown'}`)
          }
        }
      }
    } catch (error) {
      logger.error('Error removing old columns', undefined, { error: error instanceof Error ? error.message : 'Unknown' })
    }
    
    // Step 2: Create all missing tables
    const tablesToCreate = [
      {
        name: 'stats',
        sql: `
          CREATE TABLE IF NOT EXISTS "stats" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "questionsAsked" INTEGER NOT NULL DEFAULT 0,
            "avgResponseTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "mostFrequentResponseType" TEXT,
            "totalTimeSpent" INTEGER NOT NULL DEFAULT 0,
            "tasksCompleted" INTEGER NOT NULL DEFAULT 0,
            "averageQuestionsPerTask" DOUBLE PRECISION,
            "languagesUsed" TEXT[] DEFAULT ARRAY[]::TEXT[],
            "improvementScore" DOUBLE PRECISION,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "stats_pkey" PRIMARY KEY ("id")
          )
        `,
        indexes: [
          `CREATE UNIQUE INDEX IF NOT EXISTS "stats_userId_key" ON "stats"("userId")`
        ],
        foreignKeys: [
          `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stats_userId_fkey') THEN ALTER TABLE "stats" ADD CONSTRAINT "stats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;`
        ]
      },
      {
        name: 'chat_sessions',
        sql: `
          CREATE TABLE IF NOT EXISTS "chat_sessions" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "title" TEXT NOT NULL DEFAULT 'New Chat',
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
          )
        `,
        indexes: [
          `CREATE INDEX IF NOT EXISTS "chat_sessions_userId_updatedAt_idx" ON "chat_sessions"("userId", "updatedAt")`
        ],
        foreignKeys: [
          `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chat_sessions_userId_fkey') THEN ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;`
        ]
      },
      {
        name: 'messages',
        sql: `
          CREATE TABLE IF NOT EXISTS "messages" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "chatSessionId" TEXT,
            "role" TEXT NOT NULL,
            "content" TEXT NOT NULL,
            "questionType" TEXT,
            "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
          )
        `,
        indexes: [
          `CREATE INDEX IF NOT EXISTS "messages_userId_timestamp_idx" ON "messages"("userId", "timestamp")`,
          `CREATE INDEX IF NOT EXISTS "messages_chatSessionId_timestamp_idx" ON "messages"("chatSessionId", "timestamp")`,
          `CREATE INDEX IF NOT EXISTS "messages_role_idx" ON "messages"("role")`,
          `CREATE INDEX IF NOT EXISTS "messages_questionType_idx" ON "messages"("questionType")`
        ],
        foreignKeys: [
          `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_userId_fkey') THEN ALTER TABLE "messages" ADD CONSTRAINT "messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;`,
          `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_chatSessionId_fkey') THEN ALTER TABLE "messages" ADD CONSTRAINT "messages_chatSessionId_fkey" FOREIGN KEY ("chatSessionId") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;`
        ]
      },
      {
        name: 'user_profiles',
        sql: `
          CREATE TABLE IF NOT EXISTS "user_profiles" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "experience" TEXT,
            "focusAreas" TEXT[] DEFAULT ARRAY[]::TEXT[],
            "confidence" INTEGER,
            "aiExperience" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
          )
        `,
        indexes: [
          `CREATE UNIQUE INDEX IF NOT EXISTS "user_profiles_userId_key" ON "user_profiles"("userId")`
        ],
        foreignKeys: [
          `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_userId_fkey') THEN ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;`
        ]
      },
      {
        name: 'assessments',
        sql: `
          CREATE TABLE IF NOT EXISTS "assessments" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "type" TEXT NOT NULL,
            "language" TEXT,
            "score" INTEGER,
            "totalQuestions" INTEGER NOT NULL DEFAULT 0,
            "confidence" INTEGER NOT NULL,
            "answers" JSONB NOT NULL,
            "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
          )
        `,
        indexes: [
          `CREATE INDEX IF NOT EXISTS "assessments_userId_type_idx" ON "assessments"("userId", "type")`
        ],
        foreignKeys: [
          `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assessments_userId_fkey') THEN ALTER TABLE "assessments" ADD CONSTRAINT "assessments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;`
        ]
      },
      {
        name: 'assessment_questions',
        sql: `
          CREATE TABLE IF NOT EXISTS "assessment_questions" (
            "id" TEXT NOT NULL,
            "question" TEXT NOT NULL,
            "type" TEXT NOT NULL,
            "options" JSONB,
            "correctAnswer" TEXT NOT NULL,
            "category" TEXT NOT NULL,
            "difficulty" TEXT NOT NULL,
            "language" TEXT,
            "explanation" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "assessment_questions_pkey" PRIMARY KEY ("id")
          )
        `,
        indexes: [
          `CREATE INDEX IF NOT EXISTS "assessment_questions_difficulty_language_idx" ON "assessment_questions"("difficulty", "language")`,
          `CREATE INDEX IF NOT EXISTS "assessment_questions_category_idx" ON "assessment_questions"("category")`
        ],
        foreignKeys: []
      },
      {
        name: 'language_progress',
        sql: `
          CREATE TABLE IF NOT EXISTS "language_progress" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "language" TEXT NOT NULL,
            "questionsAsked" INTEGER NOT NULL DEFAULT 0,
            "tasksCompleted" INTEGER NOT NULL DEFAULT 0,
            "lastUsedAt" TIMESTAMP(3),
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "language_progress_pkey" PRIMARY KEY ("id")
          )
        `,
        indexes: [
          `CREATE UNIQUE INDEX IF NOT EXISTS "language_progress_userId_language_key" ON "language_progress"("userId", "language")`,
          `CREATE INDEX IF NOT EXISTS "language_progress_userId_idx" ON "language_progress"("userId")`
        ],
        foreignKeys: [
          `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'language_progress_userId_fkey') THEN ALTER TABLE "language_progress" ADD CONSTRAINT "language_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;`
        ]
      },
      {
        name: 'programming_tasks',
        sql: `
          CREATE TABLE IF NOT EXISTS "programming_tasks" (
            "id" TEXT NOT NULL,
            "title" TEXT NOT NULL,
            "description" TEXT NOT NULL,
            "language" TEXT NOT NULL,
            "difficulty" TEXT NOT NULL,
            "category" TEXT NOT NULL,
            "starterCode" TEXT,
            "hints" TEXT[] DEFAULT ARRAY[]::TEXT[],
            "solution" TEXT,
            "testCases" JSONB,
            "isActive" BOOLEAN NOT NULL DEFAULT true,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "programming_tasks_pkey" PRIMARY KEY ("id")
          )
        `,
        indexes: [
          `CREATE INDEX IF NOT EXISTS "programming_tasks_language_difficulty_idx" ON "programming_tasks"("language", "difficulty")`,
          `CREATE INDEX IF NOT EXISTS "programming_tasks_category_idx" ON "programming_tasks"("category")`
        ],
        foreignKeys: []
      },
      {
        name: 'user_task_progress',
        sql: `
          CREATE TABLE IF NOT EXISTS "user_task_progress" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "taskId" TEXT NOT NULL,
            "status" TEXT NOT NULL DEFAULT 'not_started',
            "attempts" INTEGER NOT NULL DEFAULT 0,
            "completedAt" TIMESTAMP(3),
            "chatSessionId" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "user_task_progress_pkey" PRIMARY KEY ("id")
          )
        `,
        indexes: [
          `CREATE UNIQUE INDEX IF NOT EXISTS "user_task_progress_userId_taskId_key" ON "user_task_progress"("userId", "taskId")`,
          `CREATE INDEX IF NOT EXISTS "user_task_progress_userId_status_idx" ON "user_task_progress"("userId", "status")`
        ],
        foreignKeys: [
          `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_task_progress_userId_fkey') THEN ALTER TABLE "user_task_progress" ADD CONSTRAINT "user_task_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;`,
          `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_task_progress_taskId_fkey') THEN ALTER TABLE "user_task_progress" ADD CONSTRAINT "user_task_progress_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "programming_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;`
        ]
      },
      {
        name: 'contact_messages',
        sql: `
          CREATE TABLE IF NOT EXISTS "contact_messages" (
            "id" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "email" TEXT NOT NULL,
            "subject" TEXT NOT NULL,
            "message" TEXT NOT NULL,
            "status" TEXT NOT NULL DEFAULT 'pending',
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
          )
        `,
        indexes: [
          `CREATE INDEX IF NOT EXISTS "contact_messages_status_createdAt_idx" ON "contact_messages"("status", "createdAt")`
        ],
        foreignKeys: []
      }
    ]
    
    // Check existing tables
    const existingTables = await db.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `
    const existingTableNames = existingTables.map(t => t.tablename)
    
    // Create missing tables
    for (const table of tablesToCreate) {
      if (!existingTableNames.includes(table.name)) {
        try {
          // Create table
          await db.$executeRawUnsafe(table.sql)
          
          // Create indexes
          for (const indexSQL of table.indexes) {
            await db.$executeRawUnsafe(indexSQL)
          }
          
          // Create foreign keys
          for (const fkSQL of table.foreignKeys) {
            await db.$executeRawUnsafe(fkSQL)
          }
          
          results.createdTables.push(table.name)
          logger.info(`Created table ${table.name}`, undefined)
        } catch (error) {
          const errorMsg = `Failed to create table ${table.name}: ${error instanceof Error ? error.message : 'Unknown'}`
          results.errors.push(errorMsg)
          logger.error(errorMsg, undefined, { error: error instanceof Error ? error.message : 'Unknown' })
        }
      } else {
        logger.info(`Table ${table.name} already exists`, undefined)
      }
    }
    
    // Step 3: Ensure updatedAt triggers exist for tables that need them
    const tablesWithUpdatedAt = ['stats', 'chat_sessions', 'messages', 'user_profiles', 'language_progress', 'programming_tasks', 'user_task_progress', 'contact_messages']
    
    for (const tableName of tablesWithUpdatedAt) {
      if (existingTableNames.includes(tableName) || results.createdTables.includes(tableName)) {
        try {
          // Create trigger function if it doesn't exist
          await db.$executeRawUnsafe(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
              NEW."updatedAt" = CURRENT_TIMESTAMP;
              RETURN NEW;
            END;
            $$ language 'plpgsql';
          `)
          
          // Create trigger for this table
          await db.$executeRawUnsafe(`
            DROP TRIGGER IF EXISTS update_${tableName}_updated_at ON "${tableName}";
            CREATE TRIGGER update_${tableName}_updated_at
              BEFORE UPDATE ON "${tableName}"
              FOR EACH ROW
              EXECUTE FUNCTION update_updated_at_column();
          `)
        } catch (error) {
          // Ignore trigger errors - not critical
          logger.info(`Trigger creation skipped for ${tableName}`, undefined)
        }
      }
    }
    
    return NextResponse.json({
      success: results.errors.length === 0 || results.createdTables.length > 0,
      message: 'Schema synchronization completed',
      removedColumns: results.removedColumns.length > 0 ? results.removedColumns : undefined,
      createdTables: results.createdTables.length > 0 ? results.createdTables : undefined,
      existingTables: existingTableNames,
      errors: results.errors.length > 0 ? results.errors : undefined,
      summary: `Removed ${results.removedColumns.length} columns, created ${results.createdTables.length} tables`
    })
  } catch (error) {
    logger.error('Error in complete schema sync', undefined, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json({
      success: false,
      error: 'Failed to sync schema',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

