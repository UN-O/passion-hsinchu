import type { ReactNode } from "react"

import { getOrCreateDiscussionRoot } from "@/lib/discussion/root"
import { getDiscussionPage, getViewerCampTeam } from "@/lib/discussion/queries"
import { isDiscussionAdmin } from "@/lib/discussion/permissions"
import { fetchPublicProfile } from "@/lib/profile"
import { flowForRootKey } from "@/lib/discussion/root-registry"
import type { AppSession } from "@/lib/session"
import { DiscussionView } from "./discussion-view"

// Server component：初始資料在伺服器端就抓好，不讓 client 掛載後再打一次
// fetch——避免多餘的 loading 畫面閃爍，也符合「沒有使用者動作就不自動打」
// 的原則（見規格第 51 點：0 automatic refetch）。
export async function DiscussionRoot({
  rootKey,
  session,
  header,
}: {
  rootKey: string
  session: AppSession
  // root 自己的顯示內容（大綱文字、靈修導言＋經文）跟討論串放在同一塊
  // 區塊裡，不是頁面本身另外一段——呼叫端把這塊內容當 header 傳進來，
  // 而不是自己在外面另外包一層（見 CAMP 逐場聚會頁／靈修頁）。
  header?: ReactNode
}) {
  const root = await getOrCreateDiscussionRoot(rootKey)
  const viewerProfile = await fetchPublicProfile(session.user.id)
  const initial = await getDiscussionPage({ rootPostId: root.id, viewerId: session.user.id, sort: "top" })
  // 「小隊」篩選只有 CAMP 討論、而且使用者自己有進小隊名單才有意義——
  // CONFERENCE 討論不查這筆，省一次不必要的 db 往返。
  const showTeamFilter =
    flowForRootKey(rootKey) === "camp" && (await getViewerCampTeam(session.user.id)) !== null

  // 顏色跟著外層頁面的主題走（CAMP 的淺黃 camp-theme／CONFERENCE 的深色），
  // 不強制切成深色。不用圓角、不加水平 margin/padding——不希望討論串跟
  // 外層 <main> 的其他區塊之間有縮排，看起來要像是同一個版面自然往下接，
  // 不是另外框出來的一塊。
  return (
    <div className="flex flex-col gap-6 bg-background py-6 text-foreground">
      {header}
      <DiscussionView
        rootKey={rootKey}
        rootPostId={root.id}
        viewer={{
          id: session.user.id,
          name: viewerProfile?.displayName ?? session.user.name,
          role: session.user.role,
          avatarUrl: viewerProfile?.avatarUrl ?? null,
          zone: viewerProfile?.zone ?? null,
        }}
        isDiscussionAdmin={isDiscussionAdmin(session)}
        initial={initial}
        showTeamFilter={showTeamFilter}
      />
    </div>
  )
}
