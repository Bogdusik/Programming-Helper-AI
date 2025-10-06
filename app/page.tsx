'use client'

import { SignInButton, useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'
import Navbar from '../components/Navbar'
import AnimatedCounter from '../components/AnimatedCounter'
import SimpleBackground from '../components/SimpleBackground'
import ViteStyleCard from '../components/ViteStyleCard'
import { trpc } from '../lib/trpc-client'

export default function Home() {
  const { isSignedIn, isLoaded } = useUser()
  const [isMounted, setIsMounted] = useState(false)
  
  const { data: globalStats, isLoading: statsLoading, dataUpdatedAt, error: statsError } = trpc.stats.getGlobalStats.useQuery(undefined, {
    refetchInterval: 60000, // Increased to 1 minute for better performance
    refetchOnWindowFocus: false, // Disabled to reduce unnecessary requests
    retry: 1, // Reduced retries
    retryDelay: 2000,
    staleTime: 30000, // Cache for 30 seconds
  })

  const getLastUpdateTime = useMemo(() => {
    if (!dataUpdatedAt) return ''
    const now = new Date()
    const diff = Math.floor((now.getTime() - dataUpdatedAt) / 1000)
    
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    return `${Math.floor(diff / 3600)}h ago`
  }, [dataUpdatedAt])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden">
      <Navbar />
      
      {/* Optimized simple background */}
      <SimpleBackground />
      
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-fadeInUp">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-6">
              The AI Assistant
              <br />
              <span className="gradient-text">for Programming</span>
            </h1>
            <p className="text-xl text-white/80 max-w-3xl mx-auto mb-8 leading-relaxed">
              Get instant help with your programming questions. Our AI assistant guides you through code challenges, explains concepts and helps you debug issues.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {!isLoaded ? (
                <div className="animate-pulse-slow bg-white/20 h-14 w-64 rounded-full"></div>
              ) : isSignedIn ? (
                <Link 
                  href="/chat"
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all duration-200 hover:shadow-xl hover:shadow-green-500/25 hover:scale-105"
                >
                  Start Chatting
                </Link>
              ) : (
                <SignInButton mode="modal">
                  <button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all duration-200 hover:shadow-xl hover:shadow-green-500/25 hover:scale-105">
                    Get Started
                  </button>
                </SignInButton>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-16">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Our Impact in Numbers</h2>
            <p className="text-white/60">Growing community of developers</p>
            {!statsLoading && globalStats && !statsError && (
              <div className="flex items-center justify-center space-x-2 mt-4">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-white/60">
                  Live data • Updated {getLastUpdateTime} • Refreshes every 30s
                </span>
              </div>
            )}
            {statsError && (
              <div className="flex items-center justify-center space-x-2 mt-4">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-sm text-white/60">
                  Using cached data • Some stats may be outdated
                </span>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center glass rounded-2xl p-8 card-hover">
              <div className="text-4xl font-bold gradient-text mb-2">
                {statsLoading ? (
                  <div className="animate-pulse-slow bg-white/20 h-12 w-24 rounded mx-auto"></div>
                ) : statsError ? (
                  <span className="text-4xl font-bold gradient-text">0+</span>
                ) : (
                  <>
                    <AnimatedCounter 
                      value={globalStats?.activeUsers || 0} 
                      className="text-4xl font-bold gradient-text"
                    />
                    <span className="text-4xl font-bold gradient-text">+</span>
                  </>
                )}
              </div>
              <div className="text-white/60">Active Users</div>
            </div>
            <div className="text-center glass rounded-2xl p-8 card-hover">
              <div className="text-4xl font-bold gradient-text mb-2">
                {statsLoading ? (
                  <div className="animate-pulse-slow bg-white/20 h-12 w-24 rounded mx-auto"></div>
                ) : statsError ? (
                  <span className="text-4xl font-bold gradient-text">0+</span>
                ) : (
                  <>
                    <AnimatedCounter 
                      value={globalStats?.totalQuestions || 0} 
                      className="text-4xl font-bold gradient-text"
                    />
                    <span className="text-4xl font-bold gradient-text">+</span>
                  </>
                )}
              </div>
              <div className="text-white/60">Questions Asked</div>
            </div>
            <div className="text-center glass rounded-2xl p-8 card-hover">
              <div className="text-4xl font-bold gradient-text mb-2">
                {statsLoading ? (
                  <div className="animate-pulse-slow bg-white/20 h-12 w-24 rounded mx-auto"></div>
                ) : statsError ? (
                  <span className="text-4xl font-bold gradient-text">0+</span>
                ) : (
                  <>
                    <AnimatedCounter 
                      value={globalStats?.totalSolutions || 0} 
                      className="text-4xl font-bold gradient-text"
                    />
                    <span className="text-4xl font-bold gradient-text">+</span>
                  </>
                )}
              </div>
              <div className="text-white/60">Solutions Provided</div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-16">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">Redefining programming experience</h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">Programming Helper AI makes coding assistance simple again</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <ViteStyleCard
              title="Instant AI Response"
              description="On demand AI assistance, no waiting required! Get instant help with your programming questions."
              icon={
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
              gradient="bg-gradient-to-r from-green-500 to-green-600"
              features={["Real-time responses", "No waiting time", "Instant feedback"]}
            />

            <ViteStyleCard
              title="Smart Code Analysis"
              description="AI-powered code review that stays accurate regardless of complexity. Advanced analysis for any programming language."
              icon={
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              }
              gradient="bg-gradient-to-r from-blue-500 to-blue-600"
              codeExample="ai.analyze(code) // Returns detailed analysis"
              features={["Deep code analysis", "Bug detection", "Performance insights"]}
            />

            <ViteStyleCard
              title="Multi-Language Support"
              description="Out-of-the-box support for JavaScript, Python, Java, C++ and more. Universal programming assistance."
              icon={
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              }
              gradient="bg-gradient-to-r from-purple-500 to-purple-600"
              features={["JavaScript", "Python", "Java", "C++", "TypeScript"]}
            />

            <ViteStyleCard
              title="Optimized Solutions"
              description="Pre-configured AI responses with best practices and performance optimization. Get production-ready code."
              icon={
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              gradient="bg-gradient-to-r from-cyan-500 to-cyan-600"
              codeExample="ai.optimize(solution) // Returns optimized code"
              features={["Best practices", "Performance tips", "Clean code patterns"]}
            />
          </div>
        </div>
      </section>

      {/* A shared foundation to build upon */}
      <section className="relative py-20">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">A shared foundation to build upon</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ViteStyleCard
              title="Flexible AI System"
              description="Our AI extends with well-designed interfaces and a few extra programming-specific options. Built for extensibility."
              icon={
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
              gradient="bg-gradient-to-r from-green-500 to-green-600"
              codeExample="const ai = createAssistant({ // user config options })"
              features={["Extensible architecture", "Plugin system", "Custom configurations"]}
            />

            <ViteStyleCard
              title="Fully Typed API"
              description="Designed to be built on top of. TypeScript support with full type safety and intelligent autocomplete."
              icon={
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              }
              gradient="bg-gradient-to-r from-blue-500 to-blue-600"
              codeExample="interface AIResponse { code: string; explanation: string }"
              features={["TypeScript support", "IntelliSense", "Type safety"]}
            />

            <ViteStyleCard
              title="First class Learning Support"
              description="It's never been easier to learn programming concepts, or build your own coding skills with guided assistance."
              icon={
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              }
              gradient="bg-gradient-to-r from-purple-500 to-purple-600"
              features={["Step-by-step guidance", "Concept explanations", "Best practices"]}
            />
          </div>
        </div>
      </section>

      {/* Loved by the community */}
      <section className="relative py-20">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">Loved by the community</h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">Don't take our word for it - listen to what our users have to say.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="glass rounded-2xl p-8 card-hover">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  RC
                </div>
                <div className="ml-4">
                  <h4 className="text-white font-semibold">Ryan Carniato</h4>
                  <p className="text-white/60 text-sm">@RyanCarniato</p>
                </div>
              </div>
              <p className="text-white/80 italic">
                "I'm loving what Programming Helper AI enables. We've found building with it that it is less a tool but a system of symbiotic AI assistance. While built with programming in mind, it should scale from our simplest questions to complex debugging."
              </p>
            </div>

            <div className="glass rounded-2xl p-8 card-hover">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  RH
                </div>
                <div className="ml-4">
                  <h4 className="text-white font-semibold">Rich Harris</h4>
                  <p className="text-white/60 text-sm">@Rich_Harris</p>
                </div>
              </div>
              <p className="text-white/80 italic">
                "Programming Helper AI is basically the united nations of programming assistance at this point. I'll be there as a representative of JavaScript developers."
              </p>
            </div>

            <div className="glass rounded-2xl p-8 card-hover">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  DE
                </div>
                <div className="ml-4">
                  <h4 className="text-white font-semibold">David East</h4>
                  <p className="text-white/60 text-sm">@_davideast</p>
                </div>
              </div>
              <p className="text-white/80 italic">
                "Each and every time I use Programming Helper AI, I feel a true sense of pure and unbridled joy."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16">
        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="glass rounded-3xl p-12">
            <h2 className="text-3xl font-bold text-white mb-6">Ready to Level Up Your Coding?</h2>
            <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of developers who are already using our AI assistant to solve problems faster and learn more effectively.
            </p>
            {!isLoaded ? (
              <div className="animate-pulse-slow bg-white/20 h-14 w-64 rounded-full mx-auto"></div>
            ) : isSignedIn ? (
              <Link 
                href="/chat"
                className="inline-block bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all duration-200 hover:shadow-xl hover:shadow-green-500/25 hover:scale-105"
              >
                Start Chatting Now
              </Link>
            ) : (
              <SignInButton mode="modal">
                <button className="inline-block bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all duration-200 hover:shadow-xl hover:shadow-green-500/25 hover:scale-105">
                  Get Started Free
                </button>
              </SignInButton>
            )}
          </div>
        </div>
      </section>

      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-green-500 to-transparent animate-pulse"></div>
    </div>
  )
}