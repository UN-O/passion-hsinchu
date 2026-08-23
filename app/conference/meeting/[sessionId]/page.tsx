import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { LocationPinIcon } from "@/components/location-pin-icon"
import { PassionLogoHeader } from "@/components/passion-logo-header"
import { DiscussionRoot } from "@/components/discussion/discussion-root"
import { RootContent } from "@/components/discussion/root-content"
import { SessionSelect } from "@/components/session-select"
import { conferenceSessionRootKey } from "@/lib/discussion/root-registry"
import { fetchImagesForPost } from "@/lib/discussion/images"
import { fetchCachedPreviewForContent } from "@/lib/discussion/link-preview"
import { getRootBiblePassage } from "@/lib/discussion/bible-reading"
import { getOrCreateDiscussionRoot } from "@/lib/discussion/root"
import { isDiscussionAdmin } from "@/lib/discussion/permissions"
import { conferenceSessions, getNextConferenceSession } from "@/lib/opening-conference-content"
import { requireFlowAccess } from "@/lib/session"
import { siteConfig } from "@/lib/site-config"

export const metadata: Metadata = {
  title: "聚會內容",
  robots: { index: false, follow: false },
}

export default async function ConferenceMeetingSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const session = await requireFlowAccess("conference")
  const { sessionId } = await params
  // 所有人、不分角色都能看任何一場的聚會內容跟討論——不再有「還沒輪到不能
  // 選」這種時間限制，只有場次 id 打錯／不存在才會導回目前這一場。
  const activeSession = conferenceSessions.find((s) => s.id === sessionId)

  if (!activeSession) redirect(`/conference/meeting/${getNextConferenceSession().id}`)

  const rootKey = conferenceSessionRootKey(activeSession.id)
  const root = await getOrCreateDiscussionRoot(rootKey)
  // root 的附圖不走 enrichRows（這頁的 root 是自己查的），另外撈一次。
  const rootImages = await fetchImagesForPost(root.id)
  const rootPreview = await fetchCachedPreviewForContent(root.content)
  const rootBibleReading = await getRootBiblePassage(root.id)

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
              items={conferenceSessions.map((s) => ({ id: s.id, label: `${s.dateLabel}・${s.typeLabel}` }))}
              activeId={activeSession.id}
              basePath="/conference/meeting"
            />
          </div>
        </div>

        <DiscussionRoot
          rootKey={rootKey}
          session={session}
          header={
            <RootContent
              rootPostId={root.id}
              content={root.content}
              images={rootImages}
              linkPreview={rootPreview}
              bibleReading={rootBibleReading}
              isDiscussionAdmin={isDiscussionAdmin(session)}
            />
          }
        />
      </div>
    </main>
  )
}
