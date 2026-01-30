import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  PlayCircle,
  BookOpen,
  Lightbulb,
} from 'lucide-react'

interface OnboardingStep {
  id: number
  title: string
  description: string
  type: string
  page: string
  target?: string
  content: string
  action?: string
  optional: boolean
  duration: number
}

interface OnboardingTour {
  id: number
  name: string
  description: string
  steps: OnboardingStep[]
  category: string
  mandatory: boolean
}

interface OnboardingTourProps {
  onComplete?: () => void
  onSkip?: () => void
}

export default function OnboardingTour({ onComplete, onSkip }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [showTour, setShowTour] = useState(false)
  const [highlightElement, setHighlightElement] = useState<HTMLElement | null>(null)

  // Fetch user's onboarding status
  const { data: onboarding } = useQuery({
    queryKey: ['onboarding-status'],
    queryFn: () => apiClient.get('/onboarding/status'),
  })

  // Fetch available tours
  const { data: tours } = useQuery({
    queryKey: ['onboarding-tours'],
    queryFn: () => apiClient.get('/onboarding/tours'),
  })

  // Complete step mutation
  const completeStep = useMutation({
    mutationFn: (stepId: number) => apiClient.post(`/onboarding/steps/${stepId}/complete`, {}),
  })

  // Skip step mutation
  const skipStep = useMutation({
    mutationFn: (stepId: number) => apiClient.post(`/onboarding/steps/${stepId}/skip`, {}),
  })

  const currentTour = tours?.[0] as OnboardingTour | undefined
  const steps = currentTour?.steps || []
  const step = steps[currentStep]

  useEffect(() => {
    // Show tour if user hasn't completed onboarding
    if (onboarding && !onboarding.completed_at && onboarding.progress < 100) {
      setShowTour(true)
    }
  }, [onboarding])

  useEffect(() => {
    // Highlight target element
    if (step?.target && showTour) {
      const element = document.querySelector(step.target) as HTMLElement
      if (element) {
        setHighlightElement(element)
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    } else {
      setHighlightElement(null)
    }
  }, [step, showTour])

  const handleNext = () => {
    if (step) {
      completeStep.mutate(step.id)
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkipStep = () => {
    if (step) {
      skipStep.mutate(step.id)
    }
    handleNext()
  }

  const handleComplete = () => {
    setShowTour(false)
    onComplete?.()
  }

  const handleSkipTour = () => {
    setShowTour(false)
    onSkip?.()
  }

  if (!showTour || !step || !currentTour) {
    return null
  }

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'tour':
        return <PlayCircle className="h-5 w-5" />
      case 'tutorial':
        return <BookOpen className="h-5 w-5" />
      case 'task':
        return <Check className="h-5 w-5" />
      default:
        return <Lightbulb className="h-5 w-5" />
    }
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={handleSkipTour} />

      {/* Highlight spotlight */}
      {highlightElement && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            top: highlightElement.offsetTop - 10,
            left: highlightElement.offsetLeft - 10,
            width: highlightElement.offsetWidth + 20,
            height: highlightElement.offsetHeight + 20,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
            borderRadius: '8px',
          }}
        />
      )}

      {/* Tour card */}
      <div className="fixed bottom-8 right-8 w-96 bg-white rounded-lg shadow-2xl z-50 border-2 border-blue-500">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-t-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              {getStepIcon(step.type)}
              <span className="font-semibold">{currentTour.name}</span>
            </div>
            <button onClick={handleSkipTour} className="hover:bg-blue-700 rounded p-1">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{step.duration} min</span>
          </div>
          <div className="mt-2 bg-blue-700 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
          <p className="text-sm text-gray-600 mb-4">{step.description}</p>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
            <p className="text-sm text-gray-700">{step.content}</p>
          </div>
          {step.action && (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
              <p className="text-sm font-medium text-yellow-800">
                <span className="font-bold">Action:</span> {step.action}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex items-center justify-between">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            {step.optional && (
              <Button variant="ghost" size="sm" onClick={handleSkipStep}>
                Skip
              </Button>
            )}
          </div>
          <Button size="sm" onClick={handleNext}>
            {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </>
  )
}
