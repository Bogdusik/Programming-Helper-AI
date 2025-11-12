import { initTRPC, TRPCError } from '@trpc/server'
import { z } from 'zod'
import { db } from './db'
import { getCurrentUser } from './auth'
import { generateResponse, generateChatTitle, analyzeQuestionType } from './openai'
import { detectLanguage } from './prompts'
import { rateLimit } from './rate-limit'
import { logger } from './logger'
import { trackUserAction } from './analytics'
import { checkPostAssessmentEligibility } from './assessment-utils'
import { sendContactEmail } from './email'

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
        
        // Detect language from message
        const detectedLanguage = detectLanguage(message)
        
        // Get user's primary language as fallback
        const userData = await db.user.findUnique({
          where: { id: user.id },
          select: { primaryLanguage: true, preferredLanguages: true },
        })
        
        // Use detected language, or fall back to primary language, or 'general'
        const languageToUse = detectedLanguage !== 'general' 
          ? detectedLanguage 
          : (userData?.primaryLanguage || 'general')

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

        // Update LanguageProgress for the detected/used language
        if (languageToUse !== 'general') {
          await db.languageProgress.upsert({
            where: {
              userId_language: {
                userId: user.id,
                language: languageToUse,
              },
            },
            create: {
              userId: user.id,
              language: languageToUse,
              questionsAsked: 1,
              lastUsedAt: new Date(),
            },
            update: {
              questionsAsked: { increment: 1 },
              lastUsedAt: new Date(),
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

  profile: router({
    updateProfile: protectedProcedure
      .input(z.object({
        experience: z.string().optional(),
        focusAreas: z.array(z.string()).optional(),
        confidence: z.number().min(1).max(5).optional(),
        aiExperience: z.string().optional(),
        preferredLanguages: z.array(z.string()).optional(),
        primaryLanguage: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { user } = ctx
        
        // Update user profile
        const updatedUser = await db.user.update({
          where: { id: user.id },
          data: {
            selfReportedLevel: input.experience,
            learningGoals: input.focusAreas,
            initialConfidence: input.confidence,
            aiExperience: input.aiExperience,
            preferredLanguages: input.preferredLanguages,
            primaryLanguage: input.primaryLanguage,
            profileCompleted: true,
          },
        })

        // Create or update user profile
        await db.userProfile.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            experience: input.experience,
            focusAreas: input.focusAreas || [],
            confidence: input.confidence,
            aiExperience: input.aiExperience,
          },
          update: {
            experience: input.experience,
            focusAreas: input.focusAreas,
            confidence: input.confidence,
            aiExperience: input.aiExperience,
          },
        })

        // Update language progress
        if (input.preferredLanguages) {
          for (const lang of input.preferredLanguages) {
            await db.languageProgress.upsert({
              where: {
                userId_language: {
                  userId: user.id,
                  language: lang,
                },
              },
              create: {
                userId: user.id,
                language: lang,
                lastUsedAt: new Date(),
              },
              update: {
                lastUsedAt: new Date(),
              },
            })
          }
        }

        return updatedUser
      }),

    getProfile: protectedProcedure
      .query(async ({ ctx }) => {
        const { user } = ctx
        
        const profile = await db.userProfile.findUnique({
          where: { userId: user.id },
        })

        return {
          ...user,
          profile,
        }
      }),

    updateLanguages: protectedProcedure
      .input(z.object({
        preferredLanguages: z.array(z.string()),
        primaryLanguage: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { user } = ctx
        
        const updatedUser = await db.user.update({
          where: { id: user.id },
          data: {
            preferredLanguages: input.preferredLanguages,
            primaryLanguage: input.primaryLanguage,
          },
        })

        // Update language progress
        for (const lang of input.preferredLanguages) {
          await db.languageProgress.upsert({
            where: {
              userId_language: {
                userId: user.id,
                language: lang,
              },
            },
            create: {
              userId: user.id,
              language: lang,
              lastUsedAt: new Date(),
            },
            update: {
              lastUsedAt: new Date(),
            },
          })
        }

        return updatedUser
      }),

    getLanguageProgress: protectedProcedure
      .query(async ({ ctx }) => {
        const { user } = ctx
        
        const progress = await db.languageProgress.findMany({
          where: { userId: user.id },
          orderBy: { lastUsedAt: 'desc' },
        })

        return progress
      }),
  }),

  assessment: router({
    getQuestions: protectedProcedure
      .input(z.object({
        type: z.enum(['pre', 'post']),
        language: z.string().optional(),
        difficulty: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { user } = ctx
        
        // Get user's level to determine difficulty
        let difficulty = input.difficulty
        if (!difficulty) {
          const userProfile = await db.user.findUnique({
            where: { id: user.id },
            select: { selfReportedLevel: true, assessedLevel: true },
          })
          
          const level = userProfile?.assessedLevel || userProfile?.selfReportedLevel || 'beginner'
          difficulty = level === 'expert' ? 'advanced' : level === 'advanced' ? 'intermediate' : 'beginner'
        }

        const questions = await db.assessmentQuestion.findMany({
          where: {
            language: input.language || null,
            difficulty: difficulty,
            ...(input.language ? {} : { language: null }), // If no language, get general questions
          },
          take: 15, // Limit to 15 questions
          orderBy: { createdAt: 'desc' },
        })

        // If not enough questions, get more from general
        if (questions.length < 10) {
          const generalQuestions = await db.assessmentQuestion.findMany({
            where: {
              language: null,
              difficulty: difficulty,
            },
            take: 15 - questions.length,
            orderBy: { createdAt: 'desc' },
          })
          return [...questions, ...generalQuestions]
        }

        return questions
      }),

    submitAssessment: protectedProcedure
      .input(z.object({
        type: z.enum(['pre', 'post']),
        language: z.string().optional(),
        answers: z.array(z.object({
          questionId: z.string(),
          answer: z.string(),
          isCorrect: z.boolean(),
        })),
        confidence: z.number().min(1).max(5),
      }))
      .mutation(async ({ input, ctx }) => {
        const { user } = ctx
        
        const score = input.answers.filter(a => a.isCorrect).length
        const totalQuestions = input.answers.length

        // Determine assessed level based on score
        const percentage = (score / totalQuestions) * 100
        let assessedLevel = 'beginner'
        if (percentage >= 80) assessedLevel = 'advanced'
        else if (percentage >= 60) assessedLevel = 'intermediate'

        const assessment = await db.assessment.create({
          data: {
            userId: user.id,
            type: input.type,
            language: input.language,
            score,
            totalQuestions,
            confidence: input.confidence,
            answers: input.answers as any,
          },
        })

        // Update user's assessed level if it's pre-assessment
        if (input.type === 'pre') {
          await db.user.update({
            where: { id: user.id },
            data: { assessedLevel },
          })
        } else {
          // Calculate improvement score for post-assessment
          const preAssessment = await db.assessment.findFirst({
            where: {
              userId: user.id,
              type: 'pre',
            },
            orderBy: { completedAt: 'desc' },
          })

          if (preAssessment) {
            const improvement = score - (preAssessment.score || 0)
            const improvementScore = (improvement / totalQuestions) * 100

            await db.stats.update({
              where: { userId: user.id },
              data: { improvementScore },
            })
          }
        }

        return assessment
      }),

    getAssessments: protectedProcedure
      .query(async ({ ctx }) => {
        const { user } = ctx
        
        const assessments = await db.assessment.findMany({
          where: { userId: user.id },
          orderBy: { completedAt: 'desc' },
        })

        return assessments
      }),

    checkPostAssessmentEligibility: protectedProcedure
      .query(async ({ ctx }) => {
        const { user } = ctx
        
        const userData = await db.user.findUnique({
          where: { id: user.id },
          select: { createdAt: true },
        })

        if (!userData) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' })
        }

        const stats = await db.stats.findUnique({
          where: { userId: user.id },
        })

        const questionsAsked = stats?.questionsAsked || 0
        const tasksCompleted = stats?.tasksCompleted || 0
        const totalTimeSpent = stats?.totalTimeSpent || 0

        const eligibility = checkPostAssessmentEligibility(
          userData.createdAt,
          questionsAsked,
          tasksCompleted,
          totalTimeSpent
        )

        // Check if post-assessment already completed
        const postAssessment = await db.assessment.findFirst({
          where: {
            userId: user.id,
            type: 'post',
          },
        })

        return {
          ...eligibility,
          alreadyCompleted: !!postAssessment,
        }
      }),
  }),

  task: router({
    completeTask: protectedProcedure
      .input(z.object({
        taskId: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { user } = ctx
        const { taskId } = input

        // Verify task exists
        const task = await db.programmingTask.findUnique({
          where: { id: taskId },
          select: {
            id: true,
            language: true,
            title: true,
            isActive: true,
          },
        })

        if (!task) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Task not found',
          })
        }

        if (!task.isActive) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Task is not active',
          })
        }

        // Get or create task progress for this user and task
        let taskProgress = await db.userTaskProgress.findUnique({
          where: {
            userId_taskId: {
              userId: user.id,
              taskId: taskId,
            },
          },
        })

        // If no progress exists, create it
        if (!taskProgress) {
          taskProgress = await db.userTaskProgress.create({
            data: {
              userId: user.id,
              taskId: taskId,
              status: 'in_progress',
            },
          })
        }

        // Check if task is already completed
        if (taskProgress.status === 'completed') {
          return {
            success: true,
            message: 'Task already completed',
            alreadyCompleted: true,
          }
        }

        // Update task progress to completed
        await db.userTaskProgress.update({
          where: {
            userId_taskId: {
              userId: user.id,
              taskId: taskId,
            },
          },
          data: {
            status: 'completed',
            completedAt: new Date(),
          },
        })

        // Get or create stats
        const existingStats = await db.stats.findUnique({
          where: { userId: user.id },
        })

        if (existingStats) {
          // Only increment if this is the first time completing this task
          await db.stats.update({
            where: { userId: user.id },
            data: {
              tasksCompleted: { increment: 1 },
            },
          })
        } else {
          await db.stats.create({
            data: {
              userId: user.id,
              tasksCompleted: 1,
              questionsAsked: 0,
              avgResponseTime: 0,
            },
          })
        }

        // Update LanguageProgress for the task's language
        const taskLanguage = task.language.toLowerCase()
        if (taskLanguage && taskLanguage !== 'general') {
          await db.languageProgress.upsert({
            where: {
              userId_language: {
                userId: user.id,
                language: taskLanguage,
              },
            },
            create: {
              userId: user.id,
              language: taskLanguage,
              tasksCompleted: 1,
              questionsAsked: 0,
              lastUsedAt: new Date(),
            },
            update: {
              tasksCompleted: { increment: 1 },
              lastUsedAt: new Date(),
            },
          })
        }

        logger.info('Task completed', user.id, {
          taskId,
          taskTitle: task.title,
          language: taskLanguage,
        })

        trackUserAction('task_completed', user.id, {
          taskId,
          language: taskLanguage,
        })

        return {
          success: true,
          message: 'Task completed successfully',
          alreadyCompleted: false,
        }
      }),

    getTaskProgress: protectedProcedure
      .input(z.object({
        taskId: z.string().optional(),
      }))
      .query(async ({ input, ctx }) => {
        const { user } = ctx
        const { taskId } = input

        if (taskId) {
          // Get progress for specific task
          const progress = await db.userTaskProgress.findUnique({
            where: {
              userId_taskId: {
                userId: user.id,
                taskId: taskId,
              },
            },
            include: {
              task: true,
            },
          })
          return progress ? [progress] : []
        } else {
          // Get all task progress for user
          const progress = await db.userTaskProgress.findMany({
            where: { userId: user.id },
            include: {
              task: true,
            },
            orderBy: { updatedAt: 'desc' },
          })
          return progress
        }
      }),

    updateTaskProgress: protectedProcedure
      .input(z.object({
        taskId: z.string(),
        status: z.enum(['not_started', 'in_progress', 'completed']).optional(),
        attempts: z.number().optional(),
        chatSessionId: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { user } = ctx
        const { taskId, status, attempts, chatSessionId } = input

        // Upsert task progress
        const progress = await db.userTaskProgress.upsert({
          where: {
            userId_taskId: {
              userId: user.id,
              taskId: taskId,
            },
          },
          create: {
            userId: user.id,
            taskId: taskId,
            status: status || 'not_started',
            attempts: attempts || 0,
            chatSessionId: chatSessionId,
          },
          update: {
            ...(status && { status }),
            ...(attempts !== undefined && { attempts }),
            ...(chatSessionId && { chatSessionId }),
          },
        })

        return progress
      }),

    getTasks: protectedProcedure
      .input(z.object({
        language: z.string().optional(),
        difficulty: z.string().optional(),
        category: z.string().optional(),
        includeProgress: z.boolean().default(true),
      }))
      .query(async ({ input, ctx }) => {
        const { user } = ctx
        const { language, difficulty, category, includeProgress } = input

        const where: any = {
          isActive: true,
        }

        if (language) {
          where.language = language.toLowerCase()
        }
        if (difficulty) {
          where.difficulty = difficulty.toLowerCase()
        }
        if (category) {
          where.category = category.toLowerCase()
        }

        const tasks = await db.programmingTask.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          include: includeProgress
            ? {
                userProgress: {
                  where: { userId: user.id },
                  take: 1,
                },
              }
            : undefined,
        })

        return tasks
      }),

    getTask: protectedProcedure
      .input(z.object({
        taskId: z.string(),
        includeProgress: z.boolean().default(true),
      }))
      .query(async ({ input, ctx }) => {
        const { user } = ctx
        const { taskId, includeProgress } = input

        const task = await db.programmingTask.findUnique({
          where: { id: taskId },
          include: includeProgress
            ? {
                userProgress: {
                  where: { userId: user.id },
                  take: 1,
                },
              }
            : undefined,
        })

        if (!task) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Task not found',
          })
        }

        return task
      }),
  }),

  onboarding: router({
    updateOnboardingStatus: protectedProcedure
      .input(z.object({
        completed: z.boolean(),
        step: z.number().optional(),
        showTooltips: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { user } = ctx
        
        const updatedUser = await db.user.update({
          where: { id: user.id },
          data: {
            onboardingCompleted: input.completed,
            onboardingStep: input.step ?? user.onboardingStep,
            showTooltips: input.showTooltips ?? user.showTooltips,
          },
        })

        return updatedUser
      }),

    getOnboardingStatus: protectedProcedure
      .query(async ({ ctx }) => {
        const { user } = ctx
        
        return {
          onboardingCompleted: user.onboardingCompleted,
          onboardingStep: user.onboardingStep,
          showTooltips: user.showTooltips,
        }
      }),
  }),

  contact: router({
    sendMessage: publicProcedure
      .input(z.object({
        name: z.string().min(1, 'Name is required'),
        email: z.string().email('Invalid email address'),
        subject: z.string().min(1, 'Subject is required'),
        message: z.string().min(1, 'Message is required'),
      }))
      .mutation(async ({ input }) => {
        // Save to database
        const contactMessage = await db.contactMessage.create({
          data: {
            name: input.name,
            email: input.email,
            subject: input.subject,
            message: input.message,
            status: 'pending',
          },
        })

        // Send email notification
        try {
          await sendContactEmail({
            name: input.name,
            email: input.email,
            subject: input.subject,
            message: input.message,
          })
        } catch (error) {
          console.error('Error sending email notification:', error)
          // Don't fail the mutation if email fails - message is still saved
        }

        return { success: true, id: contactMessage.id }
      }),
  }),
})

export type AppRouter = typeof appRouter
