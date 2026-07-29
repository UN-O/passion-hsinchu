"use client"

import { forwardRef } from "react"
import { CanvasBackground } from "@/components/immersive/backgrounds/canvas-background"
import { versePrayerCanvasDraw } from "@/lib/opening-gradients"

type ExportCardProps = {
  label: string
  verse: string
  verseRef?: string
}

export const ExportCard = forwardRef<HTMLDivElement, ExportCardProps>(function ExportCard(
  { label, verse, verseRef },
  ref
) {
  return (
    <div ref={ref} className="relative aspect-[5/4] w-full max-w-sm overflow-hidden rounded-2xl">
      <div className="absolute inset-0">
        <CanvasBackground draw={versePrayerCanvasDraw} />
      </div>
      <div className="relative flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-white">
        <p className="text-xs tracking-[0.2em] text-white/70">{label}</p>
        <p className="text-base leading-relaxed">{verse}</p>
        {verseRef && <p className="text-sm text-white/70">（{verseRef}）</p>}
      </div>
    </div>
  )
})
