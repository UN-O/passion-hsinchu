"use client"

import { forwardRef } from "react"
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
  return (
    <div ref={ref} className="relative aspect-[4/5] w-[540px] overflow-hidden">
      <div className="absolute inset-0">
        <CanvasBackground draw={versePrayerCategoryDraw(categoryKey)} />
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
