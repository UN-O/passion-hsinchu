"use client"

import { useState } from "react"
import { ImmersiveScreen } from "@/components/immersive/immersive-screen"
import { Button } from "@/components/ui/button"
import { LogoutDialog } from "@/components/opening/logout-dialog"
import { useOpeningStepAdvance } from "@/hooks/use-opening-step-advance"
import { OpeningTransitionProvider } from "@/components/opening/opening-transition"
import { openingGradients } from "@/lib/opening-gradients"

function WelcomeContent() {
  const advance = useOpeningStepAdvance("/opening/conference/heart-select")

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 px-6 text-center">
      <div>
        <p className="text-sm tracking-[0.2em] text-white/60">旅程的開始</p>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">歡迎來到 PASSION 系統</h1>
      </div>
      <Button size="lg" onClick={advance}>
        下一步
      </Button>
    </div>
  )
}

export default function ConferenceWelcomePage() {
  const [logoutOpen, setLogoutOpen] = useState(false)

  return (
    <OpeningTransitionProvider>
      <ImmersiveScreen
        background={{ type: "shader", colors: openingGradients.conferenceWelcome }}
        enableTapZones={false}
        enableSwipe={false}
        totalSteps={1}
        backLabel="登出"
        onBack={() => setLogoutOpen(true)}
      >
        <WelcomeContent />
      </ImmersiveScreen>

      <LogoutDialog open={logoutOpen} onOpenChange={setLogoutOpen} />
    </OpeningTransitionProvider>
  )
}
