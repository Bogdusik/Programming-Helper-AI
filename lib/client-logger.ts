/**
 * Client-side logger that works in browser environment
 * Uses console in development, but can be extended to send to logging service
 */

const isDevelopment = process.env.NODE_ENV === 'development'

export const clientLogger = {
  error: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.error(`[ERROR] ${message}`, ...args)
    }
    // In production, could send to logging service
    // For now, only log in development to avoid console noise
  },

  warn: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(`[WARN] ${message}`, ...args)
    }
  },

  info: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.info(`[INFO] ${message}`, ...args)
    }
  },

  debug: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.debug(`[DEBUG] ${message}`, ...args)
    }
  },
}

