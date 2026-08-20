import type { ReactNode } from "react"

import { getOrCreateDiscussionRoot } from "@/lib/discussion/root"
import { getDiscussionPage } from "@/lib/discussion/queries"
import { isDiscussionAdmin } from "@/lib/discussion/permissions"
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
  // 深色面板裡，不是頁面本身淺色主題底下的另一段——呼叫端把這塊內容當
  // header 傳進來，而不是自己在外面另外包一層（見 CAMP 逐場聚會頁／靈修頁）。
  header?: ReactNode
}) {
  const root = await getOrCreateDiscussionRoot(rootKey)
  const initial = await getDiscussionPage({ rootPostId: root.id, viewerId: session.user.id, sort: "top" })

  // 討論串一律深色主題，不管外層頁面是 CAMP 的淺黃 camp-theme 還是
  // CONFERENCE 的預設深色——用 globals.css 既有的 .dark 覆寫同一套語意化
  // token（bg-background、text-foreground...），不用元件各自改色。水平
  // padding 刻意比外層頁面窄（px-4 而非 p-6）：外層 <main> 本身已經有
  // px-[6%]/px-8，兩層 padding 疊起來在手機上會把內容擠得太窄。
  return (
    <div className="dark flex flex-col gap-6 rounded-3xl bg-background px-4 py-6 text-foreground sm:px-5">
      {header}
      <DiscussionView
        rootKey={rootKey}
        rootPostId={root.id}
        viewer={{ id: session.user.id, name: session.user.name, role: session.user.role }}
        isDiscussionAdmin={isDiscussionAdmin(session)}
        initial={initial}
      />
    </div>
  )
}
