"use client"

import { useEffect, useMemo, useState } from "react"
import { ImmersiveScreen } from "@/components/immersive/immersive-screen"
import { useImmersiveNav } from "@/components/immersive/immersive-nav-context"
import { useOpeningStepAdvance } from "@/hooks/use-opening-step-advance"
import { useConferenceFlow } from "@/components/opening/conference-flow-context"
import { getCategoryForItem, getVersePrayerContent } from "@/lib/opening-conference-content"
import { genRyuMin } from "@/app/fonts/gen-ryu-min"
import { versePrayerCategoryDraw } from "@/lib/opening-gradients"
import { downloadConferenceExportCard } from "@/lib/export-conference-card"
import { Button } from "@/components/ui/button"
import { OpeningTransitionProvider } from "@/components/opening/opening-transition"
import { conferenceStepFromPath, type ConferenceStep } from "@/lib/opening-steps"
import { completeOpening } from "@/app/opening/actions"

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
  // 經文禱告卡結束後直接完成開場（不再進工作坊介紹頁），所以這裡不需要
  // nextRoute——最後一頁改用下面的「完成」表單直接送出，不是靠 advance()
  // 導頁過去。
  const advance = useOpeningStepAdvance(null)
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
      {/* w-[min(74%,28rem)]：跟 camp-mission-home.tsx／camp-devotion-content.tsx
          同一個做法，佔容器寬度的 74%、但不超過 28rem，比單純 w-full 更貼近
          內文本身的視覺重量。字體用源流明體 Bold（genRyuMin），字型檔已經
          用 fonttools 重新跑過 subset，涵蓋這裡全部經文／禱告文範本的字
          （見 app/fonts/gen-ryu-min.ts 的說明）；範本裡 {"{}"} 代入的使用者
          姓名是動態內容、字沒辦法預先收進字型檔，缺字的字元會自動退回
          瀏覽器預設的備援字型，不影響其餘文字正常顯示源流明體。
          原本用 break-all 讓每個字都能是斷行點，但 break-all 連中文字本身
          的正常斷行規則都繞過去了，會在完全不相關的兩個字中間硬斷（例如
          「只定 / 睛在」，把「定睛」這種詞從中間切開），比沒有 break-all
          更難讀。改成 overflow-wrap:break-word（只在真的需要時，例如姓名
          帶的一長串英文，才強制斷行）+ text-wrap:pretty（瀏覽器自己找比較
          好的斷行點，會優先斷在逗號、句號後面，不會斷在詞語中間）——實測用
          臨時測試頁面比對過，這個組合會準確落在「只是看著環境，」後面才
          換行，不會再切開「定睛」兩個字。 */}
      <p
        className={`${genRyuMin.className} w-[min(74%,28rem)] text-xl leading-loose sm:text-2xl`}
        style={{ overflowWrap: "break-word", textWrap: "pretty" }}
      >
        {bodyText}
      </p>
      {isVersePage && <p className="text-base text-white/70">（{content.verseRef}）</p>}

      <div className="flex gap-3">
        {!isVersePage && (
          <Button
            variant="outline"
            onClick={() =>
              downloadConferenceExportCard(
                { label, verse: bodyText, verseRef: isVersePage ? content.verseRef : undefined, categoryKey },
                `passion-${content.itemId}.png`
              )
            }
          >
            儲存圖片
          </Button>
        )}
        {isVersePage ? (
          <Button size="lg" onClick={advance}>
            下一步
          </Button>
        ) : (
          <form action={completeOpening}>
            <input type="hidden" name="flow" value="conference" />
            <Button size="lg" type="submit">
              完成
            </Button>
          </form>
        )}
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
