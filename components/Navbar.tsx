'use client'

import { UserButton, SignInButton, useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import Logo from './Logo'
import { trpc } from '@/lib/trpc-client'

export default function Navbar() {
  const { isSignedIn, user } = useUser()
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)
  
  // Check if user is admin by checking their role in the database
  const { data: userRole } = trpc.auth.getMyRole.useQuery(undefined, {
    enabled: isSignedIn,
    retry: false,
    refetchOnWindowFocus: false
  })
  
  // Also check Clerk publicMetadata as fallback
  const isAdmin = user?.publicMetadata?.role === 'admin' || userRole?.role === 'admin'

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'glass backdrop-blur-md border-b border-white/10' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="hover:opacity-80 transition-opacity duration-200">
              <Logo size="md" showText={true} />
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {isSignedIn && (
              <>
                <Link 
                  href="/" 
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:shadow-lg ${
                    pathname === '/' 
                      ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg shadow-green-500/25' 
                      : 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white hover:shadow-slate-500/25'
                  }`}
                >
                  Home
                </Link>
                <Link 
                  href="/chat" 
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:shadow-lg ${
                    pathname === '/chat' 
                      ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg shadow-green-500/25' 
                      : 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white hover:shadow-slate-500/25'
                  }`}
                >
                  Chat
                </Link>
                <Link 
                  href="/stats" 
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:shadow-lg ${
                    pathname === '/stats' 
                      ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg shadow-green-500/25' 
                      : 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white hover:shadow-slate-500/25'
                  }`}
                >
                  Stats
                </Link>
                {isAdmin && (
                  <Link 
                    href="/admin" 
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:shadow-lg ${
                      pathname === '/admin' 
                        ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg shadow-green-500/25' 
                        : 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white hover:shadow-slate-500/25'
                    }`}
                  >
                    Admin
                  </Link>
                )}
              </>
            )}
            
            {isSignedIn ? (
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8"
                  }
                }}
              />
            ) : (
              <SignInButton mode="modal">
                <button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25">
                  Log In
                </button>
              </SignInButton>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}