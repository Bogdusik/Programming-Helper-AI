'use client'

import { useState } from 'react'
import { trpc } from '../lib/trpc-client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'

export default function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error: unknown) => {
          // Don't retry on 401 (Unauthorized) or 403 (Forbidden) errors
          if (error && typeof error === 'object') {
            if ('data' in error) {
              const errorData = error.data as { httpStatus?: number; code?: string }
              if (errorData.httpStatus === 401 || errorData.httpStatus === 403 || errorData.code === 'UNAUTHORIZED' || errorData.code === 'FORBIDDEN') {
                return false
              }
              if (errorData.httpStatus === 404) return false
            }
            // Check for TRPCError
            if ('code' in error) {
              const trpcError = error as { code?: string }
              if (trpcError.code === 'UNAUTHORIZED' || trpcError.code === 'FORBIDDEN') {
                return false
              }
            }
          }
          return failureCount < 3
        },
        staleTime: 5 * 60 * 1000,
        // Don't refetch on window focus if user is not signed in
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: (failureCount, error: unknown) => {
          // Don't retry mutations on auth errors
          if (error && typeof error === 'object') {
            if ('data' in error) {
              const errorData = error.data as { httpStatus?: number; code?: string }
              if (errorData.httpStatus === 401 || errorData.httpStatus === 403 || errorData.code === 'UNAUTHORIZED' || errorData.code === 'FORBIDDEN') {
                return false
              }
            }
            if ('code' in error) {
              const trpcError = error as { code?: string }
              if (trpcError.code === 'UNAUTHORIZED' || trpcError.code === 'FORBIDDEN') {
                return false
              }
            }
          }
          return failureCount < 1
        },
      },
    },
  }))
  
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: '/api/trpc',
          headers() {
            return {
              'x-trpc-source': 'react',
            }
          },
        }),
      ],
    })
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  )
}
