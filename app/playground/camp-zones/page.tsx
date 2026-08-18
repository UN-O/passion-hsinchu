"use client"

import { ImmersiveScreen } from "@/components/immersive/immersive-screen"
import { Button } from "@/components/ui/button"
import { CampZonesGrid } from "@/components/opening/camp/camp-zones-reveal"
import { campZoneScreens } from "@/lib/opening-camp-content"
import { openingGradients } from "@/lib/opening-gradients"

export default function CampZonesPlaygroundPage() {
  return (
    <ImmersiveScreen background={{ type: "shader", colors: openingGradients.campOnboarding }}>
      <div className="flex h-full flex-col items-center justify-start gap-8 px-6 py-12 text-center">
        <CampZonesGrid zones={campZoneScreens} />
        <Button size="lg">開始冒險</Button>
      </div>
    </ImmersiveScreen>
  )
}
