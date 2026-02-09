'use client'

import { trpc } from '../lib/trpc-client'
import { getPostAssessmentMessage } from '../lib/assessment-utils'
import Link from 'next/link'

export default function PostAssessmentProgress() {
  const { data: eligibility, isLoading } = trpc.assessment.checkPostAssessmentEligibility.useQuery()
  const { data: assessments } = trpc.assessment.getAssessments.useQuery()
  
  type SimpleAssessment = { type: string }
  const assessmentsArray = assessments as unknown as SimpleAssessment[] | undefined
  const postAssessment = assessmentsArray?.find((a) => a.type === 'post')
  
  if (postAssessment) {
    return null
  }
  
  if (isLoading || !eligibility) {
    return null
  }
  
  const progressPercentage = eligibility.progressPercentage ?? 0
  
  return (
    <div className="glass rounded-lg shadow-lg p-6 border border-blue-500/20 bg-gradient-to-br from-blue-900/20 to-purple-900/20">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">Post-Assessment Progress</h3>
          <p className="text-sm text-white/70">
            {eligibility.isEligible 
              ? "You're ready to take the post-assessment!" 
              : getPostAssessmentMessage(eligibility)}
          </p>
        </div>
        {eligibility.isEligible && (
          <Link
            href="/stats"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Take Now
          </Link>
        )}
      </div>
      
      {/* Time since registration (30 min required) */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-white">Time since registration</span>
          <span className="text-sm text-white/70">
            {eligibility.minutesSinceRegistration}/{eligibility.minMinutesRequired} min
            {eligibility.isEligible && ' ✓'}
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              eligibility.isEligible ? 'bg-green-500' : 'bg-gradient-to-r from-blue-600 to-purple-600'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <p className="text-xs text-white/60 mt-1">
          Post-assessment unlocks 30 minutes after registration.
        </p>
      </div>
      
      {eligibility.isEligible && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <Link
            href="/stats"
            className="block w-full text-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium"
          >
            Take Post-Assessment →
          </Link>
        </div>
      )}
    </div>
  )
}
