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
import { fetchImagesForPost } from "@/lib/discussion/images"
import { fetchCachedPreviewForContent } from "@/lib/discussion/link-preview"
import { getRootBiblePassage } from "@/lib/discussion/bible-reading"
import { getOrCreateDiscussionRoot } from "@/lib/discussion/root"
import { isDiscussionAdmin } from "@/lib/discussion/permissions"
import {
  campSessions,
  formatCampMeetingDateLabel,
  formatCampMeetingTimeRangeLabel,
  getCampMeetingSessions,
  getNextCampMeetingSession,
  isCampMeetingSession,
} from "@/lib/opening-camp-content"
import { requireFlowAccess } from "@/lib/session"

export const metadata: Metadata = {
  title: "聚會內容",
  robots: { index: false, follow: false },
}

export default async function CampMeetingSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const session = await requireFlowAccess("camp")
  const { sessionId } = await params
  // 所有人、不分角色都能看任何一場的聚會內容跟討論——不再有「還沒輪到不能
  // 選」這種時間限制，只有場次 id 打錯／不存在才會導回目前這一場。activeSession
  // 要在全部 7 場裡面找（不是 allSessions 那 6 場選單清單），大地競賽才能有
  // 自己的場次頁——只是它沒有討論串、也不出現在選單裡（見下面 hasDiscussion）。
  const allSessions = getCampMeetingSessions()
  const activeSession = campSessions.find((s) => s.id === sessionId)

  if (!activeSession) redirect(`/camp/meeting/${getNextCampMeetingSession().id}`)

  const hasDiscussion = isCampMeetingSession(activeSession.id)
  const rootKey = hasDiscussion ? campSessionRootKey(activeSession.id) : null
  const root = rootKey ? await getOrCreateDiscussionRoot(rootKey) : null
  // root 的附圖不走 enrichRows（這頁的 root 是自己查的），另外撈一次。
  const rootImages = root ? await fetchImagesForPost(root.id) : []
  const rootPreview = root ? await fetchCachedPreviewForContent(root.content) : null
  const rootBibleReading = root ? await getRootBiblePassage(root.id) : null

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
            <p className="text-sm text-muted-foreground">
              {formatCampMeetingTimeRangeLabel(activeSession.startISO, activeSession.endISO)}
            </p>
            <SessionSelect
              items={allSessions.map((s) => ({
                id: s.id,
                label: `${formatCampMeetingDateLabel(s.startISO)}・${s.label}`,
              }))}
              activeId={activeSession.id}
              basePath="/camp/meeting"
            />
          </div>
        </div>

        {/* 大地競賽只提供聚會資訊，不開放留言——沒有討論串可以掛（見上面
            hasDiscussion），這裡就不渲染 DiscussionRoot。 */}
        {hasDiscussion && root && (
          <DiscussionRoot
            rootKey={rootKey!}
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
        )}
      </div>
    </main>
  )
}
