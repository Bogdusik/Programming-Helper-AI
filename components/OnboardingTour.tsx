'use client'

import { useState, useEffect } from 'react'

interface OnboardingTourProps {
  isActive: boolean
  onComplete: () => void
  onSkip: () => void
}

interface TourStep {
  id: string
  title: string
  description: string
  target?: string // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right'
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Programming Helper AI!',
    description: 'This platform helps you learn programming with AI assistance. Let\'s take a quick tour to get you started.',
  },
  {
    id: 'chat',
    title: 'Chat Interface',
    description: 'Ask any programming question here. The AI will help you with code, debugging, algorithms, and more.',
    target: '[data-tour="chat-input"]',
    position: 'top',
  },
  {
    id: 'language',
    title: 'Language Selection',
    description: 'Select your preferred programming language to get personalized help. You can change this anytime in settings.',
    target: '[data-tour="language-selector"]',
    position: 'bottom',
  },
  {
    id: 'sessions',
    title: 'Chat History',
    description: 'All your conversations are saved here. Click on any session to continue where you left off.',
    target: '[data-tour="chat-sessions"]',
    position: 'left',
  },
  {
    id: 'stats',
    title: 'Your Progress',
    description: 'Track your learning progress, questions asked, and improvement over time.',
    target: '[data-tour="stats-link"]',
    position: 'bottom',
  },
  {
    id: 'complete',
    title: 'You\'re all set!',
    description: 'Start asking programming questions and improve your skills. Good luck on your learning journey!',
  },
]

export default function OnboardingTour({ isActive, onComplete, onSkip }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [highlightPosition, setHighlightPosition] = useState<{ top: number; left: number; width: number; height: number } | null>(null)

  useEffect(() => {
    if (!isActive) return

    const step = TOUR_STEPS[currentStep]
    if (step?.target) {
      // Use setTimeout to ensure DOM is ready
      const timer = setTimeout(() => {
        const element = document.querySelector(step.target!)
        if (element) {
          const rect = element.getBoundingClientRect()
          // Use viewport coordinates for fixed positioning
          setHighlightPosition({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          })
          // Scroll element into view smoothly
          element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
        }
      }, 100) // Small delay to ensure layout is stable

      return () => clearTimeout(timer)
    } else {
      setHighlightPosition(null)
    }
  }, [currentStep, isActive])

  if (!isActive) return null

  const step = TOUR_STEPS[currentStep]
  const isLastStep = currentStep === TOUR_STEPS.length - 1

  const handleNext = () => {
    if (isLastStep) {
      onComplete()
    } else {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Calculate tour card position
  const getTourCardPosition = () => {
    if (!highlightPosition) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }
    }

    const cardWidth = 400 // max-w-md
    const cardHeight = 200 // approximate
    const spacing = 20
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let top = '50%'
    let left = '50%'
    let transform = 'translate(-50%, -50%)'

    switch (step.position) {
      case 'bottom':
        top = `${Math.min(highlightPosition.top + highlightPosition.height + spacing, viewportHeight - cardHeight - 20)}px`
        left = `${Math.max(spacing, Math.min(highlightPosition.left, viewportWidth - cardWidth - spacing))}px`
        transform = 'translateX(0)'
        break
      case 'top':
        top = `${Math.max(spacing, highlightPosition.top - cardHeight - spacing)}px`
        left = `${Math.max(spacing, Math.min(highlightPosition.left, viewportWidth - cardWidth - spacing))}px`
        transform = 'translateX(0)'
        break
      case 'right':
        top = `${Math.max(spacing, Math.min(highlightPosition.top, viewportHeight - cardHeight - spacing))}px`
        left = `${Math.min(highlightPosition.left + highlightPosition.width + spacing, viewportWidth - cardWidth - spacing)}px`
        transform = 'translateY(0)'
        break
      case 'left':
        top = `${Math.max(spacing, Math.min(highlightPosition.top, viewportHeight - cardHeight - spacing))}px`
        left = `${Math.max(spacing, highlightPosition.left - cardWidth - spacing)}px`
        transform = 'translateY(0)'
        break
      default:
        // Center near the element
        top = `${Math.max(spacing, Math.min(highlightPosition.top + highlightPosition.height / 2 - cardHeight / 2, viewportHeight - cardHeight - spacing))}px`
        left = `${Math.max(spacing, Math.min(highlightPosition.left + highlightPosition.width / 2 - cardWidth / 2, viewportWidth - cardWidth - spacing))}px`
        transform = 'translate(-50%, -50%)'
    }

    return { top, left, transform }
  }

  const cardPosition = getTourCardPosition()

  return (
    <>
      {/* Overlay with highlight */}
      <div className="fixed inset-0 z-40 bg-black/50">
        {highlightPosition && (
          <div
            className="fixed border-4 border-blue-500 rounded-lg shadow-2xl pointer-events-none"
            style={{
              top: `${highlightPosition.top - 4}px`,
              left: `${highlightPosition.left - 4}px`,
              width: `${highlightPosition.width + 8}px`,
              height: `${highlightPosition.height + 8}px`,
              zIndex: 41,
            }}
          />
        )}
      </div>

      {/* Tour Card */}
      <div 
        className="fixed z-50 bg-white rounded-lg shadow-2xl max-w-md w-full mx-4" 
        style={{
          top: cardPosition.top,
          left: cardPosition.left,
          transform: cardPosition.transform,
        }}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
              <p className="text-sm text-gray-500 mt-1">
                Step {currentStep + 1} of {TOUR_STEPS.length}
              </p>
            </div>
            <button
              onClick={onSkip}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          <p className="text-gray-700 mb-6">{step.description}</p>

          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              {TOUR_STEPS.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentStep ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            <div className="flex space-x-3">
              {currentStep > 0 && (
                <button
                  onClick={handlePrevious}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Previous
                </button>
              )}
              <button
                onClick={onSkip}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Skip Tour
              </button>
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {isLastStep ? 'Get Started' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

