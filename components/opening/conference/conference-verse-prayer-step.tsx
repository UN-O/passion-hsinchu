"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ImmersiveScreen } from "@/components/immersive/immersive-screen"
import { useImmersiveNav } from "@/components/immersive/immersive-nav-context"
import { useOpeningStepAdvance } from "@/hooks/use-opening-step-advance"
import { useConferenceFlow } from "@/components/opening/conference-flow-context"
import { getCategoryForItem, getVersePrayerContent } from "@/lib/opening-conference-content"
import { versePrayerCategoryDraw } from "@/lib/opening-gradients"
import { ExportCard } from "@/components/opening/export-card"
import { downloadNodeAsImage } from "@/lib/export-image"
import { Button } from "@/components/ui/button"
import { OpeningTransitionProvider } from "@/components/opening/opening-transition"
import { conferenceStepFromPath, type ConferenceStep } from "@/lib/opening-steps"

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

  // min-h-full（不是 h-full）：經文／禱告文字通常比較長，換行變多行時
  // justify-center 溢出的部分不會被藏到捲動容器最上緣（見
  // conference-welcome-step.tsx 的完整說明）。原本這裡自己另外加了一層
  // overflow-y-auto，其實是同一個問題硬用捲動蓋過去，現在容器會直接長高，
  // 交給 ImmersiveScreen 外層那個既有的捲動容器處理就好，不用疊兩層。
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-8 px-6 py-10 text-center">
      <p className="text-sm tracking-[0.2em] text-white/60">{label}</p>
      {/* w-full：flex-col + items-center 下，子元素預設用內容本身需要的寬度
          算大小、不是照容器實際寬度撐開，長文字會整行不換行、左右對稱溢出
          畫面外。break-all 是額外保險：這段是純中文長句，逗號句號之間常常
          沒有半形空格，用 break-all 讓每個中文字都可以是斷行點。 */}
      <p className="w-full max-w-md text-xl leading-loose break-all sm:text-2xl">{bodyText}</p>
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

      {/* 用 opacity-0 而不是移到畫面外：手機瀏覽器（尤其 iOS Safari）會把定位在可視範圍外的 canvas 內容釋放掉，
          等按下「儲存圖片」擷取時就會拿到空白圖片。opacity-0 讓節點仍在畫面範圍內、canvas 保持有內容，但視覺上看不到。 */}
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-0" aria-hidden>
        <ExportCard ref={exportRef} label={label} verse={bodyText} verseRef={isVersePage ? content.verseRef : undefined} categoryKey={categoryKey} />
      </div>
    </div>
  )
}

export function ConferenceVersePrayerStep({
  name,
  onStepChange,
}: {
  name: string
  onStepChange: (step: ConferenceStep) => void
}) {
  const { selectedItemId } = useConferenceFlow()
  const [index, setIndex] = useState(0)
  const missingItem = !selectedItemId
  const category = selectedItemId ? getCategoryForItem(selectedItemId) : undefined
  const draw = useMemo(() => versePrayerCategoryDraw(category?.key), [category?.key])

  useEffect(() => {
    if (missingItem) onStepChange("heart-select")
  }, [missingItem, onStepChange])

  if (missingItem) return null

  return (
    <OpeningTransitionProvider onNavigate={(path) => onStepChange(conferenceStepFromPath(path))}>
      <ImmersiveScreen
        background={{ type: "canvas", draw }}
        enableTapZones={false}
        enableSwipe={false}
        totalSteps={2}
        index={index}
        onIndexChange={setIndex}
        progress={{ mode: "manual", value: 0 }}
        onBack={() => (index === 0 ? onStepChange("heart-select") : setIndex(index - 1))}
      >
        <VersePrayerContent name={name} selectedItemId={selectedItemId as string} categoryKey={category?.key} />
      </ImmersiveScreen>
    </OpeningTransitionProvider>
  )
}
