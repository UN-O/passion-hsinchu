"use client"

import { useState } from "react"
import Image from "next/image"
import { X } from "lucide-react"

import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog"
import type { CampZoneScreen } from "@/lib/opening-camp-content"
import { genRyuMin } from "@/app/fonts/gen-ryu-min"

// 首頁三區入口：三個 4:5 直式方框，跟 CONF 工作坊卡片同一種排版
// （conference-mission-home.tsx 的 aspect-[4/5] 卡片，border/shadow 都
// 照抄同一組數值）。點一個就彈出那一區的介紹（跟 camp-sidebar.tsx 聚會
// 流程表同一套「滿版圖片、不跳頁」的彈窗互動）。圖是區長提供的完整
// 介紹圖（posterImage，見 lib/opening-camp-content.ts），不是文字內容。
export function CampZoneIcons({ zones }: { zones: CampZoneScreen[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const activeZone = activeIndex !== null ? zones[activeIndex] : null

  return (
    <>
      {/* grid-cols-3 讓三個方框各佔容器寬度的三分之一，跟著螢幕寬度等比例
          縮放，最左／最右方框的外緣直接貼齊容器（跟下面「距離開場聚會」
          那些卡片同一個 max-w-2xl px-[6%] 容器）左右邊界。 */}
      <div className="mt-10 grid grid-cols-3 gap-3">
        {zones.map((zone, index) => (
          <button
            key={zone.title}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={`${zone.title}介紹`}
            className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-white/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),0_1px_4px_rgba(0,0,0,0.12)]"
          >
            <Image
              src={zone.cardImage}
              alt={zone.title}
              fill
              sizes="(min-width: 640px) 151px, 33vw"
              className="object-cover"
            />
          </button>
        ))}
      </div>

      <Dialog open={activeZone !== null} onOpenChange={(next) => !next && setActiveIndex(null)}>
        {/* max-h + overflow-y-auto：海報圖＋文字介紹疊起來比彈窗高，小螢幕
            手機要能捲動看完，不會被切掉（跟 camp-countdown-card.tsx 的
            「營會資訊」彈窗同一個修法）。rounded-t-3xl 的 overflow-hidden
            放在圖片自己的容器，不是外層——外層才能保留 overflow-y-auto。 */}
        <DialogContent
          showCloseButton={false}
          className="camp-theme flex max-h-[85vh] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-y-auto rounded-3xl border-none bg-card p-0 sm:max-w-md"
        >
          <DialogTitle className="sr-only">{activeZone?.title}</DialogTitle>
          <DialogClose className="absolute top-2 right-2 z-10 rounded-full bg-black/50 p-1 text-white/90 backdrop-blur-sm hover:text-white">
            <X className="size-5" />
            <span className="sr-only">關閉</span>
          </DialogClose>

          {activeZone && (
            <>
              <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-t-3xl">
                <Image
                  src={activeZone.posterImage}
                  alt={activeZone.title}
                  fill
                  sizes="(min-width: 640px) 448px, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col gap-2 p-6">
                <p className="text-sm text-muted-foreground">區長：{activeZone.leaderName}</p>
                <p className="text-base">{activeZone.body}</p>
                <p
                  className={`${genRyuMin.className} w-[min(74%,28rem)] text-base`}
                  style={{ transform: "skewX(-5deg)" }}
                >
                  「{activeZone.quote}」
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
