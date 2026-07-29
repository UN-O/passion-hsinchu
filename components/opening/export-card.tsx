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

// 畫面上不顯示這個框限的樣子，只有匯出圖片時才用這個固定 4:5 直式節點擷取
export const ExportCard = forwardRef<HTMLDivElement, ExportCardProps>(function ExportCard(
  { label, verse, verseRef, categoryKey },
  ref
) {
  return (
    <div ref={ref} className="relative aspect-[4/5] w-[640px] overflow-hidden">
      <div className="absolute inset-0">
        <CanvasBackground draw={versePrayerCategoryDraw(categoryKey)} />
      </div>
      <div className="relative flex h-full flex-col items-center justify-center gap-4 p-12 text-center text-white">
        <p className="text-sm tracking-[0.2em] text-white/70">{label}</p>
        <p className="text-2xl leading-relaxed">{verse}</p>
        {verseRef && <p className="text-base text-white/70">（{verseRef}）</p>}
      </div>
    </div>
  )
})
