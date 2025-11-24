import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'

// Endpoint to safely add role column if it doesn't exist
// This is a workaround for db:push issues in production
export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    // Check if role column exists by trying to query it
    try {
      await db.$queryRaw`SELECT role FROM users LIMIT 1`
      return NextResponse.json({ 
        success: true,
        message: 'Role column already exists',
      })
    } catch (error: any) {
      // If column doesn't exist, add it
      if (error?.message?.includes('role') || error?.message?.includes('does not exist')) {
        logger.info('Adding role column to users table', undefined)
        
        // Add role column with default value
        await db.$executeRaw`
          ALTER TABLE users 
          ADD COLUMN IF NOT EXISTS role VARCHAR(255) DEFAULT 'user'
        `
        
        // Update existing users to have 'user' role
        await db.$executeRaw`
          UPDATE users 
          SET role = 'user' 
          WHERE role IS NULL
        `
        
        // Make role NOT NULL
        await db.$executeRaw`
          ALTER TABLE users 
          ALTER COLUMN role SET NOT NULL
        `
        
        logger.info('Role column added successfully', undefined)
        
        return NextResponse.json({ 
          success: true,
          message: 'Role column has been added successfully!',
        })
      }
      
      throw error
    }
  } catch (error) {
    logger.error('Error migrating schema', undefined, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json({ 
      error: 'Failed to migrate schema',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

