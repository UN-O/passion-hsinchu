"use client"

import { useState } from "react"
import { ImmersiveScreen } from "@/components/immersive/immersive-screen"
import { useImmersiveNav } from "@/components/immersive/immersive-nav-context"
import { Button } from "@/components/ui/button"
import { useOpeningStepAdvance } from "@/hooks/use-opening-step-advance"
import { OpeningTransitionProvider } from "@/components/opening/opening-transition"
import { CampRulesRevealScreen, CampRulesTitleScreen } from "@/components/opening/camp/camp-rules-reveal"
import { campOnboardingZones, campRuleImages } from "@/lib/opening-camp-content"
import { openingGradients } from "@/lib/opening-gradients"
import { completeOpening } from "@/app/opening/actions"
import { campStepFromPath, type CampStep } from "@/lib/opening-steps"

const RULE_SCREENS_COUNT = 1 + campRuleImages.length // 標題頁（文字）+ 守則一～五（圖片）
const TOTAL_STEPS = RULE_SCREENS_COUNT + campOnboardingZones.length

function OnboardingContent() {
  const { index } = useImmersiveNav()
  const advance = useOpeningStepAdvance(null)
  const isLast = index === TOTAL_STEPS - 1

  if (index === 0) {
    return <CampRulesTitleScreen onAdvance={advance} />
  }

  if (index < RULE_SCREENS_COUNT) {
    return <CampRulesRevealScreen onAdvance={advance} />
  }

  const zone = campOnboardingZones[index - RULE_SCREENS_COUNT]

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-sm tracking-[0.2em] text-white/60">
        {index + 1} / {TOTAL_STEPS}
      </p>
      <h2 className="text-2xl font-bold sm:text-3xl">{zone.title}</h2>
      <p className="max-w-sm text-white/80">{zone.body}</p>
      {isLast ? (
        <form action={completeOpening}>
          <input type="hidden" name="flow" value="camp" />
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

export function CampOnboardingStep({ onStepChange }: { onStepChange: (step: CampStep) => void }) {
  const [index, setIndex] = useState(0)

  return (
    <OpeningTransitionProvider onNavigate={(path) => onStepChange(campStepFromPath(path))}>
      <ImmersiveScreen
        background={
          index > 0 && index < RULE_SCREENS_COUNT
            ? { type: "image", src: campRuleImages[index - 1] }
            : { type: "shader", colors: openingGradients.campOnboarding }
        }
        scrim={index > 0 && index < RULE_SCREENS_COUNT ? false : true}
        enableTapZones={false}
        enableSwipe={false}
        totalSteps={TOTAL_STEPS}
        index={index}
        onIndexChange={setIndex}
        progress={{ mode: "manual", value: 0 }}
        onBack={() => (index === 0 ? onStepChange("result") : setIndex(index - 1))}
      >
        <OnboardingContent />
      </ImmersiveScreen>
    </OpeningTransitionProvider>
  )
}
