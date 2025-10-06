'use client'

import { useState, useEffect, memo } from 'react'

interface AnimatedCounterProps {
  value: number
  duration?: number
  className?: string
}

const AnimatedCounter = memo(function AnimatedCounter({ value, duration = 2000, className = '' }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let startTime: number
    let animationFrame: number

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      
      const easeOutCubic = 1 - Math.pow(1 - progress, 3)
      const currentValue = Math.floor(value * easeOutCubic)
      
      setDisplayValue(currentValue)
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [value, duration])

  return (
    <span className={className}>
      {displayValue.toLocaleString()}
    </span>
  )
})

export default AnimatedCounter
