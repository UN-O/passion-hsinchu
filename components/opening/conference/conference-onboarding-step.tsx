"use client"

import { useState } from "react"
import Image from "next/image"
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

  // min-h-full（不是 h-full）：見 conference-welcome-step.tsx 的完整說明。
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-6 px-6 py-8 text-center">
      <p className="text-sm tracking-[0.2em] text-white/60">
        {index + 1} / {conferenceWorkshops.length}
      </p>
      {/* 講員／主題文字改成去背人像圖。flex-1 + min-h-0：圖片撐滿計數文字跟
          按鈕中間剩下的所有垂直空間（上下頂到底），寬度不另外設定，用
          aspect-[4/5] 反過來跟著撐滿的高度等比例算寬——高度優先撐滿畫面，
          而不是原本寬度優先、高度跟著算（那樣螢幕越高只會留白，圖不會變大）。
          max-w-full 防止極端矮寬螢幕時算出來的寬度超出畫面。 */}
      <div className="relative aspect-[4/5] max-w-full min-h-0 flex-1">
        <Image
          src={workshop.introImage}
          alt={workshop.topic || workshop.speaker}
          fill
          sizes="(min-width: 640px) 500px, 90vw"
          className="object-contain"
        />
      </div>
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
