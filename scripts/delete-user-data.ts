import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { fileURLToPath } from 'url'

// ES Module compatible __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const prisma = new PrismaClient()

async function deleteUserData(userId: string) {
  console.log(`\n🔍 Looking for user: ${userId}`)
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      _count: {
        select: {
          messages: true,
          chatSessions: true,
          assessments: true,
          languageProgress: true,
          taskProgress: true,
        }
      }
    }
  })

  if (!user) {
    console.log(`❌ User with ID "${userId}" not found in database.`)
    console.log('\n💡 Note: The user might exist in Clerk but not in the local database yet.')
    console.log('   When the user logs in again through Clerk, they will go through onboarding.')
    return
  }

  console.log(`\n📊 Found user with the following data:`)
  console.log(`   - Role: ${user.role}`)
  console.log(`   - Messages: ${user._count.messages}`)
  console.log(`   - Chat Sessions: ${user._count.chatSessions}`)
  console.log(`   - Assessments: ${user._count.assessments}`)
  console.log(`   - Language Progress: ${user._count.languageProgress}`)
  console.log(`   - Task Progress: ${user._count.taskProgress}`)
  console.log(`   - Created: ${user.createdAt}`)
  console.log(`   - Onboarding Completed: ${user.onboardingCompleted}`)

  if (user.role === 'admin') {
    console.log(`\n⚠️  Cannot delete admin user!`)
    return
  }

  console.log(`\n🗑️  Deleting all user data...`)

  await prisma.$transaction(async (tx) => {
    const messages = await tx.message.deleteMany({ where: { userId } })
    console.log(`   ✓ Deleted ${messages.count} messages`)

    const chatSessions = await tx.chatSession.deleteMany({ where: { userId } })
    console.log(`   ✓ Deleted ${chatSessions.count} chat sessions`)

    const assessments = await tx.assessment.deleteMany({ where: { userId } })
    console.log(`   ✓ Deleted ${assessments.count} assessments`)

    const languageProgress = await tx.languageProgress.deleteMany({ where: { userId } })
    console.log(`   ✓ Deleted ${languageProgress.count} language progress records`)

    const taskProgress = await tx.userTaskProgress.deleteMany({ where: { userId } })
    console.log(`   ✓ Deleted ${taskProgress.count} task progress records`)

    const stats = await tx.stats.deleteMany({ where: { userId } })
    console.log(`   ✓ Deleted ${stats.count} stats records`)

    const profile = await tx.userProfile.deleteMany({ where: { userId } })
    console.log(`   ✓ Deleted ${profile.count} user profile records`)

    await tx.user.delete({ where: { id: userId } })
    console.log(`   ✓ Deleted user record`)
  })

  console.log(`\n✅ Successfully deleted all data for user: ${userId}`)
  console.log(`\n📝 When the user logs in again through Clerk, they will:`)
  console.log(`   1. Be created as a new user in the database`)
  console.log(`   2. Go through the full onboarding/personalization process`)
  console.log(`   3. Complete pre-assessment again`)
}

const userId = process.argv[2]

if (!userId) {
  console.log('Usage: npx ts-node scripts/delete-user-data.ts <userId>')
  console.log('Example: npx ts-node scripts/delete-user-data.ts user_39UaG1rbxrvnX3f8xjS5CGJ1MSo')
  process.exit(1)
}

deleteUserData(userId)
  .catch(console.error)
  .finally(() => prisma.$disconnect())
