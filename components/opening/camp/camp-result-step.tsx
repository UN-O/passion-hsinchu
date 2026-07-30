"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { ImmersiveScreen } from "@/components/immersive/immersive-screen"
import { useImmersiveNav } from "@/components/immersive/immersive-nav-context"
import { Button } from "@/components/ui/button"
import { useCampFlow } from "@/components/opening/camp-flow-context"
import { useOpeningStepAdvance } from "@/hooks/use-opening-step-advance"
import { OpeningTransitionProvider } from "@/components/opening/opening-transition"
import { CampProfileCard } from "@/components/opening/camp-profile-card"
import { campQuizQuestions, getCampProfileResult } from "@/lib/opening-camp-content"
import { openingGradients, staticDarkCanvasDraw } from "@/lib/opening-gradients"
import { HERO_AVATAR_PLACEHOLDER_URI } from "@/lib/hero-card-visuals"
import { campStepFromPath, type CampStep } from "@/lib/opening-steps"

export const resultImages = ["/images/passion-logo.png", HERO_AVATAR_PLACEHOLDER_URI]

function ResultContent({ heroName, aCount }: { heroName: string; aCount: number }) {
  const { index } = useImmersiveNav()
  const advance = useOpeningStepAdvance("/opening/camp/onboarding")
  const result = getCampProfileResult(aCount)

  if (index === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-6 text-center">
        <CampProfileCard heroName={heroName} result={result} />
        <Button size="lg" onClick={advance}>
          了解更多
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 overflow-y-auto px-6 py-8 text-center text-white/90">
      <Image
        src={HERO_AVATAR_PLACEHOLDER_URI}
        alt="Place holder png"
        width={160}
        height={160}
        className="aspect-square w-full max-w-40 self-center rounded-2xl border border-white/30 object-cover"
      />
      <p>{result.description}</p>
      <div>
        <p className="text-sm font-medium text-white/60">勇者特質</p>
        <p className="mt-1">{result.traits.join("、")}</p>
      </div>
      <div>
        <p className="text-sm font-medium text-white/60">小提醒</p>
        <p className="mt-1">{result.reminder}</p>
      </div>
      <Button size="lg" onClick={advance} className="mt-2 self-center">
        下一步
      </Button>
    </div>
  )
}

export function CampResultStep({ onStepChange }: { onStepChange: (step: CampStep) => void }) {
  const { aCount, answers, heroName } = useCampFlow()
  const [index, setIndex] = useState(0)
  const incomplete = Object.keys(answers).length < campQuizQuestions.length

  useEffect(() => {
    if (incomplete) onStepChange("quiz")
  }, [incomplete, onStepChange])

  if (incomplete) return null

  return (
    <OpeningTransitionProvider onNavigate={(path) => onStepChange(campStepFromPath(path))}>
      <ImmersiveScreen
        background={
          index === 0
            ? { type: "canvas", draw: staticDarkCanvasDraw }
            : { type: "shader", colors: openingGradients.campWelcome }
        }
        enableTapZones={false}
        enableSwipe={false}
        totalSteps={2}
        index={index}
        onIndexChange={setIndex}
        progress={{ mode: "manual", value: 0 }}
        onBack={() => (index === 0 ? onStepChange("quiz") : setIndex(index - 1))}
      >
        <ResultContent heroName={heroName} aCount={aCount} />
      </ImmersiveScreen>
    </OpeningTransitionProvider>
  )
}
