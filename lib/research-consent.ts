// Research consent management
export interface ResearchConsent {
  hasConsented: boolean
  consentDate: Date
  participantId: string // Anonymous ID
}

export function getConsentFromStorage(): ResearchConsent | null {
  if (typeof window === 'undefined') return null
  
  try {
    const stored = localStorage.getItem('research-consent')
    if (!stored) return null
    
    const consent = JSON.parse(stored)
    return {
      ...consent,
      consentDate: new Date(consent.consentDate)
    }
  } catch {
    return null
  }
}

export function saveConsentToStorage(consent: boolean): ResearchConsent {
  const participantId = `participant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  const consentData: ResearchConsent = {
    hasConsented: consent,
    consentDate: new Date(),
    participantId
  }
  
  if (typeof window !== 'undefined') {
    localStorage.setItem('research-consent', JSON.stringify(consentData))
  }
  
  return consentData
}

export function clearConsentFromStorage(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('research-consent')
  }
}

export function hasGivenConsent(): boolean {
  const consent = getConsentFromStorage()
  return consent?.hasConsented ?? false
}
