"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ImmersiveScreen } from "@/components/immersive/immersive-screen"
import { useOpeningStepAdvance } from "@/hooks/use-opening-step-advance"
import { useConferenceFlow } from "@/components/opening/conference-flow-context"
import { conferenceCategories, type ConferenceCategory } from "@/lib/opening-conference-content"
import { conferenceCategoryColors, openingGradients } from "@/lib/opening-gradients"

function HeartSelectContent() {
  const [selectedKey, setSelectedKey] = useState<ConferenceCategory["key"] | null>(null)
  const { setSelectedItemId } = useConferenceFlow()
  const advance = useOpeningStepAdvance("/opening/conference/verse-and-prayer")
  const category = conferenceCategories.find((c) => c.key === selectedKey)

  if (!category) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-8 px-6 text-center">
        <h2 className="text-2xl font-bold sm:text-3xl">什麼事情，是你最需要勇氣去面對的？</h2>
        <div className="grid w-full max-w-sm grid-cols-2 gap-4">
          {conferenceCategories.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setSelectedKey(cat.key)}
              className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border p-4 text-sm font-medium"
              style={{
                borderColor: conferenceCategoryColors[cat.key],
                color: conferenceCategoryColors[cat.key],
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-6 text-center">
      <button
        type="button"
        onClick={() => setSelectedKey(null)}
        className="self-start text-sm text-white/60"
      >
        ‹ 返回類別
      </button>
      <h2 className="text-xl font-bold sm:text-2xl">{category.label}</h2>
      <div className="flex w-full max-w-sm flex-col gap-3">
        {category.items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setSelectedItemId(item.id)
              advance()
            }}
            className="rounded-2xl border p-3 text-sm font-medium"
            style={{
              borderColor: conferenceCategoryColors[category.key],
              color: conferenceCategoryColors[category.key],
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ConferenceHeartSelectPage() {
  const router = useRouter()

  return (
    <ImmersiveScreen
      background={{ type: "shader", colors: openingGradients.conferenceHeartSelect }}
      enableTapZones={false}
      enableSwipe={false}
      onBack={() => router.push("/opening/conference/welcome")}
    >
      <HeartSelectContent />
    </ImmersiveScreen>
  )
}
