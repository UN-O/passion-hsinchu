import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { LocationPinIcon } from "@/components/location-pin-icon"
import { PassionLogoHeader } from "@/components/passion-logo-header"
import { DiscussionRoot } from "@/components/discussion/discussion-root"
import { ConferenceSessionSelect } from "@/components/conference-session-select"
import { conferenceSessionRootKey } from "@/lib/discussion/root-registry"
import { getNextConferenceSession, getUnlockedConferenceSessions } from "@/lib/opening-conference-content"
import { requireFlowAccess } from "@/lib/session"
import { siteConfig } from "@/lib/site-config"

export const metadata: Metadata = {
  title: "聚會內容",
  robots: { index: false, follow: false },
}

// 大綱、PPT 目前沒有 CMS 可以管理，先放佔位內容，等資料確定再接上真正的內容。
// 聚會場次、名稱本身已經接上 lib/opening-conference-content.ts 的真實場次資料。
const PLACEHOLDER_OUTLINE = "這裡先放佔位文字，等聚會大綱與 PPT 連結確定後補上。"

export default async function ConferenceMeetingPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>
}) {
  const session = await requireFlowAccess("conference")
  // 工作人員不受「場次還沒輪到不能選」的限制，跟靈修內容公布時間限制同一套邏輯。
  const isStaff = session.user.role !== "attendee"
  const { session: sessionParam } = await searchParams
  const unlockedSessions = getUnlockedConferenceSessions(new Date(), isStaff)
  const nextSession =
    unlockedSessions.find((s) => s.id === sessionParam) ?? getNextConferenceSession()

  return (
    <main className="mx-auto max-w-2xl px-[6%] pb-16 sm:px-8 sm:pb-24">
      <PassionLogoHeader
        leftSlot={
          <Button asChild size="icon-sm" variant="outline" aria-label="返回" className="rounded-full">
            <Link href="/conference">
              <ArrowLeft />
            </Link>
          </Button>
        }
      />

      <div className="mt-10 flex flex-col gap-10">
        {/* 聚會視覺圖，跟首頁聚會卡片／倒數計時預覽同一張 nextSession.image，
            16:9 滿版圓角。 */}
        <div className="relative aspect-video w-full overflow-hidden rounded-3xl">
          <Image
            src={nextSession.image}
            alt={`${nextSession.typeLabel}視覺`}
            fill
            sizes="(min-width: 640px) 672px, 100vw"
            className="object-cover"
            style={{ objectPosition: "50% 30%" }}
          />
        </div>

        <div className="flex flex-col gap-1">
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium">
            <LocationPinIcon className="size-4" />
            {siteConfig.venueShortName}
          </span>
          <p className="mt-1 text-2xl font-bold">
            {nextSession.dateLabel}・{nextSession.sessionLabel}・
            <br />
            {nextSession.typeLabel}
          </p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {nextSession.doorsOpenTime} 開放入場・{nextSession.startTime} 聚會開始
            </p>
            <ConferenceSessionSelect
              sessions={unlockedSessions}
              activeId={nextSession.id}
              basePath="/conference/meeting"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-base">{PLACEHOLDER_OUTLINE}</p>
        </div>

        <div className="flex flex-col gap-1">
          <div>
            <DiscussionRoot rootKey={conferenceSessionRootKey(nextSession.id)} session={session} />
          </div>
        </div>
      </div>
    </main>
  )
}
