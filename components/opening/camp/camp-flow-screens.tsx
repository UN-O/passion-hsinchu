"use client"

import { useCallback, useState } from "react"
import { FlowPreloadGate } from "@/components/opening/flow-preload-gate"
import { CampWelcomeStep } from "./camp-welcome-step"
import { CampQuizStep, quizImages } from "./camp-quiz-step"
import { CampResultStep, resultImages } from "./camp-result-step"
import { CampOnboardingStep } from "./camp-onboarding-step"
import type { CampStep } from "@/lib/opening-steps"

const CAMP_PRELOAD_IMAGES = Array.from(new Set([...quizImages, ...resultImages]))

export function CampFlowScreens({ initialStep }: { initialStep: CampStep }) {
  const [step, setStep] = useState<CampStep>(initialStep)

  const onStepChange = useCallback((next: CampStep) => {
    setStep(next)
    window.history.replaceState(null, "", `/opening/camp/${next}`)
  }, [])

  return (
    <FlowPreloadGate images={CAMP_PRELOAD_IMAGES}>
      {step === "welcome" && <CampWelcomeStep onStepChange={onStepChange} />}
      {step === "quiz" && <CampQuizStep onStepChange={onStepChange} />}
      {step === "result" && <CampResultStep onStepChange={onStepChange} />}
      {step === "onboarding" && <CampOnboardingStep onStepChange={onStepChange} />}
    </FlowPreloadGate>
  )
}
