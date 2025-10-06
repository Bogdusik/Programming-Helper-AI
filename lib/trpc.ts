import { initTRPC, TRPCError } from '@trpc/server'
import { z } from 'zod'
import { db } from './db'
import { getCurrentUser } from './auth'
import { generateResponse } from './openai'

const t = initTRPC.create()

export const router = t.router
export const publicProcedure = t.procedure

const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  const user = await getCurrentUser()
  if (!user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      ...ctx,
      user,
    },
  })
})

export const appRouter = router({
  chat: router({
    sendMessage: protectedProcedure
      .input(z.object({ message: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        const { message } = input
        const { user } = ctx

        await db.message.create({
          data: {
            userId: user.id,
            role: 'user',
            content: message,
          },
        })

        const response = await generateResponse(message)

        await db.message.create({
          data: {
            userId: user.id,
            role: 'assistant',
            content: response,
          },
        })

        await db.stats.upsert({
          where: { userId: user.id },
          update: {
            questionsAsked: { increment: 1 },
          },
          create: {
            userId: user.id,
            questionsAsked: 1,
          },
        })

        return { response }
      }),

    getMessages: protectedProcedure
      .query(async ({ ctx }) => {
        const { user } = ctx
        
        const messages = await db.message.findMany({
          where: { userId: user.id },
          orderBy: { timestamp: 'asc' },
        })

        return messages
      }),
  }),

  stats: router({
    getUserStats: protectedProcedure
      .query(async ({ ctx }) => {
        const { user } = ctx
        
        const stats = await db.stats.findUnique({
          where: { userId: user.id },
        })

        return stats
      }),

    getGlobalStats: publicProcedure
      .query(async () => {
        try {
          // Optimized: Single query with aggregation
          const [userStats, messageStats] = await Promise.all([
            db.user.count(),
            db.message.groupBy({
              by: ['role'],
              _count: {
                role: true
              }
            })
          ])

          const activeUsers = await db.user.count({
            where: {
              messages: {
                some: {
                  role: 'user'
                }
              }
            }
          })

          const userMessages = messageStats.find(stat => stat.role === 'user')?._count.role || 0
          const assistantMessages = messageStats.find(stat => stat.role === 'assistant')?._count.role || 0

          return {
            totalUsers: userStats,
            activeUsers,
            totalQuestions: userMessages,
            totalSolutions: assistantMessages
          }
        } catch (error) {
          console.error('Error fetching global stats:', error)
          return {
            totalUsers: 0,
            activeUsers: 0,
            totalQuestions: 0,
            totalSolutions: 0
          }
        }
      }),
  }),
})

export type AppRouter = typeof appRouter
