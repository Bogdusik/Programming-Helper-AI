/**
 * Centralized error handling utility
 * Provides consistent error handling across the application
 */

import { logger } from './logger'
import { TRPCError } from '@trpc/server'

export interface ErrorContext {
  userId?: string
  sessionId?: string
  taskId?: string
  [key: string]: unknown
}

/**
 * Handle and log errors consistently
 */
export function handleError(
  error: unknown,
  context?: ErrorContext,
  userMessage?: string
): string {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorStack = error instanceof Error ? error.stack : undefined

  // Log error
  logger.error(
    userMessage || 'An error occurred',
    context?.userId,
    {
      ...context,
      error: errorMessage,
      stack: errorStack,
    }
  )

  // Return user-friendly message
  if (error instanceof TRPCError) {
    return error.message
  }

  if (error instanceof Error) {
    // Don't expose internal error messages to users
    if (process.env.NODE_ENV === 'production') {
      return userMessage || 'An unexpected error occurred. Please try again.'
    }
    return error.message
  }

  return userMessage || 'An unexpected error occurred. Please try again.'
}

/**
 * Check if error is a tRPC error with specific code
 */
export function isTRPCError(
  error: unknown,
  code?: string
): error is TRPCError {
  if (!(error instanceof TRPCError)) return false
  if (code) return error.code === code
  return true
}

/**
 * Check if error is a network/connection error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('network') ||
      error.message.includes('fetch') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('timeout')
    )
  }
  return false
}

/**
 * Check if error is a "Not Found" error from Clerk
 */
export function isClerkNotFoundError(error: unknown): boolean {
  if (error && typeof error === 'object') {
    const errorWithCause = error as { cause?: unknown; data?: { httpStatus?: number }; code?: string; message?: string }
    const cause = errorWithCause.cause
    const httpStatus = errorWithCause.data?.httpStatus
    const code = errorWithCause.code
    const message = errorWithCause.message

    if (httpStatus === 404) return true
    if (code === 'INTERNAL_SERVER_ERROR' && message === 'Not Found') return true
    if (cause && typeof cause === 'object' && 'clerkError' in cause) {
      const clerkCause = cause as { clerkError?: boolean; status?: number; errors?: Array<{ code?: string }> }
      if (clerkCause.clerkError && clerkCause.status === 404) return true
      if (clerkCause.errors?.some(e => e.code === 'resource_not_found')) return true
    }
  }
  return false
}

/**
 * Get user-friendly error message from tRPC error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof TRPCError) {
    return error.message
  }

  if (error && typeof error === 'object') {
    const trpcError = error as {
      data?: { code?: string; httpStatus?: number }
      message?: string
      shape?: { message?: string; data?: { code?: string } }
    }

    if (trpcError.data?.code === 'PRECONDITION_FAILED') {
      return trpcError.message || 'Please complete onboarding before sending messages.'
    }

    if (trpcError.message) {
      return trpcError.message
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'An unexpected error occurred. Please try again.'
}

/**
 * Check if error requires page refresh (e.g., onboarding not complete)
 */
export function requiresRefresh(error: unknown): boolean {
  if (!(error instanceof Error)) return false

  const message = error.message.toLowerCase()
  return (
    message.includes('complete your profile') ||
    message.includes('complete the knowledge assessment') ||
    message.includes('onboarding') ||
    message.includes('precondition failed')
  )
}

