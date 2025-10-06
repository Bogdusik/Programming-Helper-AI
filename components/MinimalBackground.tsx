'use client'

import { useEffect, useState } from 'react'

export default function MinimalBackground() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Very subtle grid pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-3"></div>
      
      {/* Only 2 minimal particles */}
      <div className="absolute inset-0">
        <div
          className="absolute w-1 h-1 rounded-full"
          style={{
            left: '20%',
            top: '30%',
            background: 'rgba(34, 197, 94, 0.2)',
            boxShadow: '0 0 4px rgba(34, 197, 94, 0.1)',
            animation: 'neuralPulse 4s ease-in-out infinite'
          }}
        />
        <div
          className="absolute w-1 h-1 rounded-full"
          style={{
            left: '80%',
            top: '70%',
            background: 'rgba(59, 130, 246, 0.2)',
            boxShadow: '0 0 4px rgba(59, 130, 246, 0.1)',
            animation: 'neuralPulse 4s ease-in-out infinite',
            animationDelay: '2s'
          }}
        />
      </div>
    </div>
  )
}
