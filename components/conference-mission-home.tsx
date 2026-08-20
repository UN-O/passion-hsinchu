"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Check, X } from "lucide-react"

import { ConferenceCountdown } from "@/components/conference-countdown"
import { LocationPinIcon } from "@/components/location-pin-icon"
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { useDialogBackClose } from "@/hooks/use-dialog-back-close"
import {
  conferenceWorkshops,
  getConferenceWorkshop,
  getNextConferenceSession,
  isWorkshopRegistered,
  workshopDateLabel,
  workshopRoundLabels,
  workshopRoundTimeLabels,
} from "@/lib/opening-conference-content"
import { siteConfig } from "@/lib/site-config"

export function ConferenceMissionHome({
  meetingHref = "/conference/meeting",
}: {
  meetingHref?: string
} = {}) {
  const [activeWorkshopId, setActiveWorkshopId] = useState<string | null>(null)
  const activeWorkshop = activeWorkshopId ? getConferenceWorkshop(activeWorkshopId) : undefined
  const [nextMeetingVisualOpen, setNextMeetingVisualOpen] = useState(false)
  // 下一場還沒開始的聚會。場次資料是小時等級的固定時間表，不像倒數計時每秒都變，
  // 伺服器算出來的跟瀏覽器 hydrate 那一刻幾乎不會跨到下一場，直接算不用另外處理
  // hydration mismatch。
  const nextSession = getNextConferenceSession()

  // App 化之後，讓系統返回鍵／手勢可以先關掉彈窗，而不是直接離開頁面
  useDialogBackClose(activeWorkshop !== undefined, () => setActiveWorkshopId(null))
  useDialogBackClose(nextMeetingVisualOpen, () => setNextMeetingVisualOpen(false))

  return (
    <main className="min-h-svh bg-[#0458e2]">
      <div className="mx-auto max-w-2xl">
        {/* 主視覺四邊留空間，跟下面工作坊／聚會場次同一層 px 內距，不貼齊螢幕邊緣。
            上方額外加 env(safe-area-inset-top)：App 化後全螢幕沒有網址列，
            iPhone 瀏海／動態島或 Android 狀態列不然會直接疊在主視覺上面。 */}
        <div
          className="sticky top-0 z-10 bg-[#0458e2] px-4 pb-4 sm:px-6"
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

          {/* 工作坊方框先做成液態玻璃質感（半透明底＋backdrop-blur＋內緣高光），
              照片去背後會疊在玻璃上面，玻璃本身要先能在任何背景上都看起來
              通透，所以這裡不放海報圖。點卡片彈出視窗顯示介紹，不跳頁。
              overscroll-x-contain：滑到這排的頭尾邊界時，捲動不會「溢出」去觸發
              App 外層的返回手勢（iOS／Android 邊緣滑動＝返回），滑動效果留在這排裡面。 */}
          <div
            className="mt-6 flex gap-4 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ scrollSnapType: "x mandatory" }}
          >
            {conferenceWorkshops.map((workshop) => (
              <button
                key={workshop.id}
                type="button"
                onClick={() => setActiveWorkshopId(workshop.id)}
                aria-label={workshop.topic || workshop.speaker}
                className="relative aspect-[4/5] w-[118px] shrink-0 overflow-hidden rounded-3xl border border-white/50 bg-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),0_1px_4px_rgba(0,0,0,0.12)] backdrop-blur-md sm:w-[151px]"
                style={{ scrollSnapAlign: "start" }}
              />
            ))}
          </div>

          {/* 下一場還沒開始的聚會（同一個 session 也是聚會流程表印的三場）。
              左右邊跟工作坊那排卡片切齊（同一層 px 內距），不是貼齊螢幕邊緣。
              背景先放晚場聚會的圖片佔位，之後每場有各自的視覺再依場次替換；
              疊一層由下往上的黑色漸層，確保文字在任何圖片上都維持可讀。 */}
          <Link
            href={meetingHref}
            className="relative mt-6 flex aspect-[5/4] w-full flex-col justify-end overflow-hidden rounded-3xl bg-[#DC2626] p-6"
          >
            <Image
              src="/images/conference-next-meeting-visual.jpg"
              alt=""
              fill
              sizes="(min-width: 640px) 640px, 100vw"
              className="object-cover"
              style={{ objectPosition: "50% 30%" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <p className="relative z-10 text-sm text-white/80">
              {nextSession.dateLabel}・{nextSession.sessionLabel}
            </p>
            <p className="relative z-10 mt-2 text-2xl font-bold text-white">{nextSession.typeLabel}</p>
          </Link>

          <div className="mt-6 rounded-3xl bg-slate-300 p-6">
            <p className="font-[family-name:var(--font-noto-jp)] text-lg font-bold text-black/70">
              距離下場聚會還剩...
            </p>

            {/* 下場聚會視覺先放晚場聚會的圖片佔位，之後每場有各自的視覺再依場次替換。
                點下去彈出 16:9 大圖預覽。倒數計時疊在照片下緣，底下加一層黑色
                漸層墊底，讓霧化玻璃數字框在任何照片內容上都維持穩定的可讀度。 */}
            <button
              type="button"
              onClick={() => setNextMeetingVisualOpen(true)}
              aria-label="下場聚會視覺預覽"
              className="relative mt-3 aspect-video w-full overflow-hidden rounded-2xl bg-white/70"
            >
              <Image
                src="/images/conference-next-meeting-visual.jpg"
                alt="晚場聚會視覺"
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
        </div>
      </div>

      {/* 聚會流程表整張圖脫離上面 max-w-2xl 置中容器，左右直接貼齊螢幕邊緣佔滿版面，
          跟倒數計時卡片之間留 mt-12 的空隙，沒有圓角、下面不留白，圖片底部就是頁面底部。 */}
      <div className="relative mt-12">
        <Image
          src="/images/conference-schedule.jpg"
          alt="PASSION CONFERENCE 特會流程表"
          width={1080}
          height={2250}
          className="h-auto w-full"
        />
      </div>

      <Dialog open={activeWorkshop !== undefined} onOpenChange={(next) => !next && setActiveWorkshopId(null)}>
        <DialogContent
          showCloseButton={false}
          className="max-w-[calc(100%-2rem)] gap-0 overflow-hidden rounded-3xl border-none bg-card p-0 sm:max-w-md"
        >
          <DialogTitle className="sr-only">{activeWorkshop?.topic || activeWorkshop?.speaker}</DialogTitle>
          <DialogClose className="absolute top-4 right-4 z-10 text-white/80 hover:text-white">
            <X className="size-5" />
            <span className="sr-only">關閉</span>
          </DialogClose>

          {/* 工作坊主視覺是 4:5 直式海報，彈窗頭圖是 16:9 橫式，裁切只留中段
              （講員臉部＋主題文字開頭那一段），跟卡片縮圖用同一張原圖。 */}
          <div className="relative aspect-video w-full">
            {activeWorkshop && (
              <Image
                src={activeWorkshop.image}
                alt=""
                fill
                sizes="(min-width: 640px) 448px, 100vw"
                className="object-cover"
                style={{ objectPosition: "50% 35%" }}
              />
            )}
          </div>

          <div className="flex flex-col gap-2 p-6">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium">
                <LocationPinIcon className="size-4" />
                {activeWorkshop?.location}
              </span>
              {activeWorkshop && isWorkshopRegistered(activeWorkshop.id) && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2.5 py-1 text-xs font-medium text-green-400">
                  <Check className="size-3.5 rounded-full bg-green-400 p-0.5 text-card" strokeWidth={3} />
                  已報名
                </span>
              )}
            </div>
            <p className="text-xl font-bold">
              {activeWorkshop?.topic || activeWorkshop?.speaker}
            </p>
            {activeWorkshop?.topic && (
              <p className="text-base text-muted-foreground">{activeWorkshop.speaker}</p>
            )}
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm text-muted-foreground">
              {activeWorkshop?.rounds.map((round) => (
                <span key={round}>
                  {workshopRoundLabels[round]}｜{workshopRoundTimeLabels[round]}
                </span>
              ))}
              <span>{workshopDateLabel}</span>
            </div>
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

          {/* 下場聚會視覺先放晚場聚會的圖片佔位，之後每場有各自的視覺再依場次替換 */}
          <div className="relative aspect-video w-full">
            <Image
              src="/images/conference-next-meeting-visual.jpg"
              alt="晚場聚會視覺"
              fill
              sizes="(min-width: 640px) 448px, 100vw"
              className="object-cover"
              style={{ objectPosition: "50% 30%" }}
            />
          </div>

          {/* 圖片下面放聚會資訊，跟工作坊彈窗同樣的排版方式 */}
          <div className="flex flex-col gap-2 p-6">
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium">
              <LocationPinIcon className="size-4" />
              {siteConfig.venueShortName}
            </span>
            <p className="text-xl font-bold">{nextSession.typeLabel}</p>
            <p className="text-base">
              {nextSession.dateLabel}・{nextSession.sessionLabel}
            </p>
            <p className="text-sm text-muted-foreground">
              {nextSession.doorsOpenTime} 開放入場・{nextSession.startTime} 聚會開始
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
