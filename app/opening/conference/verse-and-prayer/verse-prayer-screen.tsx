"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ImmersiveScreen } from "@/components/immersive/immersive-screen"
import { useImmersiveNav } from "@/components/immersive/immersive-nav-context"
import { useOpeningStepAdvance } from "@/hooks/use-opening-step-advance"
import { useConferenceFlow } from "@/components/opening/conference-flow-context"
import { getCategoryForItem, getVersePrayerContent } from "@/lib/opening-conference-content"
import { versePrayerCategoryDraw } from "@/lib/opening-gradients"
import { ExportCard } from "@/components/opening/export-card"
import { downloadNodeAsImage } from "@/lib/export-image"
import { Button } from "@/components/ui/button"
import { FadeTransitionOverlay } from "@/components/opening/fade-transition-overlay"

function VersePrayerContent({
  name,
  selectedItemId,
  categoryKey,
}: {
  name: string
  selectedItemId: string
  categoryKey?: "A" | "B" | "C" | "D"
}) {
  const { index } = useImmersiveNav()
  const advance = useOpeningStepAdvance("/opening/conference/onboarding")
  const exportRef = useRef<HTMLDivElement>(null)
  const content = getVersePrayerContent(selectedItemId)

  if (!content) return null

  const trimmedName = Array.from(name).slice(1).join("")
  const prayerText = content.prayerTemplate.replaceAll("{}", trimmedName)
  const isVersePage = index === 0
  const label = isVersePage ? "經文" : "這是我們給你的禱告"
  const bodyText = isVersePage ? content.verse : prayerText

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 overflow-y-auto px-6 py-10 text-center">
      <p className="text-sm tracking-[0.2em] text-white/60">{label}</p>
      <p className="max-w-md text-xl leading-loose sm:text-2xl">{bodyText}</p>
      {isVersePage && <p className="text-base text-white/70">（{content.verseRef}）</p>}

      <div className="flex gap-3">
        {!isVersePage && (
          <Button
            variant="outline"
            onClick={() => downloadNodeAsImage(exportRef.current, `passion-${content.itemId}.png`)}
          >
            儲存圖片
          </Button>
        )}
        <Button size="lg" onClick={advance}>
          下一步
        </Button>
      </div>

      {/* 畫面上不顯示框限樣式，這個節點永遠隱藏在畫面外，只有按下「儲存圖片」時才拿去擷取成 4:5 直式圖片 */}
      <div className="pointer-events-none fixed top-0 -left-[9999px]" aria-hidden>
        <ExportCard ref={exportRef} label={label} verse={bodyText} verseRef={isVersePage ? content.verseRef : undefined} categoryKey={categoryKey} />
      </div>
    </div>
  )
}

export function VersePrayerScreen({ name }: { name: string }) {
  const router = useRouter()
  const { selectedItemId } = useConferenceFlow()
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const missingItem = !selectedItemId
  const category = selectedItemId ? getCategoryForItem(selectedItemId) : undefined
  const draw = useMemo(() => versePrayerCategoryDraw(category?.key), [category?.key])

  useEffect(() => {
    if (missingItem) {
      router.replace("/opening/conference/heart-select")
      return
    }
    const id = setTimeout(() => setRevealed(true), 60)
    return () => clearTimeout(id)
  }, [missingItem, router])

  if (missingItem) return null

  return (
    <>
      <ImmersiveScreen
        background={{ type: "canvas", draw }}
        enableTapZones={false}
        enableSwipe={false}
        totalSteps={2}
        index={index}
        onIndexChange={setIndex}
        progress={{ mode: "manual", value: 0 }}
        onBack={() =>
          index === 0 ? router.push("/opening/conference/heart-select") : setIndex(index - 1)
        }
      >
        <VersePrayerContent name={name} selectedItemId={selectedItemId as string} categoryKey={category?.key} />
      </ImmersiveScreen>
      <FadeTransitionOverlay active={!revealed} />
    </>
  )
}
