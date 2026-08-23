import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CampDevotionContent } from "@/components/camp-devotion-content"
import { DiscussionRoot } from "@/components/discussion/discussion-root"
import { DEVOTION_ENTRIES, buildDevotionContent } from "@/lib/devotion-content"
import { parseReferenceString } from "@/lib/bible"
import { campDevotionRootKey } from "@/lib/discussion/root-registry"
import { getOrCreateDevotionRoot } from "@/lib/discussion/root"
import { fetchImagesForPost } from "@/lib/discussion/images"
import { fetchCachedPreviewForContent } from "@/lib/discussion/link-preview"
import { getRootBiblePassage } from "@/lib/discussion/bible-reading"
import { isDiscussionAdmin } from "@/lib/discussion/permissions"
import { requireFlowAccess } from "@/lib/session"

export const metadata: Metadata = {
  title: "靈修內容",
  robots: { index: false, follow: false },
}

export default async function CampDevotionDayPage({ params }: { params: Promise<{ day: string }> }) {
  const { day } = await params
  const entry = DEVOTION_ENTRIES.find((e) => e.id === day)
  if (!entry) notFound()

  const session = await requireFlowAccess("camp")
  // 工作人員不受 DAY2／DAY3 公布時間限制，隨時能看到完整靈修內容方便備稿確認。
  const isStaff = session.user.role !== "attendee"

  // root 現在是一篇正常的 root post（跟 camp/conference 聚會頁同一套
  // RootContent），content／閱讀模式段落只有第一次建立 root 時會用
  // entry 的資料當初始值，之後 admin 在畫面上編輯就跟這裡的程式碼無關了。
  const rootKey = campDevotionRootKey(entry.id)
  const reference = parseReferenceString(entry.reference)
  const root = await getOrCreateDevotionRoot(
    rootKey,
    entry.questions,
    buildDevotionContent(entry),
    reference ? { version: entry.version, reference } : null
  )

  // root 的附圖／連結預覽／閱讀段落不走 enrichRows（這頁的 root 是自己查
  // 的），跟 camp/conference 聚會頁同一個做法另外撈一次。
  const [rootImages, rootPreview, rootBibleReading] = await Promise.all([
    fetchImagesForPost(root.id),
    fetchCachedPreviewForContent(root.content),
    getRootBiblePassage(root.id),
  ])

  return (
    <DiscussionRoot
      rootKey={rootKey}
      session={session}
      header={
        <CampDevotionContent
          entry={entry}
          isStaff={isStaff}
          rootPostId={root.id}
          content={root.content}
          images={rootImages}
          linkPreview={rootPreview}
          bibleReading={rootBibleReading}
          isDiscussionAdmin={isDiscussionAdmin(session)}
        />
      }
    />
  )
}
