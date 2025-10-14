import { currentUser } from '@clerk/nextjs/server'
import { db } from './db'

export async function getCurrentUser() {
  const user = await currentUser()
  
  if (!user) {
    return null
  }

  let dbUser = await db.user.findUnique({
    where: { id: user.id }
  })

  if (!dbUser) {
    // For research compliance, don't store email - use anonymous ID only
    dbUser = await db.user.create({
      data: {
        id: user.id, // This is already anonymous from Clerk
        role: 'user'
      }
    })
  }

  return dbUser
}

export async function isAdmin() {
  const user = await getCurrentUser()
  return user?.role === 'admin'
}
