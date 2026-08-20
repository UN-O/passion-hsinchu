"use client"

import { useState } from "react"
import { ImmersiveScreen } from "@/components/immersive/immersive-screen"
import { Button } from "@/components/ui/button"
import { LogoutDialog } from "@/components/opening/logout-dialog"
import { useOpeningStepAdvance } from "@/hooks/use-opening-step-advance"
import { OpeningTransitionProvider } from "@/components/opening/opening-transition"
import { openingGradients } from "@/lib/opening-gradients"
import { conferenceStepFromPath, type ConferenceStep } from "@/lib/opening-steps"

function WelcomeContent() {
  const advance = useOpeningStepAdvance("/opening/conference/heart-select")

  // min-h-full（不是 h-full）：文字換行變多行時，容器可以長高裝下內容，
  // justify-center 才會在「有多餘空間」時才置中；用 h-full 固定死高度的話，
  // 超出的內容因為 justify-center 會上下對稱溢出，上半段超出可視範圍最上緣
  // （ImmersiveScreen 外層的捲動容器預設從最上面開始看，不會主動往上捲），
  // 使用者看起來就像文字最上面被切掉了。
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-8 px-6 py-8 text-center">
      <div className="w-full">
        <p className="text-sm tracking-[0.2em] text-white/60">旅程的開始</p>
        <h1 className="font-heading mt-3 text-3xl font-bold sm:text-4xl">歡迎來到 PASSION 系統</h1>
      </div>
      <Button size="lg" onClick={advance}>
        下一步
      </Button>
    </div>
  )
}

export function ConferenceWelcomeStep({
  onStepChange,
}: {
  onStepChange: (step: ConferenceStep) => void
}) {
  const [logoutOpen, setLogoutOpen] = useState(false)

  return (
    <OpeningTransitionProvider onNavigate={(path) => onStepChange(conferenceStepFromPath(path))}>
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
