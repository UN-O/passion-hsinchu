"use client"

import { useState, type ReactNode } from "react"
import { Heart, MessageCircle, Pin, PinOff, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { DiscussionEntry, DiscussionItem, PollDTO } from "@/lib/discussion/dto"
import { PollView } from "./poll-view"

export type PostRowController = {
  viewerId: string
  viewerRole: "attendee" | "staff" | "admin"
  isDiscussionAdmin: boolean
  onOpenComposer: (entry: DiscussionEntry) => void
  onLike: (entry: DiscussionEntry) => void
  onPollChange: (postId: string, next: Pick<PollDTO, "options" | "viewerOptionIds">) => void
  onPin: (postId: string) => void
  onUnpin: (postId: string) => void
  onDelete: (postId: string) => void
  onLoadMoreChildren: (postId: string, excludeId?: string) => void
  childLoading: (postId: string) => boolean
  childHasLoaded: (postId: string) => boolean
  childHasMore: (postId: string) => boolean
  renderChildren: (postId: string, depth: number) => ReactNode
  // 只有 root 的 direct reply（depth 0）才能被 pin（見規格第 12 點）。
  canPin: (item: DiscussionItem, depth: number) => boolean
}

const absoluteTimeFormatter = new Intl.DateTimeFormat("zh-TW", {
  timeZone: "Asia/Taipei",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
})

// 不要直接用 formatter.format()：不同環境（Node 的 ICU vs 瀏覽器的 ICU）
// 在 literal 分隔字元上可能不一致（例如日期跟時間之間用一般空白還是
// U+202F 窄不斷行空白），視覺上看起來一樣，但字元不同就會讓這個
// client component 在 SSR 輸出跟 hydrate 時文字對不起來，觸發 hydration
// mismatch。改用 formatToParts 自己組字串，分隔符號固定用 ASCII 字元。
function formatAbsoluteTime(iso: string): string {
  const parts = absoluteTimeFormatter.formatToParts(new Date(iso))
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ""
  return `${get("month")}/${get("day")} ${get("hour")}:${get("minute")}`
}

// 「多久以前」，仿 Threads 用英文縮寫（30 m、2 h、3 d）。分鐘/小時/天級距
// 不會因為 SSR、hydrate 兩次呼叫 Date.now() 之間的幾百毫秒落差而顯示不同
// 字串，超過 6 天就直接退回絕對時間，避免「N 週前」這種不夠精確的說法。
function formatRelativeTime(iso: string): string {
  const diffSeconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (diffSeconds < 60) return "now"
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} m`
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} h`
  if (diffSeconds < 86400 * 6) return `${Math.floor(diffSeconds / 86400)} d`
  return formatAbsoluteTime(iso)
}

// 頭貼先用姓名的第一個字當佔位，之後如果有真的大頭貼圖檔案再換掉這裡。
function Avatar({ name }: { name: string | null }) {
  const initial = name?.trim().slice(0, 1) || "?"
  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-sm font-semibold text-foreground">
      {initial}
    </div>
  )
}

function EntryBody({
  entry,
  controller,
  depth,
  canPin,
}: {
  entry: DiscussionEntry
  controller: PostRowController
  depth: number
  canPin?: boolean
}) {
  const { post, stats, viewer } = entry
  const canDelete = !post.isDeleted && (post.authorId === controller.viewerId || controller.isDiscussionAdmin)

  return (
    <div className="flex gap-3">
      <Avatar name={post.isDeleted ? null : post.authorName} />

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className={cn("text-sm font-semibold", post.isDeleted && "text-muted-foreground")}>
            {post.isDeleted ? "已刪除的貼文" : (post.authorName ?? "匿名")}
          </span>
          <span className="text-xs text-muted-foreground">{formatRelativeTime(post.createdAt)}</span>
          {post.authorRole && post.authorRole !== "attendee" && !post.isDeleted && (
            <span className="text-xs text-muted-foreground">工作人員</span>
          )}
          {post.isPinned && <span className="text-xs text-primary">已置頂</span>}
        </div>

        {!post.isDeleted && <p className="whitespace-pre-wrap text-sm">{post.content}</p>}

        {entry.poll && !post.isDeleted && (
          <PollView poll={entry.poll} onChange={(next) => controller.onPollChange(post.id, next)} />
        )}

        {!post.isDeleted && (
          <div className="mt-1 flex items-center gap-4">
            <button
              type="button"
              onClick={() => controller.onLike(entry)}
              aria-label={viewer.hasLiked ? "取消讚" : "讚"}
              className={cn(
                "flex items-center gap-1.5 text-muted-foreground hover:text-foreground",
                viewer.hasLiked && "text-primary hover:text-primary"
              )}
            >
              <Heart className="size-[18px]" fill={viewer.hasLiked ? "currentColor" : "none"} strokeWidth={1.75} />
              {stats.likeCount > 0 && <span className="text-xs">{stats.likeCount}</span>}
            </button>

            {depth < 6 && (
              <button
                type="button"
                onClick={() => controller.onOpenComposer(entry)}
                aria-label="回覆"
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <MessageCircle className="size-[18px]" strokeWidth={1.75} />
                {stats.directReplyCount > 0 && <span className="text-xs">{stats.directReplyCount}</span>}
              </button>
            )}

            {canPin &&
              (post.isPinned ? (
                <button
                  type="button"
                  onClick={() => controller.onUnpin(post.id)}
                  aria-label="取消置頂"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <PinOff className="size-[18px]" strokeWidth={1.75} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => controller.onPin(post.id)}
                  aria-label="置頂這則回覆"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Pin className="size-[18px]" strokeWidth={1.75} />
                </button>
              ))}

            {canDelete && (
              <button
                type="button"
                onClick={() => controller.onDelete(post.id)}
                aria-label="刪除"
                className="text-muted-foreground hover:text-foreground"
              >
                <Trash2 className="size-[18px]" strokeWidth={1.75} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function PostRow({ item, controller, depth = 0 }: { item: DiscussionItem; controller: PostRowController; depth?: number }) {
  const [showChildren, setShowChildren] = useState(false)
  const hasFeatured = !!item.featuredChild
  const remainingCount = item.hiddenReplyCount

  function handleExpand() {
    setShowChildren(true)
    if (!controller.childHasLoaded(item.post.id)) controller.onLoadMoreChildren(item.post.id, item.featuredChild?.post.id)
  }

  return (
    <div className={cn("flex flex-col gap-3", depth > 0 && "border-l border-border pl-4")}>
      <EntryBody entry={item} controller={controller} depth={depth} canPin={controller.canPin(item, depth)} />

      {hasFeatured && item.featuredChild && (
        <div className="border-l border-border pl-4">
          <EntryBody entry={item.featuredChild} controller={controller} depth={depth + 1} />
        </div>
      )}

      {!showChildren && remainingCount > 0 && (
        <button
          type="button"
          onClick={handleExpand}
          className="self-start text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          查看更多回覆（{remainingCount}）
        </button>
      )}

      {showChildren && (
        <div className="flex flex-col gap-4">
          {controller.renderChildren(item.post.id, depth + 1)}
          {controller.childHasMore(item.post.id) && (
            <Button
              variant="outline"
              size="sm"
              className="self-start"
              disabled={controller.childLoading(item.post.id)}
              onClick={() => controller.onLoadMoreChildren(item.post.id, item.featuredChild?.post.id)}
            >
              載入更多
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
