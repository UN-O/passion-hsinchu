"use client"

import { useState } from "react"
import { ImmersiveScreen } from "@/components/immersive/immersive-screen"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LogoutDialog } from "@/components/opening/logout-dialog"
import { useCampFlow } from "@/components/opening/camp-flow-context"
import { useOpeningStepAdvance } from "@/hooks/use-opening-step-advance"
import { OpeningTransitionProvider } from "@/components/opening/opening-transition"
import { openingGradients } from "@/lib/opening-gradients"

function WelcomeContent() {
  const { heroName, setHeroName } = useCampFlow()
  const advance = useOpeningStepAdvance("/opening/camp/quiz")
  const canAdvance = heroName.trim() !== ""

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 px-6 text-center">
      <div>
        <p className="text-sm tracking-[0.2em] text-white/60">旅程的開始</p>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">歡迎來到 PASSION 系統</h1>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-2 text-left">
        <label className="text-sm text-white/70" htmlFor="hero-name">
          輸入你的勇者姓名 ID
        </label>
        <Input
          id="hero-name"
          value={heroName}
          onChange={(event) => setHeroName(event.target.value)}
          placeholder="勇者 ID"
          className="border-white/30 bg-black/20 text-white placeholder:text-white/50"
        />
      </div>

      <Button size="lg" disabled={!canAdvance} onClick={advance}>
        下一步
      </Button>
    </div>
  )
}

export default function CampWelcomePage() {
  const [logoutOpen, setLogoutOpen] = useState(false)

  return (
    <OpeningTransitionProvider>
      <ImmersiveScreen
        background={{ type: "shader", colors: openingGradients.campWelcome }}
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
