"use client"

import { useCallback, useState } from "react"
import { ConferenceWelcomeStep } from "./conference-welcome-step"
import { ConferenceHeartSelectStep } from "./conference-heart-select-step"
import { ConferenceVersePrayerStep } from "./conference-verse-prayer-step"
import type { ConferenceStep } from "@/lib/opening-steps"

export function ConferenceFlowScreens({
  initialStep,
  name,
}: {
  initialStep: ConferenceStep
  name: string
}) {
  const [step, setStep] = useState<ConferenceStep>(initialStep)

  const onStepChange = useCallback((next: ConferenceStep) => {
    setStep(next)
    window.history.replaceState(null, "", `/opening/conference/${next}`)
  }, [])

  if (step === "welcome") return <ConferenceWelcomeStep onStepChange={onStepChange} />
  if (step === "heart-select") return <ConferenceHeartSelectStep onStepChange={onStepChange} />
  return <ConferenceVersePrayerStep name={name} onStepChange={onStepChange} />
}
