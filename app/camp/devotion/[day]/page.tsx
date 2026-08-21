import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CampDevotionContent } from "@/components/camp-devotion-content"
import { DiscussionRoot } from "@/components/discussion/discussion-root"
import { DEVOTION_ENTRIES } from "@/lib/devotion-content"
import { campDevotionRootKey } from "@/lib/discussion/root-registry"
import { getOrCreateDevotionRoot } from "@/lib/discussion/root"
import { requireFlowAccess } from "@/lib/session"

export const metadata: Metadata = {
  title: "靈修內容",
  robots: { index: false, follow: false },
}

// 頭部＋DAY2／DAY3 切換按鈕在同一路由區段的 layout.tsx（見該檔案註解，
// 是為了讓玻璃滑動底跨頁面動畫）。這裡只放會隨 day 換掉的內容本身。
export default async function CampDevotionDayPage({ params }: { params: Promise<{ day: string }> }) {
  const { day } = await params
  const entry = DEVOTION_ENTRIES.find((e) => e.id === day)
  if (!entry) notFound()

  const session = await requireFlowAccess("camp")
  // 工作人員不受 DAY2／DAY3 公布時間限制，隨時能看到完整靈修內容方便備稿確認。
  const isStaff = session.user.role !== "attendee"

  // 引導問題＝這個 root 底下置頂的官方回覆，只在 root 第一次建立時種一次
  // （見 lib/discussion/root.ts）。
  const rootKey = campDevotionRootKey(entry.id)
  await getOrCreateDevotionRoot(rootKey, entry.questions)

  return (
    <DiscussionRoot
      rootKey={rootKey}
      session={session}
      header={<CampDevotionContent entry={entry} isStaff={isStaff} />}
    />
  )
}
