"use client"

import { useState } from "react"
import { ImmersiveScreen } from "@/components/immersive/immersive-screen"
import { CampRulesRevealScreen } from "@/components/opening/camp/camp-rules-reveal"
import { campRuleImages } from "@/lib/opening-camp-content"

export default function CampRulesPlaygroundPage() {
  const [index, setIndex] = useState(0)

  return (
    <ImmersiveScreen
      background={{ type: "image", src: campRuleImages[index], priority: index === 0 }}
      scrim={false}
      enableTapZones={false}
      enableSwipe={false}
      totalSteps={campRuleImages.length}
      index={index}
      onIndexChange={setIndex}
      progress={{ mode: "manual", value: 0 }}
      onBack={() => setIndex(Math.max(index - 1, 0))}
    >
      <CampRulesRevealScreen onAdvance={() => setIndex(Math.min(index + 1, campRuleImages.length - 1))} />
    </ImmersiveScreen>
  )
}
