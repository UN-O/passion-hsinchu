"use client"

import { useState } from "react"
import Image from "next/image"
import { X } from "lucide-react"

import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { mantouSans } from "@/app/fonts/mantou-sans"
import type { CampZoneScreen } from "@/lib/opening-camp-content"

// 首頁三區 icon：點一個就彈出那一區的介紹（跟 camp-sidebar.tsx／
// camp-countdown-card.tsx 同一套彈窗互動，不跳頁）。內容沿用 onboarding
// 「介紹 3 區」那一步的同一份資料（campZoneScreens），現在還是佔位文字，
// 之後使用者提供正式介紹內容時只要改 lib/opening-camp-content.ts。
export function CampZoneIcons({ zones }: { zones: CampZoneScreen[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const activeZone = activeIndex !== null ? zones[activeIndex] : null

  return (
    <>
      <div className="mt-10 flex items-center justify-center gap-6">
        {zones.map((zone, index) => (
          <button
            key={zone.title}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={`${zone.title}介紹`}
          >
            <Image
              src={zone.icon}
              alt={zone.title}
              width={120}
              height={120}
              className="size-20 rounded-full sm:size-24"
            />
          </button>
        ))}
      </div>

      <Dialog open={activeZone !== null} onOpenChange={(next) => !next && setActiveIndex(null)}>
        <DialogContent
          showCloseButton={false}
          className="camp-theme flex max-w-[calc(100%-2rem)] flex-col items-center gap-3 rounded-3xl border-none bg-card p-6 text-center sm:max-w-sm"
        >
          <DialogTitle className="sr-only">{activeZone?.title}</DialogTitle>
          <DialogClose className="absolute top-4 right-4 z-10 rounded-full bg-black/50 p-1 text-white/90 backdrop-blur-sm hover:text-white">
            <X className="size-5" />
            <span className="sr-only">關閉</span>
          </DialogClose>

          {activeZone && (
            <>
              <Image
                src={activeZone.icon}
                alt={activeZone.title}
                width={120}
                height={120}
                className="size-20 rounded-full"
              />
              <h2 className={`${mantouSans.className} text-xl sm:text-2xl`}>{activeZone.title}</h2>
              <p className="text-muted-foreground">{activeZone.body}</p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
