"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ImmersiveScreen } from "@/components/immersive/immersive-screen"
import { useImmersiveNav } from "@/components/immersive/immersive-nav-context"
import { useConferenceFlow } from "@/components/opening/conference-flow-context"
import { getVersePrayerContent } from "@/lib/opening-conference-content"
import { versePrayerCanvasDraw } from "@/lib/opening-gradients"
import { ExportCard } from "@/components/opening/export-card"
import { downloadNodeAsImage } from "@/lib/export-image"
import { Button } from "@/components/ui/button"

const SEGMENT_DURATION_MS = 30000

function VersePrayerContent({ name, selectedItemId }: { name: string; selectedItemId: string }) {
  const { index } = useImmersiveNav()
  const exportRef = useRef<HTMLDivElement>(null)
  const content = getVersePrayerContent(selectedItemId)

  if (!content) return null

  const trimmedName = Array.from(name).slice(1).join("")
  const prayerText = content.prayerTemplate.replaceAll("{}", trimmedName)
  const isVersePage = index === 0

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 overflow-y-auto px-6 py-8 text-center">
      <ExportCard
        ref={exportRef}
        label={isVersePage ? "經文" : "這是我們給你的禱告"}
        verse={isVersePage ? content.verse : prayerText}
        verseRef={isVersePage ? content.verseRef : undefined}
      />
      <Button
        variant="outline"
        onClick={() => downloadNodeAsImage(exportRef.current, `passion-${content.itemId}-${index}.png`)}
      >
        儲存圖片
      </Button>
    </div>
  )
}

export function VersePrayerScreen({ name }: { name: string }) {
  const router = useRouter()
  const { selectedItemId } = useConferenceFlow()
  const [index, setIndex] = useState(0)
  const missingItem = !selectedItemId

  useEffect(() => {
    if (missingItem) router.replace("/opening/conference/heart-select")
  }, [missingItem, router])

  if (missingItem) return null

  return (
    <ImmersiveScreen
      background={{ type: "canvas", draw: versePrayerCanvasDraw }}
      enableTapZones={false}
      enableSwipe={false}
      totalSteps={2}
      index={index}
      onIndexChange={setIndex}
      progress={{
        mode: "auto",
        durationMs: SEGMENT_DURATION_MS,
        onSegmentComplete: () => {
          if (index === 1) router.push("/opening/conference/onboarding")
        },
      }}
      onBack={() =>
        index === 0 ? router.push("/opening/conference/heart-select") : setIndex(index - 1)
      }
    >
      <VersePrayerContent name={name} selectedItemId={selectedItemId as string} />
    </ImmersiveScreen>
  )
}
