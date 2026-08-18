"use client"

import { ImmersiveScreen } from "@/components/immersive/immersive-screen"
import { Button } from "@/components/ui/button"
import { OpeningTransitionProvider } from "@/components/opening/opening-transition"
import { CampZonesGrid } from "@/components/opening/camp/camp-zones-reveal"
import { campZoneScreens } from "@/lib/opening-camp-content"
import { openingGradients } from "@/lib/opening-gradients"
import { completeOpening } from "@/app/opening/actions"
import { campStepFromPath, type CampStep } from "@/lib/opening-steps"

export const zoneImages = campZoneScreens.map((zone) => zone.icon)

export function CampZonesStep({ onStepChange }: { onStepChange: (step: CampStep) => void }) {
  return (
    <OpeningTransitionProvider onNavigate={(path) => onStepChange(campStepFromPath(path))}>
      <ImmersiveScreen
        background={{ type: "shader", colors: openingGradients.campOnboarding }}
        enableTapZones={false}
        enableSwipe={false}
        onBack={() => onStepChange("onboarding")}
      >
        <div className="flex h-full flex-col items-center justify-start gap-8 px-6 py-12 text-center">
          <CampZonesGrid zones={campZoneScreens} />
          <form action={completeOpening}>
            <input type="hidden" name="flow" value="camp" />
            <Button size="lg" type="submit">
              開始冒險
            </Button>
          </form>
        </div>
      </ImmersiveScreen>
    </OpeningTransitionProvider>
  )
}
