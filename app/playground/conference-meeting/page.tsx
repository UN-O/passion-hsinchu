import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { LocationPinIcon } from "@/components/location-pin-icon"
import { PassionLogoHeader } from "@/components/passion-logo-header"
import { MeetingNotes } from "@/components/meeting-notes"
import { ConferenceSessionSelect } from "@/components/conference-session-select"
import { getNextConferenceSession, getUnlockedConferenceSessions } from "@/lib/opening-conference-content"
import { siteConfig } from "@/lib/site-config"

export default async function ConferenceMeetingPlaygroundPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>
}) {
  const { session: sessionParam } = await searchParams
  const unlockedSessions = getUnlockedConferenceSessions()
  const nextSession =
    unlockedSessions.find((s) => s.id === sessionParam) ?? getNextConferenceSession()

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
