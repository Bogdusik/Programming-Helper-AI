import { useUser } from '@clerk/nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { clientLogger } from '../lib/client-logger'

/**
 * Hook to check if user was registered through sign-up
 * Redirects to sign-up if user is not registered
 * Creates user in database if they came from sign-up
 */
export function useUserRegistrationCheck() {
  const { isSignedIn, isLoaded, user } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isCheckingUserExists, setIsCheckingUserExists] = useState(false)
  const [hasCheckedUserExists, setHasCheckedUserExists] = useState(false)

  useEffect(() => {
    const checkUserRegistration = async () => {
      // Only check once, and only if user is loaded and signed in
      if (!isLoaded || !isSignedIn || !user?.id || hasCheckedUserExists || isCheckingUserExists) {
        return
      }

      setIsCheckingUserExists(true)
      setHasCheckedUserExists(true)

      try {
        // Check if user came from sign-up page
        const fromSignUp = searchParams.get('fromSignUp') === 'true'

        // If user came from sign-up, create them in database
        if (fromSignUp) {
          try {
            await fetch('/api/create-user')
            // Remove the parameter from URL
            const newUrl = new URL(window.location.href)
            newUrl.searchParams.delete('fromSignUp')
            router.replace(newUrl.pathname + newUrl.search)
          } catch (error) {
            clientLogger.error('Error creating user after sign-up:', error)
          }
          setIsCheckingUserExists(false)
          return
        }

        // Check if user exists in database
        const response = await fetch('/api/check-user-exists')
        const data = await response.json()

        // If user doesn't exist in database, they haven't registered through sign-up
        // Redirect them to sign-up page
        if (!data.exists) {
          router.replace('/sign-up?message=Please register first to use this application')
          setIsCheckingUserExists(false)
          return
        }
      } catch (error) {
        clientLogger.error('Error checking user existence:', error)
        // On error, allow access to prevent blocking legitimate users
      } finally {
        setIsCheckingUserExists(false)
      }
    }

    checkUserRegistration()
    // Note: router, searchParams, hasCheckedUserExists, isCheckingUserExists are intentionally excluded
    // to prevent infinite loops and ensure the check runs only once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, user?.id])

  return { isCheckingUserExists, hasCheckedUserExists }
}

