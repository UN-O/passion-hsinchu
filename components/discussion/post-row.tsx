"use client"

import { useState, type ReactNode } from "react"
import { ChevronDown, Heart, MessageCircle, Pin, PinOff, Trash2 } from "lucide-react"

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

// 版面尺寸集中在這裡。連接線的幾何（曲線起訖點、縮排）全部從這幾個數字算
// 出來，不是量畫面湊的——之後改頭貼大小或間距，線還是會接在對的位置。
const AVATAR_TOP = 32 // 第一層頭貼
const AVATAR_NESTED = 24 // 巢狀回覆的頭貼，要比第一層小
const RAIL_GAP = 12 // 頭貼跟內文之間的間距
const LINE_WIDTH = 2 // 所有連接線統一這個粗細，不會有粗細不一或重疊
// 巢狀區塊的縮排：對齊第一層的內文起點（頭貼右緣 + 間距），這樣巢狀頭貼
// 的中心剛好落在上一層「愛心」那排 icon 的區域，視覺上對得起來。
const NEST_INDENT = AVATAR_TOP + RAIL_GAP

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

// 「多久以前」，仿 Threads 用英文縮寫（30m、2h、3d，數字跟單位之間不留空白）。
// 分鐘/小時/天級距不會因為 SSR、hydrate 兩次呼叫 Date.now() 之間的幾百毫秒
// 落差而顯示不同字串，超過 6 天就退回絕對時間，避免「N 週前」這種不夠精確
// 的說法。
function formatRelativeTime(iso: string): string {
  const diffSeconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (diffSeconds < 60) return "now"
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m`
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h`
  if (diffSeconds < 86400 * 6) return `${Math.floor(diffSeconds / 86400)}d`
  return formatAbsoluteTime(iso)
}

// 頭貼先用姓名的第一個字當佔位，之後如果有真的大頭貼圖檔案再換掉這裡。
function Avatar({ name, size }: { name: string | null; size: number }) {
  const initial = name?.trim().slice(0, 1) || "?"
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full border border-border bg-muted font-semibold text-foreground"
      style={{ width: size, height: size, fontSize: size <= AVATAR_NESTED ? 11 : 13 }}
    >
      {initial}
    </div>
  )
}

// 頭貼底下自動長高的直線。兩端圓角、寬度統一，第一層跟巢狀共用同一個元件。
function RailLine() {
  return <div className="mt-1.5 flex-1 rounded-full bg-border" style={{ width: LINE_WIDTH, minHeight: 8 }} />
}

function EntryBody({
  entry,
  controller,
  depth,
  canPin,
  hasRail,
  avatarSize,
}: {
  entry: DiscussionEntry
  controller: PostRowController
  depth: number
  canPin?: boolean
  // 底下還有東西（精選回覆／展開的子回覆／查看更多）時，頭貼下面接一條線。
  hasRail?: boolean
  avatarSize: number
}) {
  const { post, stats, viewer } = entry
  const canDelete = !post.isDeleted && (post.authorId === controller.viewerId || controller.isDiscussionAdmin)

  return (
    <div className="flex" style={{ gap: RAIL_GAP }}>
      <div className="flex flex-col items-center" style={{ width: avatarSize }}>
        <Avatar name={post.isDeleted ? null : post.authorName} size={avatarSize} />
        {hasRail && <RailLine />}
      </div>

      {/* 有 rail 時內文下面留一段 padding，讓 flex-1 的線一路長到這則貼文的
          最底部——下一則緊接著開始（串起來的 container 不留 gap），線就會是
          連續的，不會每則之間斷一截。 */}
      <div className={cn("flex min-w-0 flex-1 flex-col gap-2", hasRail && "pb-3")}>
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
          <div className="flex items-center gap-4">
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

function ShowMoreButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
    >
      <ChevronDown className="size-4" strokeWidth={1.75} />
      {label}
    </button>
  )
}

