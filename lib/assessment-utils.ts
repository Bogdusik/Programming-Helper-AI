/**
 * Utility functions for assessment system
 */

export interface PostAssessmentEligibility {
  isEligible: boolean
  daysSinceRegistration: number
  questionsAsked: number
  tasksCompleted: number
  totalTimeSpent: number // in seconds
  minDaysRequired: number
  minQuestionsRequired: number
  minTasksRequired: number
  progressPercentage: number
}

const MIN_DAYS_REQUIRED = 14
const MIN_QUESTIONS_REQUIRED = 20
const MIN_TASKS_REQUIRED = 5

/**
 * Checks if user is eligible for post-assessment
 */
export function checkPostAssessmentEligibility(
  registrationDate: Date,
  questionsAsked: number,
  tasksCompleted: number,
  totalTimeSpent: number
): PostAssessmentEligibility {
  const now = new Date()
  const daysSinceRegistration = Math.floor(
    (now.getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  const daysProgress = Math.min((daysSinceRegistration / MIN_DAYS_REQUIRED) * 100, 100)
  const questionsProgress = Math.min((questionsAsked / MIN_QUESTIONS_REQUIRED) * 100, 100)
  const tasksProgress = Math.min((tasksCompleted / MIN_TASKS_REQUIRED) * 100, 100)

  // Average progress across all requirements
  const progressPercentage = (daysProgress + questionsProgress + tasksProgress) / 3

  const isEligible =
    daysSinceRegistration >= MIN_DAYS_REQUIRED &&
    questionsAsked >= MIN_QUESTIONS_REQUIRED &&
    tasksCompleted >= MIN_TASKS_REQUIRED

  return {
    isEligible,
    daysSinceRegistration,
    questionsAsked,
    tasksCompleted,
    totalTimeSpent,
    minDaysRequired: MIN_DAYS_REQUIRED,
    minQuestionsRequired: MIN_QUESTIONS_REQUIRED,
    minTasksRequired: MIN_TASKS_REQUIRED,
    progressPercentage: Math.round(progressPercentage),
  }
}

/**
 * Gets a user-friendly message about post-assessment eligibility
 */
export function getPostAssessmentMessage(eligibility: PostAssessmentEligibility): string {
  if (eligibility.isEligible) {
    return "You're ready for post-assessment!"
  }

  const missing: string[] = []
  
  if (eligibility.daysSinceRegistration < eligibility.minDaysRequired) {
    const daysLeft = eligibility.minDaysRequired - eligibility.daysSinceRegistration
    missing.push(`${daysLeft} more day${daysLeft > 1 ? 's' : ''}`)
  }
  
  if (eligibility.questionsAsked < eligibility.minQuestionsRequired) {
    const questionsLeft = eligibility.minQuestionsRequired - eligibility.questionsAsked
    missing.push(`${questionsLeft} more question${questionsLeft > 1 ? 's' : ''}`)
  }
  
  if (eligibility.tasksCompleted < eligibility.minTasksRequired) {
    const tasksLeft = eligibility.minTasksRequired - eligibility.tasksCompleted
    missing.push(`${tasksLeft} more task${tasksLeft > 1 ? 's' : ''}`)
  }

  return `Complete ${missing.join(', ')} to unlock post-assessment`
}

