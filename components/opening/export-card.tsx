"use client"

import { forwardRef, useMemo } from "react"
import { CanvasBackground } from "@/components/immersive/backgrounds/canvas-background"
import { versePrayerCategoryDraw } from "@/lib/opening-gradients"

type ExportCardProps = {
  label: string
  verse: string
  verseRef?: string
  categoryKey?: "A" | "B" | "C" | "D"
}

// 畫面上不顯示這個框限的樣子，只有匯出圖片時才用這個固定 4:5 直式節點擷取。
// 寬度固定 540px：downloadNodeAsImage 用 pixelRatio 2 擷取，540×2=1080、
// 540×1.25×2=1350，剛好是規定的 1080×1350 輸出尺寸。
export const ExportCard = forwardRef<HTMLDivElement, ExportCardProps>(function ExportCard(
  { label, verse, verseRef, categoryKey },
  ref
) {
  // 一定要 useMemo：draw 沒記住的話，ExportCard 每次重繪都會產生新的函式
  // 參照，CanvasBackground 的 useEffect（deps 是 [draw, reducedMotion]）
  // 就會整個拆掉重建——resize() 會先把 canvas 清空（設 canvas.width 這個
  // 動作本身就會清畫面），要等下一個 requestAnimationFrame 才會重新畫上
  // 漸層。這段卡片平常藏在畫面外、不會有人剛好在那個空白瞬間截圖，但
  // 「儲存圖片」是使用者主動點擊觸發 toBlob，如果剛好點在清空之後、還沒
  // 畫回來之前，擷取到的就是空白畫布——這正是使用者回報「存出來的圖沒有
  // 背景、白底白字」的成因。跟 verse-prayer-step.tsx 裡同一個
  // versePrayerCategoryDraw(category?.key) 呼叫已經用 useMemo 包起來的
  // 做法一致，這裡漏掉了。
  const draw = useMemo(() => versePrayerCategoryDraw(categoryKey), [categoryKey])

  return (
    <div ref={ref} className="relative aspect-[4/5] w-[540px] overflow-hidden">
      <div className="absolute inset-0">
        <CanvasBackground draw={draw} />
      </div>
      <div className="relative flex h-full flex-col items-center justify-center gap-4 p-12 text-center text-white">
        <p className="text-sm tracking-[0.2em] text-white/70">{label}</p>
        {/* w-full：flex-col + items-center 下，子元素預設用內容本身需要的寬度
            算大小、不是照容器實際寬度撐開，長文字會整行不換行、左右對稱溢出
            （跟 conference-verse-prayer-step.tsx 同一段文字、同一個問題）。
            break-all 是額外保險：這段是純中文長句，中間逗號句號之間常常沒有
            半形空格，用 break-all 讓每個中文字都可以是斷行點。 */}
        <p className="w-full text-2xl leading-relaxed break-all">{verse}</p>
        {verseRef && <p className="text-base text-white/70">（{verseRef}）</p>}
      </div>
    </div>
  )
})