export function PostRow({
  item,
  controller,
  depth = 0,
  hasFollowingSibling,
}: {
  item: DiscussionItem
  controller: PostRowController
  depth?: number
  // 在展開的回覆串裡，後面還有兄弟節點的話要繼續往下畫線，這樣一整串
  // 才會像圖三那樣連在一起，而不是每則各自斷開。
  hasFollowingSibling?: boolean
}) {
  const [showChildren, setShowChildren] = useState(false)

  const avatarSize = depth === 0 ? AVATAR_TOP : AVATAR_NESTED
  const railCenter = avatarSize / 2

  const hasFeatured = !!item.featuredChild
  const remainingCount = item.hiddenReplyCount
  // 展開之後子回覆是完整清單，精選那則已經在裡面（getMoreReplies 有排除，
  // 見 queries.ts），不需要再單獨預覽一次。
  const showFeatured = !showChildren && hasFeatured
  const showCollapsedMore = !showChildren && remainingCount > 0

  function handleExpand() {
    setShowChildren(true)
    if (!controller.childHasLoaded(item.post.id)) controller.onLoadMoreChildren(item.post.id, item.featuredChild?.post.id)
  }

  // 曲線：從自己的 rail 中心往下、轉彎接到巢狀頭貼的中心。起訖點都是從上面
  // 的常數推出來的。stroke 有寬度，所以左右各留半個線寬避免被裁掉。
  const half = LINE_WIDTH / 2
  const curveEndX = NEST_INDENT + AVATAR_NESTED / 2 - railCenter
  const curveHeight = 12 + AVATAR_NESTED / 2 // pt-3 的 12px + 巢狀頭貼半徑
  const corner = 12 // 轉角半徑

  function renderCurve() {
    return (
      <svg
        className="pointer-events-none absolute top-0 text-border"
        style={{ left: railCenter - half, width: curveEndX + half, height: curveHeight }}
        viewBox={`0 0 ${curveEndX + half} ${curveHeight}`}
        fill="none"
        aria-hidden="true"
      >
        <path
          d={`M${half} 0 V${curveHeight - corner} Q${half} ${curveHeight - half} ${half + corner} ${curveHeight - half} H${curveEndX}`}
          stroke="currentColor"
          strokeWidth={LINE_WIDTH}
          strokeLinecap="round"
        />
      </svg>
    )
  }

  return (
    <div className="flex flex-col">
      <EntryBody
        entry={item}
        controller={controller}
        depth={depth}
        canPin={controller.canPin(item, depth)}
        hasRail={showFeatured || showChildren || showCollapsedMore || !!hasFollowingSibling}
        avatarSize={avatarSize}
      />

      {/* 收合：預覽一則精選回覆，用曲線從上面的 rail 接過來 */}
      {showFeatured && item.featuredChild && (
        <div className="relative pt-3" style={{ paddingLeft: NEST_INDENT }}>
          {renderCurve()}
          <EntryBody entry={item.featuredChild} controller={controller} depth={depth + 1} avatarSize={AVATAR_NESTED} />
        </div>
      )}

      {/* 收合狀態的「查看更多」：貼齊連接線正下方。有精選回覆時線已經轉彎到
          巢狀縮排，就跟著縮排；沒有的話還在第一層的 rail 上，對齊 rail 中心。 */}
      {showCollapsedMore && (
        <div className="pt-2" style={{ paddingLeft: showFeatured ? NEST_INDENT : railCenter }}>
          <ShowMoreButton label={`查看更多（${remainingCount}）`} onClick={handleExpand} />
        </div>
      )}

      {/* 展開：子回覆是一條連續的串，全部同一個縮排、線接在一起；
          「載入更多」也在轉彎後的右邊，跟收合狀態那顆刻意不同位置。 */}
      {showChildren && (
        <div className="relative pt-3" style={{ paddingLeft: NEST_INDENT }}>
          {renderCurve()}
          {/* 不留 gap：每則的線靠自己的 pb-3 一路長到底，下一則緊接著開始，
              線才會連續。 */}
          <div className="flex flex-col">
            {controller.renderChildren(item.post.id, depth + 1)}
            {controller.childHasMore(item.post.id) && (
              <ShowMoreButton
                label="載入更多"
                disabled={controller.childLoading(item.post.id)}
                onClick={() => controller.onLoadMoreChildren(item.post.id, item.featuredChild?.post.id)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
