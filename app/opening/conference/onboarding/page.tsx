"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ImmersiveScreen } from "@/components/immersive/immersive-screen"
import { useImmersiveNav } from "@/components/immersive/immersive-nav-context"
import { Button } from "@/components/ui/button"
import { useOpeningStepAdvance } from "@/hooks/use-opening-step-advance"
import { conferenceWorkshops } from "@/lib/opening-conference-content"
import { openingGradients } from "@/lib/opening-gradients"
import { completeOpening } from "@/app/opening/actions"

function OnboardingContent() {
  const { index } = useImmersiveNav()
  const advance = useOpeningStepAdvance(null)
  const workshop = conferenceWorkshops[index]
  const isLast = index === conferenceWorkshops.length - 1

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-sm tracking-[0.2em] text-white/60">
        {index + 1} / {conferenceWorkshops.length}
      </p>
      <h2 className="text-2xl font-bold sm:text-3xl">{workshop.title}</h2>
      <p className="max-w-sm text-white/80">{workshop.body}</p>
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

export default function ConferenceOnboardingPage() {
  const router = useRouter()
  const [index, setIndex] = useState(0)

  return (
    <ImmersiveScreen
      background={{ type: "shader", colors: openingGradients.conferenceOnboarding }}
      enableTapZones={false}
      enableSwipe={false}
      totalSteps={conferenceWorkshops.length}
      index={index}
      onIndexChange={setIndex}
      progress={{ mode: "manual", value: 0 }}
      onBack={() =>
        index === 0 ? router.push("/opening/conference/verse-and-prayer") : setIndex(index - 1)
      }
    >
      <OnboardingContent />
    </ImmersiveScreen>
  )
}
