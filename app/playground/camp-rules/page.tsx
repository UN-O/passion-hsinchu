"use client"

import { useState } from "react"
import { ImmersiveScreen } from "@/components/immersive/immersive-screen"
import { CampRulesRevealScreen } from "@/components/opening/camp/camp-rules-reveal"
import { campRuleScreens } from "@/lib/opening-camp-content"
import { openingGradients } from "@/lib/opening-gradients"

export default function CampRulesPlaygroundPage() {
  const [index, setIndex] = useState(0)

  return (
    <ImmersiveScreen
      background={{ type: "shader", colors: openingGradients.campOnboarding }}
      enableTapZones={false}
      enableSwipe={false}
      totalSteps={campRuleScreens.length}
      index={index}
      onIndexChange={setIndex}
      progress={{ mode: "manual", value: 0 }}
      onBack={() => setIndex(Math.max(index - 1, 0))}
    >
      <CampRulesRevealScreen
        screen={campRuleScreens[index]}
        screenIndex={index}
        onAdvance={() => setIndex(Math.min(index + 1, campRuleScreens.length - 1))}
      />
    </ImmersiveScreen>
  )
}
