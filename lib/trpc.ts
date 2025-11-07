import { initTRPC, TRPCError } from '@trpc/server'
import { z } from 'zod'
import { db } from './db'
import { getCurrentUser } from './auth'
import { generateResponse, generateChatTitle, analyzeQuestionType } from './openai'
import { rateLimit } from './rate-limit'
import { logger } from './logger'
import { trackUserAction } from './analytics'

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

const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const { user } = ctx
  if (user.role !== 'admin') {
    throw new TRPCError({ 
      code: 'FORBIDDEN',
      message: 'Admin access required' 
    })
  }
  return next({ ctx })
})

export const appRouter = router({
  chat: router({
    // Chat Sessions
    createSession: protectedProcedure
      .input(z.object({ title: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        const { user } = ctx
        const { title = "New Chat" } = input

        const session = await db.chatSession.create({
          data: {
            userId: user.id,
            title,
          },
        })

        return session
      }),

    getSessions: protectedProcedure
      .query(async ({ ctx }) => {
        const { user } = ctx
        
        const sessions = await db.chatSession.findMany({
          where: { userId: user.id },
          orderBy: { updatedAt: 'desc' },
          include: {
            messages: {
              orderBy: { timestamp: 'asc' },
              take: 1,
            },
          },
        })

        return sessions
      }),

    deleteSession: protectedProcedure
      .input(z.object({ sessionId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const { user } = ctx
        const { sessionId } = input

        await db.chatSession.delete({
          where: {
            id: sessionId,
            userId: user.id,
          },
        })

        return { success: true }
      }),

    updateSessionTitle: protectedProcedure
      .input(z.object({ sessionId: z.string(), title: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const { user } = ctx
        const { sessionId, title } = input

        const session = await db.chatSession.update({
          where: {
            id: sessionId,
            userId: user.id,
          },
          data: { title },
        })

        return session
      }),

    // Messages
    sendMessage: protectedProcedure
      .input(z.object({ 
        message: z.string()
          .min(1, "Message cannot be empty")
          .max(2000, "Message too long (max 2000 characters)")
          .regex(/^[\s\S]*$/, "Invalid characters in message")
          .transform((msg) => msg.trim()),
        sessionId: z.string().optional()
      }))
      .mutation(async ({ input, ctx }) => {
        const { message, sessionId } = input
        const { user } = ctx

        // Rate limiting: 10 requests per minute per user
        const rateLimitResult = rateLimit(user.id, 10, 60000)
        if (!rateLimitResult.success) {
          logger.warn('Rate limit exceeded', user.id, { 
            remaining: rateLimitResult.remaining,
            resetTime: rateLimitResult.resetTime 
          })
          trackUserAction('rate_limit_exceeded', user.id)
          
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: `Rate limit exceeded. Try again in ${Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)} seconds.`
          })
        }

        let currentSessionId = sessionId

        // If no session provided, create a new one
        if (!currentSessionId) {
          // Generate smart title using AI
          const smartTitle = await generateChatTitle(message)
          
          const session = await db.chatSession.create({
            data: {
              userId: user.id,
              title: smartTitle,
            },
          })
          currentSessionId = session.id
        }

        // Get conversation history for context (last 20 messages)
        let conversationHistory: Array<{ role: 'user' | 'assistant', content: string }> = []
        
        if (currentSessionId) {
          const previousMessages = await db.message.findMany({
            where: { 
              userId: user.id,
              chatSessionId: currentSessionId 
            },
            orderBy: { timestamp: 'asc' },
            take: 20 // Last 20 messages for context
          })
          
          conversationHistory = previousMessages.map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          }))
        }

        // Analyze question type first (before creating message to cache it)
        const questionType = await analyzeQuestionType(message)

        // Create user message with cached question type
        await db.message.create({
          data: {
            userId: user.id,
            chatSessionId: currentSessionId,
            role: 'user',
            content: message,
            questionType: questionType, // Cache the question type
          },
        })

        const startTime = Date.now()
        // Generate response with conversation history for context
        const response = await generateResponse(message, conversationHistory)
        const responseTime = (Date.now() - startTime) / 1000 // Convert to seconds
        
        // Log successful message
        logger.info('Message sent successfully', user.id, { 
          messageLength: message.length,
          responseTime,
          sessionId: currentSessionId 
        })
        trackUserAction('message_sent', user.id, { 
          messageLength: message.length,
          responseTime 
        })

        // Create assistant message
        await db.message.create({
          data: {
            userId: user.id,
            chatSessionId: currentSessionId,
            role: 'assistant',
            content: response,
          },
        })

        // Update session timestamp
        await db.chatSession.update({
          where: { id: currentSessionId },
          data: { updatedAt: new Date() },
        })

        // If this is the first message in the session, update the title with more context
        const messageCount = await db.message.count({
          where: { chatSessionId: currentSessionId }
        })
        
        if (messageCount === 2) { // User message + Assistant response
          try {
            const enhancedTitle = await generateChatTitle(message)
            await db.chatSession.update({
              where: { id: currentSessionId },
              data: { title: enhancedTitle }
            })
          } catch (error) {
            console.error('Error updating session title:', error)
            // Don't fail the whole operation if title update fails
          }
        }

        // Update stats with response time and question type
        const existingStats = await db.stats.findUnique({
          where: { userId: user.id }
        })

        if (existingStats) {
          // Calculate new average response time
          const newAvgResponseTime = ((existingStats.avgResponseTime * existingStats.questionsAsked) + responseTime) / (existingStats.questionsAsked + 1)
          
          // Get all user messages with cached question types (optimized - no re-analysis needed)
          const userMessages = await db.message.findMany({
            where: { 
              userId: user.id,
              role: 'user',
              questionType: { not: null } // Only get messages with cached types
            },
            orderBy: { timestamp: 'desc' },
            take: 10, // Analyze last 10 questions
            select: {
              questionType: true
            }
          })
          
          // Count question types using cached values (much faster!)
          const typeCounts: Record<string, number> = {}
          for (const msg of userMessages) {
            if (msg.questionType) {
              typeCounts[msg.questionType] = (typeCounts[msg.questionType] || 0) + 1
            }
          }
          
          // Add current question type
          typeCounts[questionType] = (typeCounts[questionType] || 0) + 1
          
          // Find most frequent type
          const mostFrequentType = Object.entries(typeCounts)
            .sort(([,a], [,b]) => b - a)[0]?.[0] || questionType
          
          await db.stats.update({
            where: { userId: user.id },
            data: {
              questionsAsked: { increment: 1 },
              avgResponseTime: newAvgResponseTime,
              mostFrequentResponseType: mostFrequentType,
            },
          })
        } else {
          await db.stats.create({
            data: {
              userId: user.id,
              questionsAsked: 1,
              avgResponseTime: responseTime,
              mostFrequentResponseType: questionType,
            },
          })
        }

        return { response, sessionId: currentSessionId }
      }),

    getMessages: protectedProcedure
      .input(z.object({ sessionId: z.string().optional() }))
      .query(async ({ input, ctx }) => {
        const { user } = ctx
        const { sessionId } = input
        
        if (sessionId) {
          // Get messages for specific session
          const messages = await db.message.findMany({
            where: { 
              userId: user.id,
              chatSessionId: sessionId,
            },
            orderBy: { timestamp: 'asc' },
          })
          return messages
        } else {
          // Get all messages (for backward compatibility)
          const messages = await db.message.findMany({
            where: { userId: user.id },
            orderBy: { timestamp: 'asc' },
          })
          return messages
        }
      }),
  }),

  auth: router({
    getMyRole: protectedProcedure
      .query(async ({ ctx }) => {
        const { user } = ctx
        return {
          role: user.role,
          id: user.id
        }
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
          // Silently handle database connection errors for public endpoint
          // Only log a brief message in development mode
          if (process.env.NODE_ENV === 'development') {
            const errorMessage = error instanceof Error ? error.message : String(error)
            // Only log if it's a connection error (not other DB errors)
            if (errorMessage.includes('Can\'t reach database') || errorMessage.includes('connect')) {
              console.warn('⚠️  Database connection issue - stats will show 0. Make sure PostgreSQL is running and run: npm run db:push')
            } else {
              console.error('Error fetching global stats:', errorMessage)
            }
          }
          return {
            totalUsers: 0,
            activeUsers: 0,
            totalQuestions: 0,
            totalSolutions: 0
          }
        }
      }),
  }),

  admin: router({
    getDashboardStats: adminProcedure
      .query(async () => {
        try {
          const now = new Date()
          const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

          // Get user statistics
          const [totalUsers, activeUsers24h, activeUsers7d, newUsers24h, newUsers7d] = await Promise.all([
            db.user.count(),
            db.user.count({
              where: {
                messages: {
                  some: {
                    timestamp: { gte: last24Hours }
                  }
                }
              }
            }),
            db.user.count({
              where: {
                messages: {
                  some: {
                    timestamp: { gte: last7Days }
                  }
                }
              }
            }),
            db.user.count({
              where: {
                createdAt: { gte: last24Hours }
              }
            }),
            db.user.count({
              where: {
                createdAt: { gte: last7Days }
              }
            })
          ])

          // Get message statistics
          const [totalMessages, messages24h, messages7d] = await Promise.all([
            db.message.count(),
            db.message.count({
              where: {
                timestamp: { gte: last24Hours }
              }
            }),
            db.message.count({
              where: {
                timestamp: { gte: last7Days }
              }
            })
          ])

          // Get message distribution by role
          const messageStats = await db.message.groupBy({
            by: ['role'],
            _count: {
              role: true
            }
          })

          const userMessages = messageStats.find(stat => stat.role === 'user')?._count.role || 0
          const assistantMessages = messageStats.find(stat => stat.role === 'assistant')?._count.role || 0

          // Get chat sessions statistics
          const [totalSessions, sessions24h, sessions7d] = await Promise.all([
            db.chatSession.count(),
            db.chatSession.count({
              where: {
                createdAt: { gte: last24Hours }
              }
            }),
            db.chatSession.count({
              where: {
                createdAt: { gte: last7Days }
              }
            })
          ])

          // Get question type distribution
          const questionTypes = await db.stats.findMany({
            where: {
              mostFrequentResponseType: { not: null }
            },
            select: {
              mostFrequentResponseType: true
            }
          })

          const typeCounts: Record<string, number> = {}
          questionTypes.forEach(stat => {
            if (stat.mostFrequentResponseType) {
              typeCounts[stat.mostFrequentResponseType] = (typeCounts[stat.mostFrequentResponseType] || 0) + 1
            }
          })

          // Calculate average response time
          const allStats = await db.stats.findMany({
            where: {
              avgResponseTime: { gt: 0 }
            },
            select: {
              avgResponseTime: true
            }
          })

          const avgResponseTime = allStats.length > 0
            ? allStats.reduce((sum, stat) => sum + stat.avgResponseTime, 0) / allStats.length
            : 0

          return {
            users: {
              total: totalUsers,
              active24h: activeUsers24h,
              active7d: activeUsers7d,
              new24h: newUsers24h,
              new7d: newUsers7d
            },
            messages: {
              total: totalMessages,
              last24h: messages24h,
              last7d: messages7d,
              userMessages,
              assistantMessages
            },
            sessions: {
              total: totalSessions,
              last24h: sessions24h,
              last7d: sessions7d
            },
            analytics: {
              avgResponseTime: Math.round(avgResponseTime * 10) / 10, // Round to 1 decimal
              questionTypeDistribution: typeCounts
            }
          }
        } catch (error) {
          logger.error('Error fetching admin dashboard stats', undefined, { error })
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch dashboard statistics'
          })
        }
      }),

    getUsers: adminProcedure
      .input(z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        search: z.string().optional()
      }))
      .query(async ({ input }) => {
        const { page, limit, search } = input
        const skip = (page - 1) * limit

        const where = search
          ? {
              id: {
                contains: search
              }
            }
          : {}

        const [users, total] = await Promise.all([
          db.user.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
              _count: {
                select: {
                  messages: true,
                  chatSessions: true
                }
              }
            }
          }),
          db.user.count({ where })
        ])

        return {
          users,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      }),

    exportData: adminProcedure
      .input(z.object({
        format: z.enum(['json', 'markdown', 'txt']).default('json')
      }))
      .mutation(async ({ input }) => {
        const { format } = input
        
        // Get all sessions with messages
        const sessions = await db.chatSession.findMany({
          include: {
            messages: {
              orderBy: { timestamp: 'asc' }
            },
            user: {
              select: {
                id: true,
                role: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        })
        
        switch (format) {
          case 'json':
            return {
              format: 'json',
              data: JSON.stringify(sessions, null, 2),
              filename: `admin-export-${Date.now()}.json`,
              mimeType: 'application/json'
            }
            
          case 'markdown':
            let markdown = '# Admin Data Export\n\n'
            markdown += `*Generated: ${new Date().toLocaleString()}*\n\n`
            markdown += `## Summary\n\n`
            markdown += `- Total Sessions: ${sessions.length}\n`
            markdown += `- Total Messages: ${sessions.reduce((sum, s) => sum + s.messages.length, 0)}\n\n`
            markdown += `---\n\n`
            
            sessions.forEach((session, idx) => {
              markdown += `## Session ${idx + 1}: ${session.title}\n\n`
              markdown += `*Created: ${session.createdAt.toLocaleString()}*\n`
              markdown += `*User ID: ${session.userId}*\n\n`
              
              session.messages.forEach(msg => {
                markdown += `### ${msg.role === 'user' ? 'User' : 'AI Assistant'}\n`
                markdown += `${msg.content}\n\n`
                markdown += `*${msg.timestamp.toLocaleString()}*\n\n---\n\n`
              })
            })
            
            return {
              format: 'markdown',
              data: markdown,
              filename: `admin-export-${Date.now()}.md`,
              mimeType: 'text/markdown'
            }
            
          case 'txt':
            let text = 'ADMIN DATA EXPORT\n'
            text += '='.repeat(50) + '\n\n'
            text += `Generated: ${new Date().toLocaleString()}\n`
            text += `Total Sessions: ${sessions.length}\n`
            text += `Total Messages: ${sessions.reduce((sum, s) => sum + s.messages.length, 0)}\n`
            text += '='.repeat(50) + '\n\n'
            
            sessions.forEach((session, idx) => {
              text += `SESSION ${idx + 1}: ${session.title}\n`
              text += `Created: ${session.createdAt.toLocaleString()}\n`
              text += `User ID: ${session.userId}\n`
              text += '-'.repeat(50) + '\n\n'
              
              session.messages.forEach(msg => {
                text += `[${msg.role.toUpperCase()}] ${msg.timestamp.toLocaleString()}\n`
                text += `${msg.content}\n\n`
              })
              text += '\n' + '='.repeat(50) + '\n\n'
            })
            
            return {
              format: 'txt',
              data: text,
              filename: `admin-export-${Date.now()}.txt`,
              mimeType: 'text/plain'
            }
        }
      }),
  }),
})

export type AppRouter = typeof appRouter
