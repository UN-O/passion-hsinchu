"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ImmersiveScreen } from "@/components/immersive/immersive-screen"
import { useImmersiveNav } from "@/components/immersive/immersive-nav-context"
import { Button } from "@/components/ui/button"
import { useOpeningStepAdvance } from "@/hooks/use-opening-step-advance"
import { campOnboardingZones } from "@/lib/opening-camp-content"
import { openingGradients } from "@/lib/opening-gradients"
import { completeOpening } from "@/app/opening/actions"

function OnboardingContent() {
  const { index } = useImmersiveNav()
  const advance = useOpeningStepAdvance(null)
  const zone = campOnboardingZones[index]
  const isLast = index === campOnboardingZones.length - 1

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-sm tracking-[0.2em] text-white/60">
        {index + 1} / {campOnboardingZones.length}
      </p>
      <h2 className="text-2xl font-bold sm:text-3xl">{zone.title}</h2>
      <p className="max-w-sm text-white/80">{zone.body}</p>
      {isLast ? (
        <form action={completeOpening}>
          <Button size="lg" type="submit">
            完成
          </Button>
        </form>
      ) : (
        <Button size="lg" onClick={advance}>
          下一步
        </Button>
      )}
    </div>
  )
}

export default function CampOnboardingPage() {
  const router = useRouter()
  const [index, setIndex] = useState(0)

  return (
    <ImmersiveScreen
      background={{ type: "shader", colors: openingGradients.campOnboarding }}
      enableTapZones={false}
      enableSwipe={false}
      totalSteps={campOnboardingZones.length}
      index={index}
      onIndexChange={setIndex}
      progress={{ mode: "manual", value: 0 }}
      onBack={() => (index === 0 ? router.push("/opening/camp/result") : setIndex(index - 1))}
    >
      <OnboardingContent />
    </ImmersiveScreen>
  )
}
