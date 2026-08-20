import { getOrCreateDiscussionRoot } from "@/lib/discussion/root"
import { getDiscussionPage } from "@/lib/discussion/queries"
import { isDiscussionAdmin } from "@/lib/discussion/permissions"
import type { AppSession } from "@/lib/session"
import { DiscussionView } from "./discussion-view"

// Server component：初始資料在伺服器端就抓好，不讓 client 掛載後再打一次
// fetch——避免多餘的 loading 畫面閃爍，也符合「沒有使用者動作就不自動打」
// 的原則（見規格第 51 點：0 automatic refetch）。
export async function DiscussionRoot({ rootKey, session }: { rootKey: string; session: AppSession }) {
  const root = await getOrCreateDiscussionRoot(rootKey)
  const initial = await getDiscussionPage({ rootPostId: root.id, viewerId: session.user.id, sort: "top" })

  return (
    <DiscussionView
      rootKey={rootKey}
      rootPostId={root.id}
      viewer={{ id: session.user.id, name: session.user.name, role: session.user.role }}
      isDiscussionAdmin={isDiscussionAdmin(session)}
      initial={initial}
    />
  )
}
