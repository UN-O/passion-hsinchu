import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PassionLogoHeader } from "@/components/passion-logo-header"
import { DiscussionThread } from "@/components/discussion/discussion-thread"
import { cn } from "@/lib/utils"
import { isDiscussionAdmin } from "@/lib/discussion/permissions"
import { getAncestorChain, getDiscussionPage, getPostContext } from "@/lib/discussion/queries"
import { flowForRootKey, getRegisteredRoot } from "@/lib/discussion/root-registry"
import { assertFlowAccess, requireClaimedSession } from "@/lib/session"

export const metadata: Metadata = {
  title: "討論串",
  robots: { index: false, follow: false },
}

export default async function DiscussionThreadPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params

  // ⚠ 權限：這是一條通用路由，網址上只有 post id，沒有任何活動資訊。
  // 只做 requireClaimedSession() 是不夠的——那樣只報名 CONFERENCE 的人靠一個
  // CAMP 的 post id 就能讀到 CAMP 的討論。必須從貼文反查它的 root、由
  // root_key 對應回 flow，再套那個 flow 的閘門（見 CLAUDE.md：驗證一定要在
  // 伺服器端做）。
  //
  // 三個步驟的順序也是刻意的：先確認有已認領的 session，再查資料庫。反過來
  // 的話，沒登入的人可以用 404 跟 302 的差別去試探某個 id 存不存在。
  const session = await requireClaimedSession()

  const context = await getPostContext(postId)
  // root 自己不給看：它代表教材／活動本身，有自己的頁面。
  if (!context || context.isRoot) notFound()

  const flow = flowForRootKey(context.rootKey)
  // root_key 沒註冊過就當成不存在，不 fallback 成放行。
  if (!flow) notFound()
  assertFlowAccess(session, flow)

  const viewerId = session.user.id
  const [chain, replies] = await Promise.all([
    getAncestorChain(postId, viewerId),
    // 焦點貼文的直接子回覆。這裡的 rootPostId 參數就是「列出誰底下的直接
    // 子回覆」，對一般貼文一樣成立。
    getDiscussionPage({ rootPostId: postId, viewerId, sort: "top" }),
  ])

  const focus = chain[chain.length - 1]
  if (!focus || focus.post.id !== postId) notFound()

  // 祖先鏈的最前面是討論 root（教材／活動本身，沒有作者）。它不是誰寫的
  // 貼文，顯示出來只會是一顆問號頭貼，改成上面那條返回來源頁面的連結。
  const ancestors = chain.slice(0, -1).filter((item) => item.post.id !== context.rootPostId)
  const rootDefinition = context.rootKey ? getRegisteredRoot(context.rootKey) : null

  // 這是一條通用路由，不在 app/camp/layout.tsx 底下，本來不會套用 CAMP 的
  // 淺黃 camp-theme（那層 class 只包在 /camp/* 的頁面外面）。CAMP 的貼文
  // 點進來卻沒有這層，畫面會掉回全站預設的深色底——所以這裡自己依 flow
  // 補一次同樣的包法，保持跟來源頁面一致的背景，不是討論串元件自己的顏色
  // 問題。
  return (
    <div className={cn(flow === "camp" && "camp-theme min-h-screen bg-background text-foreground")}>
      <main className="mx-auto max-w-2xl px-[6%] pb-16 sm:px-8 sm:pb-24">
        <PassionLogoHeader
          logoTone={flow === "camp" ? "dark" : undefined}
          leftSlot={
            <Button asChild size="icon-sm" variant="outline" aria-label="返回" className="rounded-full">
              <Link href={rootDefinition?.sourcePath ?? "/"}>
                <ArrowLeft />
              </Link>
            </Button>
          }
        />

        <div className="mt-10 flex flex-col gap-6">
          {rootDefinition && (
            <Link href={rootDefinition.sourcePath} className="text-sm text-muted-foreground hover:text-foreground">
              {rootDefinition.title}
            </Link>
          )}

          {/* 顏色跟著頁面主題走、不加圓角／水平 padding，跟 DiscussionRoot
              自己包的那層同一套 class（這裡沒有經過 DiscussionRoot，是
              DiscussionThread 直接掛在頁面上，所以外層自己包一次）。 */}
          <div className="flex flex-col bg-background py-6 text-foreground">
            <DiscussionThread
              ancestors={ancestors}
              focus={focus}
              viewer={{ id: session.user.id, name: session.user.name, role: session.user.role }}
              isDiscussionAdmin={isDiscussionAdmin(session)}
              initialReplies={replies}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
