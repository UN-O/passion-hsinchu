"use client"

import { useState } from "react"
import { ImmersiveScreen } from "@/components/immersive/immersive-screen"
import { useImmersiveNav } from "@/components/immersive/immersive-nav-context"
import { Button } from "@/components/ui/button"
import { useOpeningStepAdvance } from "@/hooks/use-opening-step-advance"
import { OpeningTransitionProvider } from "@/components/opening/opening-transition"
import { conferenceWorkshops } from "@/lib/opening-conference-content"
import { openingGradients } from "@/lib/opening-gradients"
import { completeOpening } from "@/app/opening/actions"
import { conferenceStepFromPath, type ConferenceStep } from "@/lib/opening-steps"

function OnboardingContent() {
  const { index } = useImmersiveNav()
  const advance = useOpeningStepAdvance(null)
  const workshop = conferenceWorkshops[index]
  const isLast = index === conferenceWorkshops.length - 1

  // min-h-full（不是 h-full）：避免長主題文字換行變多行時，justify-center
  // 讓溢出的內容往上超出捲動容器可視範圍最上緣（見 conference-welcome-step.tsx
  // 的完整說明），看起來像文字被切掉。
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-6 px-6 py-8 text-center">
      <p className="text-sm tracking-[0.2em] text-white/60">
        {index + 1} / {conferenceWorkshops.length}
      </p>
      <h2 className="font-heading w-full text-2xl font-bold sm:text-3xl">
        {workshop.topic || workshop.speaker}
      </h2>
      {workshop.topic && <p className="max-w-sm text-white/80">{workshop.speaker}</p>}
      {isLast ? (
        <form action={completeOpening}>
          <input type="hidden" name="flow" value="conference" />
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

export function ConferenceOnboardingStep({
  onStepChange,
}: {
  onStepChange: (step: ConferenceStep) => void
}) {
  const [index, setIndex] = useState(0)

  return (
    <OpeningTransitionProvider onNavigate={(path) => onStepChange(conferenceStepFromPath(path))}>
      <ImmersiveScreen
        background={{ type: "shader", colors: openingGradients.conferenceOnboarding }}
        enableTapZones={false}
        enableSwipe={false}
        totalSteps={conferenceWorkshops.length}
        index={index}
        onIndexChange={setIndex}
        progress={{ mode: "manual", value: 0 }}
        onBack={() => (index === 0 ? onStepChange("verse-and-prayer") : setIndex(index - 1))}
      >
        <OnboardingContent />
      </ImmersiveScreen>
    </OpeningTransitionProvider>
  )
}
