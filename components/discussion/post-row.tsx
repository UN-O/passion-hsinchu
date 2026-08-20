"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import { BadgeCheck, ChevronDown, Heart, MessageCircle, Pin, PinOff, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import type { DiscussionEntry, DiscussionItem, PollDTO } from "@/lib/discussion/dto"
import { PollView } from "./poll-view"

export type PostRowController = {
  viewerId: string
  viewerRole: "attendee" | "staff" | "admin"
  isDiscussionAdmin: boolean
  onLike: (entry: DiscussionEntry) => void
  onPollChange: (postId: string, next: Pick<PollDTO, "options" | "viewerOptionIds">) => void
  onPin: (postId: string) => void
  onUnpin: (postId: string) => void
  onDelete: (postId: string) => void
  onToggleOfficial: (postId: string, next: boolean) => void
  // 展開這則底下的主幹。沒有游標參數：主幹查詢就是從這個節點順著
  // best_direct_child 指標往下走，鏈太長時由鏈尾那則自己再展開一段。
  onLoadMoreChildren: (postId: string) => void
  childLoading: (postId: string) => boolean
  childHasLoaded: (postId: string) => boolean
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

// 這份版面的三條規則（仿 Threads，實際截圖歸納出來的）：
//
//   1. 真實的回覆樹可以無限深，但縮排只做一層。第一層回覆縮排一次，再深的
//      全部拉平到同一個 x——不然一條長討論串滑到後面內文只剩兩三個字寬。
//   2. 垂直線代表「有回覆關係」。從第一層鑽進縮排時轉一次彎（曲線只出現
//      這一次），進到拉平區之後同一條鏈往下都是直線。
//   3. 水平分隔線代表「彼此不隸屬」。平行的兄弟回覆之間畫水平線，而且刻意
//      不畫垂直線——垂直線在這套語言裡只有「隸屬」一個意思，兩種線同時出現
//      會讓人分不清楚誰回覆誰。

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
  // 官方旗標只換顯示：貼文實際上還是原本那個 authorId 發的，這裡只是
  // 把畫面上看到的名字／頭貼換成「PASSION 官方」。
  const showOfficial = post.isOfficial && !post.isDeleted
  const displayName = post.isDeleted ? null : showOfficial ? "PASSION 官方" : post.authorName
  const canToggleOfficial = !post.isDeleted && post.authorId === controller.viewerId && controller.isDiscussionAdmin

  return (
    <div className="flex" style={{ gap: RAIL_GAP }}>
      <div className="flex flex-col items-center" style={{ width: avatarSize }}>
        <Avatar name={displayName} size={avatarSize} />
        {hasRail && <RailLine />}
      </div>

      {/* 有 rail 時內文下面留一段 padding，讓 flex-1 的線一路長到這則貼文的
          最底部——下一則緊接著開始（串起來的 container 不留 gap），線就會是
          連續的，不會每則之間斷一截。 */}
      <div className={cn("flex min-w-0 flex-1 flex-col gap-2", hasRail && "pb-3")}>
        {/* 按下貼文本身（作者／時間／內文）＝開啟它的討論串頁（有返回鍵），
            不是直接跳出全螢幕回覆框——要先看到上下文，回覆要在那一頁裡
            另外按（規則 5）。投票／按讚／回覆／置頂／刪除有自己的互動，
            刻意留在這個連結範圍外面，不然點讚會被連結吃掉變成導頁。 */}
        <Link href={`/discussion/${post.id}`} className="flex flex-col gap-2">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span
              className={cn(
                "flex items-center gap-1 text-sm font-semibold",
                post.isDeleted && "text-muted-foreground",
                showOfficial && "text-primary"
              )}
            >
              {showOfficial && <BadgeCheck className="size-3.5" strokeWidth={2} />}
              {post.isDeleted ? "已刪除的貼文" : (displayName ?? "匿名")}
            </span>
            <span className="text-xs text-muted-foreground">{formatRelativeTime(post.createdAt)}</span>
            {!showOfficial && post.authorRole && post.authorRole !== "attendee" && !post.isDeleted && (
              <span className="text-xs text-muted-foreground">工作人員</span>
            )}
            {post.isPinned && <span className="text-xs text-primary">已置頂</span>}
          </div>

          {!post.isDeleted && <p className="whitespace-pre-wrap text-sm">{post.content}</p>}
        </Link>

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

            {/* icon 跟數字都連到這則的討論串頁（規則 5）：要回覆一定要先進去
                那一頁，看到完整的上下文，回覆框才會在那裡另外開——這裡
                不直接跳全螢幕回覆框。 */}
            <div className="flex items-center gap-1.5">
              {depth < 6 && (
                <Link href={`/discussion/${post.id}`} aria-label="查看討論串" className="text-muted-foreground hover:text-foreground">
                  <MessageCircle className="size-[18px]" strokeWidth={1.75} />
                </Link>
              )}
              {stats.directReplyCount > 0 && (
                <Link
                  href={`/discussion/${post.id}`}
                  aria-label={`查看這則的 ${stats.directReplyCount} 則回覆`}
                  className="-mx-1 px-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  {stats.directReplyCount}
                </Link>
              )}
            </div>

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

            {canToggleOfficial && (
              <button
                type="button"
                onClick={() => controller.onToggleOfficial(post.id, !post.isOfficial)}
                aria-label={showOfficial ? "取消官方公告" : "轉為官方公告"}
                className={cn("text-muted-foreground hover:text-foreground", showOfficial && "text-primary")}
              >
                <BadgeCheck className="size-[18px]" strokeWidth={1.75} />
              </button>
            )}

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

function ShowMoreButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
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
  // 在展開的主幹裡，後面還接著下一節的話要繼續往下畫線，一整條鏈才會連在
  // 一起，而不是每則各自斷開。注意這裡的「sibling」是渲染上的下一則，在
  // 主幹裡它其實是這一則的子節點——所以畫垂直線是對的（規則 2）。
  hasFollowingSibling?: boolean
}) {
  const [showChildren, setShowChildren] = useState(false)

  const avatarSize = depth === 0 ? AVATAR_TOP : AVATAR_NESTED
  const railCenter = avatarSize / 2

  // 規則 1：縮排只在 depth 0 → 1 發生一次。depth ≥ 1 的子孫全部拉平，
  // 沿用上一層已經套過的 NEST_INDENT，自己不再往右加。
  const isFlattened = depth >= 1

  const hasFeatured = !!item.featuredChild
  const remainingCount = item.hiddenReplyCount
  // 展開之後顯示的是往下的主幹，主幹的第一節就是原本預覽的那則精選回覆
  // （兩邊都走 best_direct_child／reply_score 這條指標），不需要再預覽一次。
  const showFeatured = !showChildren && hasFeatured
  const showCollapsedMore = !showChildren && remainingCount > 0

  function handleExpand() {
    setShowChildren(true)
    if (!controller.childHasLoaded(item.post.id)) controller.onLoadMoreChildren(item.post.id)
  }

  // 曲線：從自己的 rail 中心往下、轉彎過去接巢狀頭貼。
  //
  // 水平段停在巢狀頭貼的**左緣**（NEST_INDENT），跟頭貼相切而不是穿進去。
  // 早期版本把終點算在頭貼中心（+ AVATAR_NESTED / 2），線會壓過圓形頭貼的
  // 左半邊；「終點落在頭貼正中心」是錯的驗收標準，正確的是「svg 的右緣 ≈
  // 頭貼的左緣」。
  const half = LINE_WIDTH / 2
  const curveEndX = NEST_INDENT - railCenter
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

  // 包住底下那一段的容器。這不是 React component（不能是，不然每次 render
  // 都會產生新的 component type，底下每一則 PostRow 的展開狀態會被重置），
  // 只是個回傳 JSX 的小工廠。
  //
  //   - depth 0：往右縮排一次，並用曲線把自己的 rail 轉彎接到巢狀頭貼左緣。
  //   - depth ≥ 1：不縮排、不轉彎，連上面的間距都不留——自己的 rail
  //     （EntryBody 的 pb-3 撐出來的那段）一路長到這個容器的頂端，下一則
  //     的頭貼緊接著開始，垂直線才會是連續的一條直線（規則 2）。
  function nestedBlock(children: ReactNode) {
    if (isFlattened) return <div className="flex flex-col">{children}</div>
    return (
      <div className="relative pt-3" style={{ paddingLeft: NEST_INDENT }}>
        {renderCurve()}
        {/* 不留 gap：每則的線靠自己的 pb-3 一路長到底，下一則緊接著開始，
            線才會連續。 */}
        <div className="flex flex-col">{children}</div>
      </div>
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

      {/* 收合：預覽主幹的第一節 */}
      {showFeatured &&
        item.featuredChild &&
        nestedBlock(
          <EntryBody entry={item.featuredChild} controller={controller} depth={depth + 1} avatarSize={AVATAR_NESTED} />
        )}

      {/* 收合狀態的「查看更多」：貼齊連接線正下方。只有在 depth 0 且已經有
          精選回覆時，線才轉彎到巢狀縮排，按鈕跟著縮排；其他情況線還是直的
          停在 rail 上，就對齊 rail 中心。 */}
      {showCollapsedMore && (
        <div className="pt-2" style={{ paddingLeft: showFeatured && !isFlattened ? NEST_INDENT : railCenter }}>
          <ShowMoreButton label={`查看更多（${remainingCount}）`} onClick={handleExpand} />
        </div>
      )}

      {/* 展開：往下的主幹是一條連續的鏈，全部同一個 x、線接在一起。
          鏈的尾巴如果底下還有回覆，它自己就會長出一顆「查看更多」繼續往下
          接——所以這裡不需要再放一顆 parent 層級的「載入更多」，那會變成
          兩顆按鈕做同一件事。 */}
      {showChildren &&
        nestedBlock(
          <>
            {controller.renderChildren(item.post.id, depth + 1)}
            {controller.childLoading(item.post.id) && <p className="text-xs text-muted-foreground">載入中…</p>}
          </>
        )}
    </div>
  )
}

// 把一條主幹畫成連續的一串。傳進來的每一則都是前一則的最佳子節點
// （getReplyChain 的定義），所以相鄰兩則之間畫的是代表「隸屬」的垂直線。
export function renderChain(chain: DiscussionItem[], depth: number, controller: PostRowController): ReactNode {
  return chain.map((child, index) => {
    const isLast = index === chain.length - 1
    return (
      <PostRow
        key={child.post.id}
        // 不是鏈尾的那幾則，它底下那一則就是自己的其中一個子回覆、已經顯示
        // 在畫面上了，「還沒展開的回覆數」要扣掉那一則。不扣的話每一節都會
        // 多長一顆「查看更多（1）」出來，把本來該連續的垂直線切斷。
        item={isLast ? child : { ...child, hiddenReplyCount: Math.max(0, child.hiddenReplyCount - 1) }}
        controller={controller}
        depth={depth}
        hasFollowingSibling={!isLast}
      />
    )
  })
}

// 規則 3：平行的兄弟回覆之間用水平分隔線區隔，而且不畫垂直線。用在
// root 的直接回覆列表、以及討論串頁裡焦點貼文的直接子回覆。
export function SiblingList<T>({
  items,
  getKey,
  render,
}: {
  items: T[]
  getKey: (item: T) => string
  render: (item: T, index: number) => ReactNode
}) {
  return (
    <div className="flex flex-col">
      {items.map((item, index) => (
        <div key={getKey(item)} className={cn("pb-5", index > 0 && "border-t border-border pt-5")}>
          {render(item, index)}
        </div>
      ))}
    </div>
  )
}
