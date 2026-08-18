"use client"

import { useState } from "react"
import { ImmersiveScreen } from "@/components/immersive/immersive-screen"
import { useImmersiveNav } from "@/components/immersive/immersive-nav-context"
import { Button } from "@/components/ui/button"
import { useOpeningStepAdvance } from "@/hooks/use-opening-step-advance"
import { OpeningTransitionProvider } from "@/components/opening/opening-transition"
import {
  CampRuleContentScreen,
  CampRulesTitleScreen,
} from "@/components/opening/camp/camp-rules-reveal"
import { campRuleScreens } from "@/lib/opening-camp-content"
import { campStepFromPath, type CampStep } from "@/lib/opening-steps"

const TOTAL_STEPS = 1 + campRuleScreens.length // 標題頁 + 守則一～五

function OnboardingContent() {
  const { index } = useImmersiveNav()
  const advance = useOpeningStepAdvance("/opening/camp/zones")

  if (index === 0) {
    return <CampRulesTitleScreen onAdvance={advance} />
  }

  return (
    <CampRuleContentScreen screen={campRuleScreens[index - 1]}>
      <Button size="lg" variant="outline" onClick={advance}>
        下一步
      </Button>
    </CampRuleContentScreen>
  )
}

export function CampOnboardingStep({ onStepChange }: { onStepChange: (step: CampStep) => void }) {
  const [index, setIndex] = useState(0)

  return (
    <OpeningTransitionProvider onNavigate={(path) => onStepChange(campStepFromPath(path))}>
      <ImmersiveScreen
        background={{ type: "color", color: "#feed74" }}
        scrim={false}
        enableTapZones={false}
        enableSwipe={false}
        totalSteps={TOTAL_STEPS}
        index={index}
        onIndexChange={setIndex}
        progress={{ mode: "manual", value: 0, fillClassName: "bg-[#2f2a22]" }}
        onBack={() => (index === 0 ? onStepChange("result") : setIndex(index - 1))}
      >
        <OnboardingContent />
      </ImmersiveScreen>
    </OpeningTransitionProvider>
  )
}
