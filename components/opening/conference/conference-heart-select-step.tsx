"use client"

import { useState } from "react"
import { ImmersiveScreen } from "@/components/immersive/immersive-screen"
import { Button } from "@/components/ui/button"
import { useConferenceFlow } from "@/components/opening/conference-flow-context"
import { OpeningTransitionProvider, useOpeningNavigate } from "@/components/opening/opening-transition"
import { conferenceCategories, type ConferenceCategory } from "@/lib/opening-conference-content"
import { conferenceCategoryColors, openingGradients } from "@/lib/opening-gradients"
import { conferenceStepFromPath, type ConferenceStep } from "@/lib/opening-steps"

function HeartSelectContent() {
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<ConferenceCategory["key"] | null>(null)
  const [pendingItemId, setPendingItemId] = useState<string | null>(null)
  const { setSelectedItemId } = useConferenceFlow()
  const navigate = useOpeningNavigate()
  const category = conferenceCategories.find((c) => c.key === selectedCategoryKey)

  const handleConfirm = () => {
    if (!pendingItemId) return
    setSelectedItemId(pendingItemId)
    navigate("/opening/conference/verse-and-prayer")
  }

  // min-h-full（不是 h-full）：標題換行變兩行時容器可以長高，不會把下面的
  // 選項清單／按鈕硬擠出可視範圍（見 conference-welcome-step.tsx 的完整說明）。
  return (
    <div className="flex min-h-full flex-col gap-6 px-6 py-8 text-center">
      <h2 className="font-heading text-2xl font-bold sm:text-3xl">什麼事情，是你最需要勇氣去面對的？</h2>

      <div className="min-h-0 flex-1">
        {!category ? (
          <div className="grid h-full grid-cols-2 grid-rows-2 gap-3 sm:gap-4">
            {conferenceCategories.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => {
                  setSelectedCategoryKey(cat.key)
                  setPendingItemId(null)
                }}
                className="flex min-h-0 flex-col items-center justify-center gap-2 rounded-2xl border p-3 text-base leading-snug font-semibold sm:p-4 sm:text-lg"
                style={{
                  borderColor: conferenceCategoryColors[cat.key],
                  color: conferenceCategoryColors[cat.key],
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                setSelectedCategoryKey(null)
                setPendingItemId(null)
              }}
              className="self-start text-sm text-white/60"
            >
              ‹ 返回類別
            </button>
            {category.items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setPendingItemId(item.id)}
                className="rounded-2xl border p-4 text-lg leading-snug font-semibold"
                style={{
                  borderColor: conferenceCategoryColors[category.key],
                  color: conferenceCategoryColors[category.key],
                  backgroundColor:
                    pendingItemId === item.id ? `${conferenceCategoryColors[category.key]}26` : undefined,
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <Button size="lg" disabled={!pendingItemId} onClick={handleConfirm}>
        確認
      </Button>
    </div>
  )
}

export function ConferenceHeartSelectStep({
  onStepChange,
}: {
  onStepChange: (step: ConferenceStep) => void
}) {
  return (
    <OpeningTransitionProvider onNavigate={(path) => onStepChange(conferenceStepFromPath(path))}>
      <ImmersiveScreen
        background={{ type: "shader", colors: openingGradients.conferenceHeartSelect }}
        enableTapZones={false}
        enableSwipe={false}
        totalSteps={1}
        onBack={() => onStepChange("welcome")}
      >
        <HeartSelectContent />
      </ImmersiveScreen>
    </OpeningTransitionProvider>
  )
}
