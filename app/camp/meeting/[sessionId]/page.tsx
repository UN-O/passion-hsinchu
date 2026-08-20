import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PassionLogoHeader } from "@/components/passion-logo-header"
import { DiscussionRoot } from "@/components/discussion/discussion-root"
import { RootContent } from "@/components/discussion/root-content"
import { SessionSelect } from "@/components/session-select"
import { campSessionRootKey } from "@/lib/discussion/root-registry"
import { getOrCreateDiscussionRoot } from "@/lib/discussion/root"
import { isDiscussionAdmin } from "@/lib/discussion/permissions"
import {
  formatCampMeetingDateLabel,
  formatCampMeetingTimeLabel,
  getNextCampMeetingSession,
  getUnlockedCampMeetingSessions,
} from "@/lib/opening-camp-content"
import { requireFlowAccess } from "@/lib/session"

export const metadata: Metadata = {
  title: "聚會內容",
  robots: { index: false, follow: false },
}

export default async function CampMeetingSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const session = await requireFlowAccess("camp")
  // 工作人員不受「場次還沒輪到不能選」的限制，跟靈修內容公布時間限制同一套邏輯。
  const isStaff = session.user.role !== "attendee"
  const { sessionId } = await params
  const unlockedSessions = getUnlockedCampMeetingSessions(new Date(), isStaff)
  const activeSession = unlockedSessions.find((s) => s.id === sessionId)

  // 網址帶的場次不存在、或還沒輪到，導回目前這一場的正式網址。
  if (!activeSession) redirect(`/camp/meeting/${getNextCampMeetingSession().id}`)

  const rootKey = campSessionRootKey(activeSession.id)
  const root = await getOrCreateDiscussionRoot(rootKey)

  return (
    <main className="mx-auto max-w-2xl px-[6%] pb-16 sm:px-8 sm:pb-24">
      <PassionLogoHeader
        logoTone="dark"
        leftSlot={
          <Button asChild size="icon-sm" variant="outline" aria-label="返回" className="rounded-full">
            <Link href="/camp">
              <ArrowLeft />
            </Link>
          </Button>
        }
      />

      <div className="mt-10 flex flex-col gap-10">
        {/* 聚會視覺圖，跟首頁倒數卡片點下去的「營會資訊」彈窗同一張
            activeSession.infoImage（有字版），16:9 滿版圓角。 */}
        <div className="relative aspect-video w-full overflow-hidden rounded-3xl">
          <Image
            src={activeSession.infoImage}
            alt={`${activeSession.label}視覺`}
            fill
            sizes="(min-width: 640px) 672px, 100vw"
            className="object-cover"
            style={{ objectPosition: "50% 30%" }}
          />
        </div>

        <div className="flex flex-col gap-1">
          <p className="mt-1 text-2xl font-bold">
            {formatCampMeetingDateLabel(activeSession.startISO)}・{activeSession.label}
          </p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">{formatCampMeetingTimeLabel(activeSession.startISO)} 聚會開始</p>
            <SessionSelect
              items={unlockedSessions.map((s) => ({
                id: s.id,
                label: `${formatCampMeetingDateLabel(s.startISO)}・${s.label}`,
              }))}
              activeId={activeSession.id}
              basePath="/camp/meeting"
            />
          </div>
        </div>

        <DiscussionRoot
          rootKey={rootKey}
          session={session}
          header={<RootContent rootPostId={root.id} content={root.content} isDiscussionAdmin={isDiscussionAdmin(session)} />}
        />
      </div>
    </main>
  )
}
