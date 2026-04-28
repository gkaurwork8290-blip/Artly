import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

type SkillLevel = 'beginner' | 'intermediate' | 'advanced'

interface OnboardingProps {
  setOnboardingComplete: (complete: boolean) => void
}

interface SkillCard {
  level: SkillLevel
  emoji: string
  title: string
  description: string
}

export default function Onboarding({ setOnboardingComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedLevel, setSelectedLevel] = useState<SkillLevel | null>(null)
  const navigate = useNavigate()

  const skillCards: SkillCard[] = [
    {
      level: 'beginner',
      emoji: '🌱',
      title: 'Beginner',
      description: "I'm just starting out"
    },
    {
      level: 'intermediate',
      emoji: '🎨',
      title: 'Intermediate',
      description: "I've been creating for a while"
    },
    {
      level: 'advanced',
      emoji: '⭐',
      title: 'Advanced',
      description: "I'm an experienced artist"
    }
  ]

  const handleContinue = () => {
    console.log('handleContinue called, currentStep:', currentStep, 'selectedLevel:', selectedLevel)
    
    if (currentStep === 1) {
      setCurrentStep(2)
    } else if (currentStep === 2 && selectedLevel) {
      setCurrentStep(3)
    } else if (currentStep === 3 && selectedLevel) {
      // Save to localStorage
      localStorage.setItem('artly_skill_level', selectedLevel)
      localStorage.setItem('artly_onboarding_complete', 'true')
      // Update parent state immediately to prevent timing issues
      setOnboardingComplete(true)
      console.log('Onboarding complete, navigating to /create...')
      // Navigate to create
      navigate('/create', { replace: true })
    }
  }

  const getReadyMessage = () => {
    switch (selectedLevel) {
      case 'beginner':
        return "We'll keep things simple and guide you every step of the way"
      case 'intermediate':
        return "We'll give you creative freedom with helpful suggestions"
      case 'advanced':
        return "We'll give you full creative control with advanced insights"
      default:
        return "Let's start your creative journey"
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center">
            <div className="text-6xl mb-8">🎨</div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-tertiary bg-clip-text text-transparent">
              Welcome to Artly
            </h1>
            <p className="text-xl text-text-secondary mb-12 max-w-md mx-auto">
              Your AI creative assistant — let's get you set up in 60 seconds
            </p>
            <button
              onClick={handleContinue}
              className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-full hover:shadow-lg hover:shadow-primary/25 transform hover:scale-105 transition-all duration-200"
            >
              Let's Go
            </button>
          </div>
        )

      case 2:
        return (
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-text-primary">
              What's your experience level?
            </h2>
            <div className="grid gap-4 max-w-2xl mx-auto mb-8">
              {skillCards.map((card) => (
                <div
                  key={card.level}
                  onClick={() => setSelectedLevel(card.level)}
                  className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    selectedLevel === card.level
                      ? 'border-gradient-to-r from-primary to-secondary bg-surface'
                      : 'border-surface2 bg-surface hover:border-surface'
                  }`}
                  style={{
                    borderColor: selectedLevel === card.level ? 'var(--primary)' : undefined,
                    background: selectedLevel === card.level 
                      ? 'linear-gradient(135deg, var(--surface), var(--surface2))' 
                      : 'var(--surface)'
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">{card.emoji}</div>
                    <div className="text-left">
                      <div className="text-xl font-semibold text-text-primary mb-1">
                        {card.title}
                      </div>
                      <div className="text-text-secondary">
                        {card.description}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={handleContinue}
              disabled={!selectedLevel}
              className={`px-8 py-4 font-semibold rounded-full transition-all duration-200 ${
                selectedLevel
                  ? 'bg-gradient-to-r from-primary to-secondary text-white hover:shadow-lg hover:shadow-primary/25 transform hover:scale-105'
                  : 'bg-surface2 text-text-secondary cursor-not-allowed'
              }`}
            >
              Continue
            </button>
          </div>
        )

      case 3:
        return (
          <div className="text-center">
            <div className="text-6xl mb-8">✨</div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-tertiary bg-clip-text text-transparent">
              You're all set!
            </h1>
            <p className="text-xl text-text-secondary mb-12 max-w-md mx-auto">
              {getReadyMessage()}
            </p>
            <button
              onClick={() => {
                console.log('Start Creating button clicked!')
                handleContinue()
              }}
              className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-full hover:shadow-lg hover:shadow-primary/25 transform hover:scale-105 transition-all duration-200"
            >
              Start Creating
            </button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-4xl">
        {/* Progress indicators */}
        <div className="flex justify-center gap-2 mb-12">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`h-2 rounded-full transition-all duration-300 ${
                step <= currentStep
                  ? 'w-24 bg-gradient-to-r from-primary to-secondary'
                  : 'w-8 bg-surface2'
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        {renderStep()}
      </div>
    </div>
  )
}
