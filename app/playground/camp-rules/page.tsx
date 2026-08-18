"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ImmersiveScreen } from "@/components/immersive/immersive-screen"
import { Button } from "@/components/ui/button"
import { CampRuleContentScreen, CampRulesTitleScreen } from "@/components/opening/camp/camp-rules-reveal"
import { campRuleScreens } from "@/lib/opening-camp-content"

const TOTAL_STEPS = 1 + campRuleScreens.length

export default function CampRulesPlaygroundPage() {
  const router = useRouter()
  const [index, setIndex] = useState(0)
  const advance = () => {
    if (index === TOTAL_STEPS - 1) {
      router.push("/playground/camp-zones")
      return
    }
    setIndex((i) => Math.min(i + 1, TOTAL_STEPS - 1))
  }

  return (
    <ImmersiveScreen
      background={{ type: "color", color: "#feed74" }}
      scrim={false}
      enableTapZones={false}
      enableSwipe={false}
      totalSteps={TOTAL_STEPS}
      index={index}
      onIndexChange={setIndex}
      progress={{ mode: "manual", value: 0, fillClassName: "bg-[#2f2a22]" }}
      onBack={() => setIndex((i) => Math.max(i - 1, 0))}
    >
      {index === 0 ? (
        <CampRulesTitleScreen onAdvance={advance} />
      ) : (
        <CampRuleContentScreen screen={campRuleScreens[index - 1]}>
          <Button size="lg" variant="outline" onClick={advance}>
            {index === TOTAL_STEPS - 1 ? "完成" : "下一步"}
          </Button>
        </CampRuleContentScreen>
      )}
    </ImmersiveScreen>
  )
}
