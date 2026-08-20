import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { LocationPinIcon } from "@/components/location-pin-icon"
import { PassionLogoHeader } from "@/components/passion-logo-header"
import { MeetingNotes } from "@/components/meeting-notes"
import { SessionSelect } from "@/components/session-select"
import { getNextConferenceSession, getUnlockedConferenceSessions } from "@/lib/opening-conference-content"
import { siteConfig } from "@/lib/site-config"

export default async function ConferenceMeetingPlaygroundSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const unlockedSessions = getUnlockedConferenceSessions()
  const activeSession = unlockedSessions.find((s) => s.id === sessionId)
  if (!activeSession) redirect(`/playground/conference-meeting/${getNextConferenceSession().id}`)

  return (
    <main className="mx-auto max-w-2xl px-[6%] pb-16 sm:px-8 sm:pb-24">
      <PassionLogoHeader
        leftSlot={
          <Button asChild size="icon-sm" variant="outline" aria-label="返回" className="rounded-full">
            <Link href="/playground/conference-mission-home">
              <ArrowLeft />
            </Link>
          </Button>
        }
      />

      <div className="mt-10 flex flex-col gap-10">
        {/* 聚會視覺圖，跟首頁聚會卡片／倒數計時預覽同一張 activeSession.image，
            16:9 滿版圓角。 */}
        <div className="relative aspect-video w-full overflow-hidden rounded-3xl">
          <Image
            src={activeSession.image}
            alt={`${activeSession.typeLabel}視覺`}
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
            {activeSession.dateLabel}・{activeSession.sessionLabel}・
            <br />
            {activeSession.typeLabel}
          </p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {activeSession.doorsOpenTime} 開放入場
              <span className="hidden sm:inline">・</span>
              <br className="sm:hidden" />
              {activeSession.startTime} 聚會開始
            </p>
            <SessionSelect
              items={unlockedSessions.map((s) => ({ id: s.id, label: `${s.dateLabel}・${s.typeLabel}` }))}
              activeId={activeSession.id}
              basePath="/playground/conference-meeting"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">主要大綱、PPT</p>
          <p className="text-base">這裡先放佔位文字，等聚會大綱與 PPT 連結確定後補上。</p>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">心得筆記欄</p>
          <div className="mt-2">
            <MeetingNotes />
          </div>
        </div>
      </div>
    </main>
  )
}
