import {
  checkPostAssessmentEligibility,
  getPostAssessmentMessage,
} from '../../lib/assessment-utils'

describe('assessment-utils.ts', () => {
  describe('checkPostAssessmentEligibility', () => {
    beforeEach(() => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2024-01-15T12:30:00Z'))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('returns eligible when 30+ minutes have passed since registration', () => {
      const registrationDate = new Date('2024-01-15T12:00:00Z') // 30 min ago
      const result = checkPostAssessmentEligibility(
        registrationDate,
        0,
        0,
        0
      )

      expect(result.isEligible).toBe(true)
      expect(result.minutesSinceRegistration).toBe(30)
      expect(result.minMinutesRequired).toBe(30)
    })

    it('returns not eligible when less than 30 minutes since registration', () => {
      const registrationDate = new Date('2024-01-15T12:15:00Z') // 15 min ago
      const result = checkPostAssessmentEligibility(
        registrationDate,
        100,
        100,
        3600
      )

      expect(result.isEligible).toBe(false)
      expect(result.minutesSinceRegistration).toBe(15)
    })

    it('returns eligible when more than 30 minutes have passed', () => {
      const registrationDate = new Date('2024-01-15T11:00:00Z') // 90 min ago
      const result = checkPostAssessmentEligibility(
        registrationDate,
        0,
        0,
        0
      )

      expect(result.isEligible).toBe(true)
      expect(result.minutesSinceRegistration).toBe(90)
    })

    it('calculates progress percentage based on time only', () => {
      const registrationDate = new Date('2024-01-15T12:15:00Z') // 15 min ago = 50%
      const result = checkPostAssessmentEligibility(
        registrationDate,
        0,
        0,
        0
      )

      expect(result.progressPercentage).toBe(50)
    })

    it('caps progress at 100%', () => {
      const registrationDate = new Date('2024-01-14T12:00:00Z') // 24+ hours ago
      const result = checkPostAssessmentEligibility(
        registrationDate,
        0,
        0,
        0
      )

      expect(result.progressPercentage).toBe(100)
    })

    it('returns correct minimum minutes requirement', () => {
      const registrationDate = new Date('2024-01-15T12:00:00Z')
      const result = checkPostAssessmentEligibility(
        registrationDate,
        0,
        0,
        0
      )

      expect(result.minMinutesRequired).toBe(30)
    })
  })

  describe('getPostAssessmentMessage', () => {
    it('returns success message when eligible', () => {
      const eligibility = {
        isEligible: true,
        minutesSinceRegistration: 30,
        minMinutesRequired: 30,
        daysSinceRegistration: 0,
        questionsAsked: 0,
        tasksCompleted: 0,
        totalTimeSpent: 0,
        minDaysRequired: 0,
        minQuestionsRequired: 0,
        minTasksRequired: 0,
        progressPercentage: 100,
      }

      const message = getPostAssessmentMessage(eligibility)
      expect(message).toBe("You're ready for post-assessment!")
    })

    it('returns time message when not eligible', () => {
      const eligibility = {
        isEligible: false,
        minutesSinceRegistration: 10,
        minMinutesRequired: 30,
        daysSinceRegistration: 0,
        questionsAsked: 0,
        tasksCompleted: 0,
        totalTimeSpent: 0,
        minDaysRequired: 0,
        minQuestionsRequired: 0,
        minTasksRequired: 0,
        progressPercentage: 33,
      }

      const message = getPostAssessmentMessage(eligibility)
      expect(message).toContain('20 more minute')
      expect(message).toContain('unlock post-assessment')
    })
  })
})
