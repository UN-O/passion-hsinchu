"use client"

import { useState } from "react"
import Image from "next/image"
import { X } from "lucide-react"

import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog"
import type { CampZoneScreen } from "@/lib/opening-camp-content"

// 首頁三區 icon：點一個就彈出那一區的介紹（跟 camp-sidebar.tsx 聚會流程表
// 同一套「滿版圖片、不跳頁」的彈窗互動）。圖是區長提供的完整介紹圖
// （posterImage，見 lib/opening-camp-content.ts），不是文字內容。
export function CampZoneIcons({ zones }: { zones: CampZoneScreen[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const activeZone = activeIndex !== null ? zones[activeIndex] : null

  return (
    <>
      {/* grid-cols-3 讓三個 icon 各佔容器寬度的三分之一，跟著螢幕寬度等比例
          縮放（不是固定的 size-20/24 px 值），最左／最右 icon 的外緣直接
          貼齊容器（跟下面「距離開場聚會」那些卡片同一個 max-w-2xl px-[6%]
          容器）左右邊界，不是置中一小叢。 */}
      <div className="mt-10 grid grid-cols-3 gap-4">
        {zones.map((zone, index) => (
          <button
            key={zone.title}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={`${zone.title}介紹`}
            className="mx-auto w-full max-w-32"
          >
            <Image
              src={zone.icon}
              alt={zone.title}
              width={120}
              height={120}
              className="aspect-square w-full rounded-full object-cover"
            />
          </button>
        ))}
      </div>

      <Dialog open={activeZone !== null} onOpenChange={(next) => !next && setActiveIndex(null)}>
        <DialogContent
          showCloseButton={false}
          className="camp-theme max-w-[calc(100%-2rem)] gap-0 overflow-hidden rounded-3xl border-none bg-transparent p-0 sm:max-w-md"
        >
          <DialogTitle className="sr-only">{activeZone?.title}</DialogTitle>
          <DialogClose className="absolute top-2 right-2 z-10 rounded-full bg-black/50 p-1 text-white/90 backdrop-blur-sm hover:text-white">
            <X className="size-5" />
            <span className="sr-only">關閉</span>
          </DialogClose>

          {activeZone && (
            <Image
              src={activeZone.posterImage}
              alt={activeZone.title}
              width={3600}
              height={2025}
              className="block h-auto w-full"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
