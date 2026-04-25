import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Pencil, Layers, Palette, X, Check } from 'lucide-react'

interface OnboardingProps {
  setOnboardingComplete: (complete: boolean) => void
}

export default function Onboarding({ setOnboardingComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null)
  const [selectedMedium, setSelectedMedium] = useState<string | null>(null)
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null)
  const [showGuestInfo, setShowGuestInfo] = useState(true)
  const navigate = useNavigate()
  const { user } = useAuth()

  const isGuest = !user
  const totalSteps = isGuest ? 2 : 3

  const skillOptions = [
    "Just starting out",
    "Some experience", 
    "Practising regularly"
  ]

  const mediumOptions = [
    "Air dry clay",
    "Watercolours",
    "Acrylics",
    "Mixed media"
  ]

  const handleNext = () => {
    if (currentStep === 0) {
      // Skill level step
      if (selectedSkill) {
        localStorage.setItem('artly_skill', selectedSkill)
        setCurrentStep(1)
      }
    } else if (currentStep === 1) {
      // Medium step
      if (selectedMedium) {
        localStorage.setItem('artly_medium', selectedMedium)
        if (isGuest) {
          // Guest path - complete onboarding
          localStorage.setItem('artly_onboarding_complete', 'true')
          setOnboardingComplete(true)
          navigate('/create', { replace: true })
        } else {
          // Signed in path - go to theme step
          setCurrentStep(2)
        }
      }
    } else if (currentStep === 2) {
      // Theme step (signed in only)
      if (selectedTheme) {
        localStorage.setItem('artly_theme', selectedTheme)
        localStorage.setItem('artly_onboarding_complete', 'true')
        setOnboardingComplete(true)
        navigate('/create', { replace: true })
      }
    }
  }

  const applyTheme = (theme: string) => {
    if (theme === 'light') {
      document.body.classList.add('theme-light')
    } else {
      document.body.classList.remove('theme-light')
    }
    setSelectedTheme(theme)
    localStorage.setItem('artly_theme', theme)
  }

  const renderProgressDots = () => {
    return (
      <div className="flex justify-center gap-[6px] mb-8">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-200 ${
              index <= currentStep
                ? 'bg-[var(--color-primary)]'
                : 'border border-[var(--color-primary)]'
            }`}
          />
        ))}
      </div>
    )
  }

  const renderGuestInfo = () => {
    if (!isGuest || !showGuestInfo) return null

    return (
      <div 
        className="w-full p-4 rounded-lg mb-6 relative"
        style={{ backgroundColor: 'var(--color-warning)', opacity: 0.1 }}
      >
        <button
          onClick={() => setShowGuestInfo(false)}
          className="absolute top-2 right-2 text-[var(--color-text-3)]"
        >
          <X size={16} />
        </button>
        <p className="text-xs text-[var(--color-text-2)] pr-6">
          Exploring as guest — your ideas and journal stay on this device.
          Sign in any time to sync across devices.
        </p>
      </div>
    )
  }

  const renderStep = () => {
    if (currentStep === 0) {
      // Skill level step
      return (
        <div className="w-full max-w-md mx-auto">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-primary)', opacity: 0.15 }}
            >
              <Pencil size={24} style={{ color: 'var(--color-primary)' }} />
            </div>
          </div>

          {/* Question */}
          <h2 className="text-lg font-bold text-center mb-2" style={{ color: 'var(--color-text)' }}>
            What's your skill level?
          </h2>

          {/* Options */}
          <div className="space-y-3 mb-6">
            {skillOptions.map((option) => (
              <div
                key={option}
                onClick={() => setSelectedSkill(option)}
                className={`w-full min-h-[48px] p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedSkill === option
                    ? 'border-[var(--color-primary)]'
                    : 'border-[var(--color-border)]'
                }`}
                style={{
                  backgroundColor: selectedSkill === option 
                    ? 'var(--color-primary)' 
                    : 'var(--color-surface)',
                  opacity: selectedSkill === option ? 0.1 : 1,
                  border: '1px solid var(--color-border)'
                }}
              >
                <span className="text-sm" style={{ 
                  color: selectedSkill === option ? 'var(--color-primary)' : 'var(--color-text)' 
                }}>
                  {option}
                </span>
              </div>
            ))}
          </div>

          {/* Next button */}
          <button
            onClick={handleNext}
            disabled={!selectedSkill}
            className="w-full h-12 rounded-xl font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: selectedSkill ? 'var(--color-primary)' : 'var(--color-surface)',
              color: selectedSkill ? 'white' : 'var(--color-text-3)'
            }}
          >
            Next
          </button>
        </div>
      )
    }

    if (currentStep === 1) {
      // Medium step
      return (
        <div className="w-full max-w-md mx-auto">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#1D9E75', opacity: 0.15 }}
            >
              <Layers size={24} style={{ color: '#1D9E75' }} />
            </div>
          </div>

          {/* Question */}
          <h2 className="text-lg font-bold text-center mb-2" style={{ color: 'var(--color-text)' }}>
            What's your main medium?
          </h2>

          {/* Options */}
          <div className="space-y-3 mb-6">
            {mediumOptions.map((option) => (
              <div
                key={option}
                onClick={() => setSelectedMedium(option)}
                className={`w-full min-h-[48px] p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedMedium === option
                    ? 'border-[var(--color-primary)]'
                    : 'border-[var(--color-border)]'
                }`}
                style={{
                  backgroundColor: selectedMedium === option 
                    ? 'var(--color-primary)' 
                    : 'var(--color-surface)',
                  opacity: selectedMedium === option ? 0.1 : 1,
                  border: '1px solid var(--color-border)'
                }}
              >
                <span className="text-sm" style={{ 
                  color: selectedMedium === option ? 'var(--color-primary)' : 'var(--color-text)' 
                }}>
                  {option}
                </span>
              </div>
            ))}
          </div>

          {/* Next button */}
          <button
            onClick={handleNext}
            disabled={!selectedMedium}
            className="w-full h-12 rounded-xl font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: selectedMedium ? 'var(--color-primary)' : 'var(--color-surface)',
              color: selectedMedium ? 'white' : 'var(--color-text-3)'
            }}
          >
            {isGuest ? 'Start creating' : 'Next'}
          </button>
        </div>
      )
    }

    if (currentStep === 2 && !isGuest) {
      // Theme step (signed in only)
      return (
        <div className="w-full max-w-md mx-auto">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#EF9F27', opacity: 0.15 }}
            >
              <Palette size={24} style={{ color: '#EF9F27' }} />
            </div>
          </div>

          {/* Question */}
          <h2 className="text-lg font-bold text-center mb-2" style={{ color: 'var(--color-text)' }}>
            Choose your style
          </h2>
          
          {/* Subtitle */}
          <p className="text-sm text-center mb-6" style={{ color: 'var(--color-text-2)' }}>
            You can change this any time in Profile
          </p>

          {/* Theme cards */}
          <div className="flex gap-3 mb-6">
            {/* Dark theme card */}
            <div
              onClick={() => applyTheme('dark')}
              className={`flex-1 p-3 rounded-lg cursor-pointer transition-all duration-200 relative ${
                selectedTheme === 'dark' ? 'border-[var(--color-primary)]' : ''
              }`}
              style={{
                backgroundColor: '#0F0F1A',
                border: '1px solid #3a3a5c'
              }}
            >
              {selectedTheme === 'dark' && (
                <Check size={14} className="absolute top-2 right-2" style={{ color: 'var(--color-primary)' }} />
              )}
              <div className="flex gap-1 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#0F0F1A' }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#6C3CE1' }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FF3D71' }} />
              </div>
              <div className="text-sm font-semibold text-white mb-1">Artisan dark</div>
              <div className="text-xs" style={{ color: '#5a5a7a' }}>Deep navy · electric violet</div>
            </div>

            {/* Light theme card */}
            <div
              onClick={() => applyTheme('light')}
              className={`flex-1 p-3 rounded-lg cursor-pointer transition-all duration-200 relative ${
                selectedTheme === 'light' ? 'border-[var(--color-primary)]' : ''
              }`}
              style={{
                backgroundColor: '#F7F1E8',
                border: '1px solid #C8B89A'
              }}
            >
              {selectedTheme === 'light' && (
                <Check size={14} className="absolute top-2 right-2" style={{ color: 'var(--color-primary)' }} />
              )}
              <div className="flex gap-1 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#F7F1E8' }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#B05E3A' }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#4A7A50' }} />
              </div>
              <div className="text-sm font-semibold mb-1" style={{ color: '#1C1209' }}>Studio light</div>
              <div className="text-xs" style={{ color: '#9A8070' }}>Warm cream · burnt sienna</div>
            </div>
          </div>

          {/* Start button */}
          <button
            onClick={handleNext}
            disabled={!selectedTheme}
            className="w-full h-12 rounded-xl font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: selectedTheme ? 'var(--color-primary)' : 'var(--color-surface)',
              color: selectedTheme ? 'white' : 'var(--color-text-3)'
            }}
          >
            Start creating →
          </button>
        </div>
      )
    }

    return null
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: 'var(--color-bg)' }}>
      {renderGuestInfo()}
      {renderProgressDots()}
      {renderStep()}
    </div>
  )
}
