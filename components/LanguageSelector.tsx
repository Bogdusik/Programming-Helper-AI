'use client'

import { useState, useEffect } from 'react'

interface LanguageSelectorProps {
  selectedLanguages: string[]
  primaryLanguage?: string
  onLanguagesChange: (languages: string[], primary?: string) => void
  compact?: boolean
}

const PROGRAMMING_LANGUAGES = [
  { value: 'python', label: 'Python', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'javascript', label: 'JavaScript', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'java', label: 'Java', color: 'bg-orange-100 text-orange-800' },
  { value: 'typescript', label: 'TypeScript', color: 'bg-blue-100 text-blue-800' },
  { value: 'cpp', label: 'C++', color: 'bg-blue-100 text-blue-800' },
  { value: 'csharp', label: 'C#', color: 'bg-purple-100 text-purple-800' },
  { value: 'rust', label: 'Rust', color: 'bg-orange-100 text-orange-800' },
  { value: 'go', label: 'Go', color: 'bg-cyan-100 text-cyan-800' },
  { value: 'sql', label: 'SQL', color: 'bg-gray-100 text-gray-800' },
]

export default function LanguageSelector({
  selectedLanguages,
  primaryLanguage,
  onLanguagesChange,
  compact = false
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localPrimaryLanguage, setLocalPrimaryLanguage] = useState(primaryLanguage)
  
  // Update local state when prop changes
  useEffect(() => {
    setLocalPrimaryLanguage(primaryLanguage)
  }, [primaryLanguage])

  const toggleLanguage = (lang: string) => {
    const newLanguages = selectedLanguages.includes(lang)
      ? selectedLanguages.filter(l => l !== lang)
      : [...selectedLanguages, lang]
    
    // If primary language was removed, clear it or set first remaining
    let newPrimary = primaryLanguage
    if (primaryLanguage === lang && newLanguages.length > 0) {
      newPrimary = newLanguages[0]
    } else if (primaryLanguage === lang) {
      newPrimary = undefined
    } else if (newLanguages.length === 1 && !primaryLanguage) {
      // Auto-set primary if only one language selected
      newPrimary = newLanguages[0]
    }
    
    // Update local state optimistically
    setLocalPrimaryLanguage(newPrimary)
    onLanguagesChange(newLanguages, newPrimary)
  }

  const setPrimary = (lang: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    // Optimistically update local state for immediate UI feedback
    setLocalPrimaryLanguage(lang)
    onLanguagesChange(selectedLanguages, lang)
  }

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <span className="text-sm font-medium text-gray-700">
            {(localPrimaryLanguage || primaryLanguage)
              ? PROGRAMMING_LANGUAGES.find(l => l.value === (localPrimaryLanguage || primaryLanguage))?.label || 'Select Language'
              : selectedLanguages.length > 0
              ? `${selectedLanguages.length} selected`
              : 'Select Language'}
          </span>
          <span className="text-gray-400">▼</span>
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div 
              className="absolute top-full mt-2 left-0 z-20 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[200px]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-2">
                {PROGRAMMING_LANGUAGES.map(lang => (
                  <div
                    key={lang.value}
                    className="flex items-center justify-between space-x-3"
                  >
                    <label className="flex items-center space-x-2 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={selectedLanguages.includes(lang.value)}
                        onChange={() => toggleLanguage(lang.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">{lang.label}</span>
                    </label>
                    {selectedLanguages.includes(lang.value) && selectedLanguages.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => setPrimary(lang.value, e)}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          (localPrimaryLanguage || primaryLanguage) === lang.value
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {(localPrimaryLanguage || primaryLanguage) === lang.value ? 'Primary' : 'Set'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Programming Languages
      </label>
      <div className="flex flex-wrap gap-2">
        {PROGRAMMING_LANGUAGES.map(lang => {
          const isSelected = selectedLanguages.includes(lang.value)
          const isPrimary = primaryLanguage === lang.value
          
          return (
            <button
              key={lang.value}
              type="button"
              onClick={() => toggleLanguage(lang.value)}
              className={`px-4 py-2 rounded-lg border-2 transition-all ${
                isSelected
                  ? isPrimary
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-blue-400 bg-blue-50 text-blue-800'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="font-medium">{lang.label}</span>
              {isPrimary && selectedLanguages.length > 1 && (
                <span className="ml-2 text-xs">(Primary)</span>
              )}
            </button>
          )
        })}
      </div>
      {selectedLanguages.length > 1 && (
        <p className="text-sm text-gray-600">
          Click on a selected language to set it as primary
        </p>
      )}
    </div>
  )
}

