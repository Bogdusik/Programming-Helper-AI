import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const adminUser = await prisma.user.upsert({
    where: { id: 'admin-user-id' },
    update: {},
    create: {
      id: 'admin-user-id',
      role: 'admin',
    },
  })

  const regularUser = await prisma.user.upsert({
    where: { id: 'user-id' },
    update: {},
    create: {
      id: 'user-id',
      role: 'user',
    },
  })

  await prisma.stats.upsert({
    where: { userId: regularUser.id },
    update: {},
    create: {
      userId: regularUser.id,
      questionsAsked: 5,
      avgResponseTime: 2.5,
      mostFrequentResponseType: 'code',
    },
  })

  console.log('Seed data created successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
