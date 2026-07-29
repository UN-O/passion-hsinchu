"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ImmersiveScreen } from "@/components/immersive/immersive-screen"
import { Button } from "@/components/ui/button"
import { useConferenceFlow } from "@/components/opening/conference-flow-context"
import { FadeTransitionOverlay } from "@/components/opening/fade-transition-overlay"
import { conferenceCategories, type ConferenceCategory } from "@/lib/opening-conference-content"
import { conferenceCategoryColors, openingGradients } from "@/lib/opening-gradients"

const TRANSITION_MS = 500

function HeartSelectContent({ onConfirm }: { onConfirm: () => void }) {
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<ConferenceCategory["key"] | null>(null)
  const [pendingItemId, setPendingItemId] = useState<string | null>(null)
  const { setSelectedItemId } = useConferenceFlow()
  const category = conferenceCategories.find((c) => c.key === selectedCategoryKey)

  const handleConfirm = () => {
    if (!pendingItemId) return
    setSelectedItemId(pendingItemId)
    onConfirm()
  }

  return (
    <div className="flex h-full flex-col gap-6 px-6 py-8 text-center">
      <h2 className="text-2xl font-bold sm:text-3xl">什麼事情，是你最需要勇氣去面對的？</h2>

      <div className="flex-1 overflow-y-auto">
        {!category ? (
          <div className="grid grid-cols-2 gap-4">
            {conferenceCategories.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => {
                  setSelectedCategoryKey(cat.key)
                  setPendingItemId(null)
                }}
                className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border p-4 text-lg leading-snug font-semibold"
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

export default function ConferenceHeartSelectPage() {
  const router = useRouter()
  const [transitioning, setTransitioning] = useState(false)

  const handleConfirm = () => {
    setTransitioning(true)
    setTimeout(() => router.push("/opening/conference/verse-and-prayer"), TRANSITION_MS)
  }

  return (
    <>
      <ImmersiveScreen
        background={{ type: "shader", colors: openingGradients.conferenceHeartSelect }}
        enableTapZones={false}
        enableSwipe={false}
        totalSteps={1}
        onBack={() => router.push("/opening/conference/welcome")}
      >
        <HeartSelectContent onConfirm={handleConfirm} />
      </ImmersiveScreen>
      <FadeTransitionOverlay active={transitioning} />
    </>
  )
}
