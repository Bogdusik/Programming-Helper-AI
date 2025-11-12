'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar'
import ChatBox from '../../components/ChatBox'
import ChatSidebar from '../../components/ChatSidebar'
import OnboardingTour from '../../components/OnboardingTour'
import LanguageSelector from '../../components/LanguageSelector'
import AssessmentModal, { AssessmentQuestion } from '../../components/AssessmentModal'
import UserProfileModal, { ProfileData } from '../../components/UserProfileModal'
import { hasGivenConsent } from '../../lib/research-consent'
import { trpc } from '../../lib/trpc-client'

export default function ChatPage() {
  const { isSignedIn, isLoaded } = useUser()
  const router = useRouter()
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showPreAssessment, setShowPreAssessment] = useState(false)
  const [assessmentQuestions, setAssessmentQuestions] = useState<AssessmentQuestion[]>([])
  
  const { data: userProfile, refetch: refetchProfile } = trpc.profile.getProfile.useQuery(undefined, {
    enabled: isSignedIn,
  })
  
  const { data: onboardingStatus } = trpc.onboarding.getOnboardingStatus.useQuery(undefined, {
    enabled: isSignedIn,
  })
  
  const { data: preAssessment, refetch: refetchAssessment } = trpc.assessment.getAssessments.useQuery(undefined, {
    enabled: isSignedIn,
  })
  
  const updateOnboardingMutation = trpc.onboarding.updateOnboardingStatus.useMutation()
  const updateLanguagesMutation = trpc.profile.updateLanguages.useMutation()
  const updateProfileMutation = trpc.profile.updateProfile.useMutation()
  const getQuestionsMutation = trpc.assessment.getQuestions.useMutation()
  const submitAssessmentMutation = trpc.assessment.submitAssessment.useMutation()

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/')
    }
    
    // Check research consent
    if (isLoaded && isSignedIn && !hasGivenConsent()) {
      router.push('/')
    }
    
    // Order: Profile → Pre-Assessment → Onboarding Tour
    if (isLoaded && isSignedIn && userProfile) {
      // Step 1: Show profile modal if not completed
      if (!userProfile.profileCompleted) {
        setShowProfileModal(true)
        setShowOnboarding(false)
        setShowPreAssessment(false)
      }
      // Step 2: Show pre-assessment if profile completed but no pre-assessment
      else if (userProfile.profileCompleted && !preAssessment?.find(a => a.type === 'pre')) {
        setShowProfileModal(false)
        setShowOnboarding(false)
        // Only load questions if not already loading and not already shown
        if (!showPreAssessment && assessmentQuestions.length === 0) {
          loadPreAssessmentQuestions()
        }
      }
      // Step 3: Show onboarding tour if profile and pre-assessment are done, but tour not completed
      else if (userProfile.profileCompleted && preAssessment?.find(a => a.type === 'pre') && onboardingStatus) {
        setShowProfileModal(false)
        setShowPreAssessment(false)
        if (!onboardingStatus.onboardingCompleted) {
          setShowOnboarding(true)
        } else {
          // All steps completed - hide all modals
          setShowOnboarding(false)
          setShowProfileModal(false)
          setShowPreAssessment(false)
        }
      } else {
        // All steps completed - hide all modals (fallback)
        setShowProfileModal(false)
        setShowPreAssessment(false)
        setShowOnboarding(false)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, router, onboardingStatus, userProfile, preAssessment, showPreAssessment, assessmentQuestions.length])

  const loadPreAssessmentQuestions = async () => {
    try {
      const questions = await getQuestionsMutation.mutateAsync({
        type: 'pre',
        language: userProfile?.primaryLanguage || undefined,
      })
      setAssessmentQuestions(questions as AssessmentQuestion[])
      // Show pre-assessment modal after questions are loaded
      if (questions && questions.length > 0) {
        setShowPreAssessment(true)
      }
    } catch (error) {
      console.error('Error loading assessment questions:', error)
    }
  }

  const handleProfileComplete = async (data: ProfileData) => {
    try {
      await updateProfileMutation.mutateAsync({
        experience: data.experience,
        focusAreas: data.focusAreas,
        confidence: data.confidence,
        aiExperience: data.aiExperience,
        preferredLanguages: data.preferredLanguages,
        primaryLanguage: data.primaryLanguage,
      })
      setShowProfileModal(false)
      // Refetch profile to get updated data
      await refetchProfile()
      // Pre-assessment will be shown automatically via useEffect
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }

  const handleAssessmentSubmit = async (answers: any[], confidence: number) => {
    try {
      await submitAssessmentMutation.mutateAsync({
        type: 'pre',
        language: userProfile?.primaryLanguage || undefined,
        answers: answers.map(a => ({
          questionId: a.questionId,
          answer: a.answer,
          isCorrect: a.isCorrect,
        })),
        confidence,
      })
      setShowPreAssessment(false)
      // Refetch assessment to get updated data
      await refetchAssessment()
      // Onboarding tour will be shown automatically via useEffect
    } catch (error) {
      console.error('Error submitting assessment:', error)
    }
  }

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false)
    await updateOnboardingMutation.mutateAsync({
      completed: true,
    })
  }

  const handleOnboardingSkip = async () => {
    setShowOnboarding(false)
    await updateOnboardingMutation.mutateAsync({
      completed: true,
    })
  }

  const handleLanguagesChange = async (languages: string[], primary?: string) => {
    try {
      await updateLanguagesMutation.mutateAsync({
        preferredLanguages: languages,
        primaryLanguage: primary,
      })
      // Refetch profile to update UI immediately
      await refetchProfile()
    } catch (error) {
      console.error('Error updating languages:', error)
    }
  }

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
      
      {/* User Profile Modal - Step 1 */}
      {showProfileModal && (
        <UserProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onComplete={handleProfileComplete}
          isOptional={false}
        />
      )}

      {/* Pre-Assessment Modal - Step 2 */}
      {showPreAssessment && assessmentQuestions.length > 0 && (
        <AssessmentModal
          isOpen={showPreAssessment}
          onClose={() => setShowPreAssessment(false)}
          onSubmit={handleAssessmentSubmit}
          type="pre"
          questions={assessmentQuestions}
          language={userProfile?.primaryLanguage}
        />
      )}

      {/* Onboarding Tour - Step 3 */}
      {showOnboarding && !showProfileModal && !showPreAssessment && (
        <OnboardingTour
          isActive={showOnboarding}
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}
      
      <div className="pt-20 pb-8 min-h-[calc(100vh-5rem)] flex flex-col justify-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col">
          <div className="text-center mb-4">
            <h1 className="text-4xl font-bold text-white mb-2">AI Programming Assistant</h1>
            <p className="text-white/70 text-lg mb-4">Get instant help with your coding questions</p>
            {/* Language Selector */}
            {userProfile && (
              <div className="flex justify-center mb-4" data-tour="language-selector">
                <LanguageSelector
                  selectedLanguages={userProfile.preferredLanguages || []}
                  primaryLanguage={userProfile.primaryLanguage || undefined}
                  onLanguagesChange={handleLanguagesChange}
                  compact={true}
                />
              </div>
            )}
          </div>
          
          <div className="flex-1 flex justify-center items-center">
            <div className="flex h-[600px] md:h-[700px] w-full max-w-6xl glass rounded-3xl shadow-2xl border border-white/10 overflow-hidden relative">
            {/* Sidebar */}
            {sidebarOpen && (
              <div data-tour="chat-sessions">
                <ChatSidebar
                  currentSessionId={currentSessionId}
                  onSessionSelect={handleSessionSelect}
                  onNewChat={handleNewChat}
                  refreshTrigger={refreshTrigger}
                />
              </div>
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