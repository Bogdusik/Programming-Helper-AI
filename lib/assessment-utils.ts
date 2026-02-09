/**
 * Utility functions for assessment system
 */

export interface PostAssessmentEligibility {
  isEligible: boolean
  minutesSinceRegistration: number
  minMinutesRequired: number
  /** @deprecated Kept for backward compatibility; not used for eligibility */
  daysSinceRegistration: number
  questionsAsked: number
  tasksCompleted: number
  totalTimeSpent: number
  /** @deprecated Kept for backward compatibility */
  minDaysRequired: number
  /** @deprecated Kept for backward compatibility */
  minQuestionsRequired: number
  /** @deprecated Kept for backward compatibility */
  minTasksRequired: number
  progressPercentage: number
}

/** Post-assessment unlocks 30 minutes after registration (knowledge check time). */
const MIN_MINUTES_AFTER_REGISTRATION = 30

/**
 * Checks if user is eligible for post-assessment.
 * Eligibility: at least 30 minutes since registration (no days/questions/tasks required).
 */
export function checkPostAssessmentEligibility(
  registrationDate: Date,
  questionsAsked: number,
  tasksCompleted: number,
  totalTimeSpent: number
): PostAssessmentEligibility {
  const now = new Date()
  const minutesSinceRegistration = Math.floor(
    (now.getTime() - registrationDate.getTime()) / (1000 * 60)
  )
  const daysSinceRegistration = Math.floor(
    (now.getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  const isEligible = minutesSinceRegistration >= MIN_MINUTES_AFTER_REGISTRATION
  const progressPercentage = Math.min(
    100,
    Math.round((minutesSinceRegistration / MIN_MINUTES_AFTER_REGISTRATION) * 100)
  )

  return {
    isEligible,
    minutesSinceRegistration,
    minMinutesRequired: MIN_MINUTES_AFTER_REGISTRATION,
    daysSinceRegistration,
    questionsAsked,
    tasksCompleted,
    totalTimeSpent,
    minDaysRequired: 0,
    minQuestionsRequired: 0,
    minTasksRequired: 0,
    progressPercentage,
  }
}

/**
 * Gets a user-friendly message about post-assessment eligibility
 */
export function getPostAssessmentMessage(eligibility: PostAssessmentEligibility): string {
  if (eligibility.isEligible) {
    return "You're ready for post-assessment!"
  }

  const minutesLeft = eligibility.minMinutesRequired - eligibility.minutesSinceRegistration
  if (minutesLeft <= 0) {
    return "You're ready for post-assessment!"
  }
  return `Complete ${minutesLeft} more minute${minutesLeft !== 1 ? 's' : ''} after registration to unlock post-assessment`
}
