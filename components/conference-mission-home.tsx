"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { X } from "lucide-react"

import { ConferenceCountdown } from "@/components/conference-countdown"
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { conferenceWorkshops, getConferenceWorkshop } from "@/lib/opening-conference-content"
import { conference } from "@/lib/site-config"

// 聚會場次的詳細內容目前沒有 CMS 可以管理，先用整場特會第一天的時間佔位，
// 等聚會排程資料表定案後改成真的「下一場聚會」資訊。
const PLACEHOLDER_MEETING_DAY_LABEL = "DAY1 聚會"
const PLACEHOLDER_MEETING_TITLE = "聚會標題"

export function ConferenceMissionHome({
  meetingHref = "/conference/meeting",
}: {
  meetingHref?: string
} = {}) {
  const [activeWorkshopId, setActiveWorkshopId] = useState<string | null>(null)
  const activeWorkshop = activeWorkshopId ? getConferenceWorkshop(activeWorkshopId) : undefined

  return (
    <main className="min-h-svh bg-[#feed74] pb-16">
      <div className="mx-auto max-w-2xl">
        {/* 主視覺四邊留空間，跟下面工作坊／聚會場次同一層 px 內距，不貼齊螢幕邊緣 */}
        <div className="sticky top-0 z-10 bg-[#feed74] px-4 py-4 sm:px-6">
          <Image
            src="/images/conference-hero-wordmark.png"
            alt="THE COURAGE GENERATIONS 勇者世代"
            width={2000}
            height={302}
            priority
            className="h-auto w-full"
          />
        </div>

        <div className="px-4 pt-6 sm:px-6">
          <Image
            src="/images/conference-slogan.png"
            alt="我們相信，每個人都會在這裡遇見神。WE BELIEVE EVERYONE WILL EXPERIENCE GOD'S PRESENCE HERE."
            width={1200}
            height={126}
            className="h-auto w-[70%]"
          />

          {/* 工作坊主視覺尚未提供圖片，先用純色塊佔位。點卡片彈出視窗顯示介紹，不跳頁。 */}
          <div
            className="mt-6 flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ scrollSnapType: "x mandatory" }}
          >
            {conferenceWorkshops.map((workshop, index) => (
              <button
                key={workshop.id}
                type="button"
                onClick={() => setActiveWorkshopId(workshop.id)}
                aria-label={workshop.title}
                className="flex aspect-[4/5] w-[118px] shrink-0 items-end rounded-3xl bg-[#3B82F6] p-3 sm:w-[151px] sm:p-4"
                style={{ scrollSnapAlign: "start" }}
              >
                <span className="text-xs font-semibold text-white/70">
                  {(index + 1).toString().padStart(2, "0")}
                </span>
              </button>
            ))}
          </div>

          {/* 聚會內容目前沒有 CMS，先放佔位文字，之後接上真正的聚會資料。
              左右邊跟工作坊那排卡片切齊（同一層 px 內距），不是貼齊螢幕邊緣。 */}
          <Link
            href={meetingHref}
            className="mt-6 flex aspect-[5/4] w-full flex-col justify-end rounded-3xl bg-[#DC2626] p-6"
          >
            <p className="text-sm text-white/80">{PLACEHOLDER_MEETING_DAY_LABEL}</p>
            <p className="mt-2 text-2xl font-bold text-white">{PLACEHOLDER_MEETING_TITLE}</p>
          </Link>

          <div className="mt-6 rounded-3xl bg-slate-300 p-6">
            <p className="text-sm font-medium text-black/70">下場聚會倒數</p>
            <ConferenceCountdown targetISO={conference.startDateISO} />
          </div>

          <div className="mt-10 flex justify-center">
            <Image
              src="/images/passion-logo.png"
              alt="PASSION®"
              width={979}
              height={178}
              className="h-6 w-auto brightness-0"
            />
          </div>
        </div>
      </div>

      <Dialog open={activeWorkshop !== undefined} onOpenChange={(next) => !next && setActiveWorkshopId(null)}>
        <DialogContent
          showCloseButton={false}
          className="max-w-[calc(100%-2rem)] gap-0 overflow-hidden rounded-3xl border-none bg-card p-0 sm:max-w-sm"
        >
          <DialogTitle className="sr-only">{activeWorkshop?.title}</DialogTitle>
          <DialogClose className="absolute top-4 right-4 z-10 text-white/80 hover:text-white">
            <X className="size-5" />
            <span className="sr-only">關閉</span>
          </DialogClose>

          {/* 工作坊主視覺尚未提供圖片，先用色塊佔位 */}
          <div className="aspect-video w-full bg-[#3B82F6]" />

          <div className="flex flex-col gap-2 p-6">
            <p className="text-sm text-muted-foreground">工作坊介紹</p>
            <p className="text-xl font-bold">{activeWorkshop?.title}</p>
            <p className="text-base">{activeWorkshop?.body}</p>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
