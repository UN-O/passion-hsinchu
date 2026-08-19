"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { X } from "lucide-react"

import { ConferenceCountdown } from "@/components/conference-countdown"
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { useDialogBackClose } from "@/hooks/use-dialog-back-close"
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
  const [nextMeetingVisualOpen, setNextMeetingVisualOpen] = useState(false)

  // App 化之後，讓系統返回鍵／手勢可以先關掉彈窗，而不是直接離開頁面
  useDialogBackClose(activeWorkshop !== undefined, () => setActiveWorkshopId(null))
  useDialogBackClose(nextMeetingVisualOpen, () => setNextMeetingVisualOpen(false))

  return (
    <main className="min-h-svh bg-[#feed74]">
      <div className="mx-auto max-w-2xl">
        {/* 主視覺四邊留空間，跟下面工作坊／聚會場次同一層 px 內距，不貼齊螢幕邊緣。
            上方額外加 env(safe-area-inset-top)：App 化後全螢幕沒有網址列，
            iPhone 瀏海／動態島或 Android 狀態列不然會直接疊在主視覺上面。 */}
        <div
          className="sticky top-0 z-10 bg-[#feed74] px-4 pb-4 sm:px-6"
          style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)" }}
        >
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

          {/* 工作坊主視覺尚未提供圖片，先用純色塊佔位。點卡片彈出視窗顯示介紹，不跳頁。
              overscroll-x-contain：滑到這排的頭尾邊界時，捲動不會「溢出」去觸發
              App 外層的返回手勢（iOS／Android 邊緣滑動＝返回），滑動效果留在這排裡面。 */}
          <div
            className="mt-6 flex gap-4 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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

            {/* 下場聚會視覺尚未提供圖片，先用色塊佔位。點下去彈出 16:9 大圖預覽。 */}
            <button
              type="button"
              onClick={() => setNextMeetingVisualOpen(true)}
              aria-label="下場聚會視覺預覽"
              className="mt-3 aspect-video w-full rounded-2xl bg-white/70"
            />

            <ConferenceCountdown targetISO={conference.startDateISO} />
          </div>

          {/* 聚會流程表整張圖直接放到頁面最底部，跟上面倒數計時卡片之間留 mt-12 的空隙，
              沒有圓角、下面不留白，圖片底部就是頁面底部。
              圖片正上方疊一條短短的黃色→透明漸層，讓背景黃色跟圖片的藍色之間有個過渡，
              高度故意抓短，只蓋到圖片最上緣還沒有文字內容的地方，不會擋到流程表內容。 */}
          <div className="relative mt-12">
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-[linear-gradient(to_bottom,#feed74,transparent)]" />
            <Image
              src="/images/conference-schedule.jpg"
              alt="PASSION CONFERENCE 特會流程表"
              width={480}
              height={1000}
              className="h-auto w-full"
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

      <Dialog open={nextMeetingVisualOpen} onOpenChange={setNextMeetingVisualOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-w-[calc(100%-2rem)] gap-0 overflow-hidden rounded-3xl border-none bg-card p-0 sm:max-w-md"
        >
          <DialogTitle className="sr-only">下場聚會視覺</DialogTitle>
          <DialogClose className="absolute top-4 right-4 z-10 text-white/80 hover:text-white">
            <X className="size-5" />
            <span className="sr-only">關閉</span>
          </DialogClose>

          {/* 下場聚會視覺尚未提供圖片，先用色塊佔位 */}
          <div className="aspect-video w-full bg-[#3B82F6]" />
        </DialogContent>
      </Dialog>
    </main>
  )
}
