"use client"

import { useState } from "react"
import { X } from "lucide-react"

import { ConferenceCountdown } from "@/components/conference-countdown"
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { camp } from "@/lib/site-config"

// 跟 CONF 那張「下場聚會倒數」卡片同樣的樣式跟互動：點下去彈出資訊視窗，
// 圖片＋標籤／標題／日期／時間同一種排版。CAMP 目前沒有逐場聚會的資料，
// 這裡先用整個營會的資訊頂著，也還沒有真的視覺照片，先用色塊佔位。
export function CampCountdownCard() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="mt-6 rounded-3xl bg-slate-300 p-6">
        <p className="font-[family-name:var(--font-noto-jp)] text-lg font-bold text-black/70">
          距離營會開始還剩...
        </p>

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="營會資訊"
          className="relative mt-3 aspect-video w-full overflow-hidden rounded-2xl bg-slate-400"
        >
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
            <ConferenceCountdown targetISO={camp.startDateISO} />
          </div>
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="camp-theme max-w-[calc(100%-2rem)] gap-0 overflow-hidden rounded-3xl border-none bg-card p-0 sm:max-w-md"
        >
          <DialogTitle className="sr-only">營會資訊</DialogTitle>
          <DialogClose className="absolute top-4 right-4 z-10 text-white/80 hover:text-white">
            <X className="size-5" />
            <span className="sr-only">關閉</span>
          </DialogClose>

          {/* 還沒有真的營會視覺照片，先用色塊佔位 */}
          <div className="aspect-video w-full bg-slate-400" />

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
