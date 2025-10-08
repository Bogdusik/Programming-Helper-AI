'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar'
import ChatBox from '../../components/ChatBox'
import ChatSidebar from '../../components/ChatSidebar'

export default function ChatPage() {
  const { isSignedIn, isLoaded } = useUser()
  const router = useRouter()
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/')
    }
  }, [isLoaded, isSignedIn, router])

  const handleSessionSelect = (sessionId: string) => {
    setCurrentSessionId(sessionId)
  }

  const handleNewChat = () => {
    setCurrentSessionId(undefined)
  }

  const handleSessionCreated = (sessionId: string) => {
    setCurrentSessionId(sessionId)
    // Trigger sidebar refresh
    setRefreshTrigger(prev => prev + 1)
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
          <p className="mt-4 text-white/80">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return null
  }

  return (
    <div className="min-h-screen gradient-bg">
      <Navbar />
      
      <div className="pt-20 pb-8 min-h-[calc(100vh-5rem)] flex flex-col justify-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col">
          <div className="text-center mb-0">
            <h1 className="text-4xl font-bold text-white mb-0">AI Programming Assistant</h1>
            <p className="text-white/70 text-lg">Get instant help with your coding questions</p>
          </div>
          
          <div className="flex-1 flex justify-center items-center">
            <div className="flex h-[600px] md:h-[700px] w-full max-w-6xl glass rounded-3xl shadow-2xl border border-white/10 overflow-hidden relative">
            {/* Sidebar */}
            {sidebarOpen && (
              <ChatSidebar
                currentSessionId={currentSessionId}
                onSessionSelect={handleSessionSelect}
                onNewChat={handleNewChat}
                refreshTrigger={refreshTrigger}
              />
            )}
            
            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {/* Mobile sidebar toggle */}
              <div className="lg:hidden p-4 border-b border-white/10">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
              
              <ChatBox
                key={currentSessionId || 'new-chat'}
                sessionId={currentSessionId}
                onSessionCreated={handleSessionCreated}
              />
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}