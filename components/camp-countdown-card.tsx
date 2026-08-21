"use client"

import { useState } from "react"
import Image from "next/image"
import { X } from "lucide-react"

import { ConferenceCountdown } from "@/components/conference-countdown"
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { camp } from "@/lib/site-config"
import { getNextCampSession } from "@/lib/opening-camp-content"

// 跟 CONF 那張「下場聚會倒數」卡片同樣的樣式跟互動：點下去彈出資訊視窗，
// 圖片＋標籤／標題／日期／時間同一種排版。標籤文字跟倒數目標都是「下一場
// 還沒開始的聚會」（campSessions／getNextCampSession，跟 CONF 的
// getNextConferenceSession 同一套邏輯）。視覺依場次換成 nextSession.image，
// 外層卡片維持液態玻璃質感（跟「小隊分數」「各區積分」那兩張卡片同一套視覺）。
export function CampCountdownCard() {
  const [open, setOpen] = useState(false)
  const nextSession = getNextCampSession()

  return (
    <>
      <div className="camp-glass-card mt-6 rounded-3xl border-2 border-white/50 bg-[radial-gradient(120%_100%_at_25%_15%,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.06)_35%,rgba(191,219,254,0.05)_70%,rgba(255,255,255,0.08)_100%)] p-4 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-3px_4px_rgba(30,64,124,0.14),0_16px_40px_rgba(0,0,0,0.22)]">
        <p className="font-[family-name:var(--font-noto-jp)] text-lg font-bold text-muted-foreground">
          距離{nextSession.label}開始，還剩...
        </p>

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="營會資訊"
          className="relative mt-3 aspect-video w-full overflow-hidden rounded-2xl"
        >
          <Image
            src={nextSession.image}
            alt={`${nextSession.label}視覺`}
            fill
            sizes="(min-width: 640px) 640px, 100vw"
            className="object-cover"
            style={{ objectPosition: "50% 30%" }}
          />
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
            <ConferenceCountdown targetISO={nextSession.startISO} />
          </div>
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="camp-theme flex max-w-[calc(100%-2rem)] flex-col gap-0 rounded-3xl border-none bg-card p-0 sm:max-w-md"
        >
          <DialogTitle className="sr-only">營會資訊</DialogTitle>
          <DialogClose className="absolute top-4 right-4 z-10 text-white/80 hover:text-white">
            <X className="size-5" />
            <span className="sr-only">關閉</span>
          </DialogClose>

          {/* 彈窗頭圖用有字版 nextSession.infoImage（跟卡片／倒數計時縮圖用的
              無字版 image 是不同兩張圖）。overflow-hidden 放在這裡（不是外層
              DialogContent）只裁圖片本身的圓角，外層才能保留 overflow-y-auto
              讓內容過長時可以捲動，不會在小螢幕手機上被切掉或壓扁變形
              （跟 conference-mission-home.tsx 同一個修法）。 */}
          <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-t-3xl">
            <Image
              src={nextSession.infoImage}
              alt={`${nextSession.label}視覺`}
              fill
              sizes="(min-width: 640px) 448px, 100vw"
              className="object-cover"
              style={{ objectPosition: "50% 30%" }}
            />
          </div>

          <div className="flex flex-col gap-2 p-6">
            <p className="text-sm text-muted-foreground">營會資訊</p>
            <p className="text-xl font-bold">{camp.label}</p>
            <p className="text-base">
              {camp.dateLabel}（{camp.durationLabel}）
            </p>
            <p className="text-sm text-muted-foreground">{camp.timeEntries.join("・")}</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
