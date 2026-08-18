"use client"

import { useState } from "react"
import { ImmersiveScreen } from "@/components/immersive/immersive-screen"
import { CampRulesRevealScreen, CampRulesTitleScreen } from "@/components/opening/camp/camp-rules-reveal"
import { campRuleImages } from "@/lib/opening-camp-content"
import { openingGradients } from "@/lib/opening-gradients"

const TOTAL_STEPS = 1 + campRuleImages.length

export default function CampRulesPlaygroundPage() {
  const [index, setIndex] = useState(0)

  return (
    <ImmersiveScreen
      background={
        index > 0
          ? { type: "image", src: campRuleImages[index - 1] }
          : { type: "shader", colors: openingGradients.campOnboarding }
      }
      scrim={index === 0}
      enableTapZones={false}
      enableSwipe={false}
      totalSteps={TOTAL_STEPS}
      index={index}
      onIndexChange={setIndex}
      progress={{ mode: "manual", value: 0 }}
      onBack={() => setIndex(Math.max(index - 1, 0))}
    >
      {index === 0 ? (
        <CampRulesTitleScreen onAdvance={() => setIndex(1)} />
      ) : (
        <CampRulesRevealScreen onAdvance={() => setIndex(Math.min(index + 1, TOTAL_STEPS - 1))} />
      )}
    </ImmersiveScreen>
  )
}
