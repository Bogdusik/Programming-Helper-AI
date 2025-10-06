'use client'

import { useEffect, useState } from 'react'

export default function EnhancedBackground() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Simplified grid pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      {/* Simple floating particles - much more performant */}
      <div className="absolute inset-0">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-green-400/20 rounded-full animate-pulse"
            style={{
              left: `${10 + (i * 12) % 80}%`,
              top: `${15 + (i * 8) % 70}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${2 + (i % 3)}s`
            }}
          />
        ))}
      </div>

      {/* Simple code symbols - static, no animation */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-1/4 text-green-400/20 text-lg font-mono">
          {'</>'}
        </div>
        <div className="absolute top-1/3 right-1/3 text-blue-400/20 text-lg font-mono">
          {'{}'}
        </div>
        <div className="absolute bottom-1/4 left-1/2 text-purple-400/20 text-lg font-mono">
          {'[]'}
        </div>
        <div className="absolute top-1/2 right-1/4 text-cyan-400/20 text-lg font-mono">
          {'()'}
        </div>
      </div>

      {/* Simple gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-blue-500/5 to-purple-500/5"></div>
    </div>
  )
}