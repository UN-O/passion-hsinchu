"use client"

import { useOptimistic, useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { DiscussionEntry, DiscussionItem, DiscussionResponse, PollDTO, PostDTO } from "@/lib/discussion/dto"
import {
  loadReplyChain,
  loadThreadReplies,
  submitDeleteReply,
  submitLike,
  submitReply,
  submitUnlike,
} from "@/lib/discussion/actions"
import type { SortMode } from "@/lib/discussion/queries"
import { ComposerOverlay, type ComposerTarget } from "./composer-overlay"
import { BottomComposerBar } from "./bottom-composer-bar"
import { PostRow, SiblingList, renderChain, type PostRowController } from "./post-row"
import { buildPendingItem, patchList, patchChildrenMap, type ViewerInfo } from "./tree-utils"

// 規則 5：點進某一則貼文之後看到的畫面。
//
//   祖先鏈（root → … → 焦點貼文的 parent，全部對齊同一個 x、用直線串起來）
//   焦點貼文
//   排序選單
//   焦點貼文的直接子回覆（互為兄弟，用水平線分隔，每則可以各自展開主幹）
//
// 祖先之間刻意不縮排：那條鏈已經是一路往下的隸屬關係，再縮排的話深一點的
// 討論串光是祖先就把整個畫面推到右邊。

type ThreadData = {
  // 祖先鏈 + 焦點貼文，焦點貼文永遠在最後一個
  chain: DiscussionItem[]
  replies: DiscussionItem[]
  childrenByParentId: Record<string, DiscussionItem[]>
}

type Action =
  | { kind: "patch"; postId: string; changes: Partial<DiscussionEntry> }
  | { kind: "insertReply"; item: DiscussionItem }
  | { kind: "insertChild"; parentId: string; item: DiscussionItem }

function reduce(state: ThreadData, action: Action): ThreadData {
  switch (action.kind) {
    case "patch":
      return {
        chain: patchList(state.chain, action.postId, action.changes),
        replies: patchList(state.replies, action.postId, action.changes),
        childrenByParentId: patchChildrenMap(state.childrenByParentId, action.postId, action.changes),
      }
    case "insertReply":
      return { ...state, replies: [action.item, ...state.replies] }
    case "insertChild":
      // 放在最前面：新回覆是 parent 的「直接」子回覆，位置跟主幹的第一節
      // 同一層。接在最後面的話，它會被畫成主幹鏈尾的子節點——那是別人的
      // 回覆，不是它的 parent。
      return {
        ...state,
        childrenByParentId: {
          ...state.childrenByParentId,
          [action.parentId]: [action.item, ...(state.childrenByParentId[action.parentId] ?? [])],
        },
      }
  }
}

export function DiscussionThread({
  ancestors,
  focus,
  viewer,
  isDiscussionAdmin,
  initialReplies,
}: {
  ancestors: DiscussionItem[]
  focus: DiscussionItem
  viewer: ViewerInfo
  isDiscussionAdmin: boolean
  initialReplies: DiscussionResponse
}) {
  const focusId = focus.post.id

  const [sort, setSort] = useState<SortMode>("top")
  const [base, setBase] = useState<ThreadData>({
    chain: [...ancestors, focus],
    replies: initialReplies.replies,
    childrenByParentId: {},
  })
  const [cursor, setCursor] = useState<string | null>(initialReplies.nextCursor)
  const [hasMore, setHasMore] = useState(initialReplies.hasMore)
  const [optimistic, addOptimistic] = useOptimistic(base, reduce)
  const [, startTransition] = useTransition()

  const [composerTarget, setComposerTarget] = useState<ComposerTarget | null>(null)
  const [replyPending, setReplyPending] = useState(false)

  const [childLoadingMap, setChildLoadingMap] = useState<Record<string, boolean>>({})
  const [loadedChildParents, setLoadedChildParents] = useState<Set<string>>(new Set())

  const [pagePending, setPagePending] = useState(false)
  const [sortPending, setSortPending] = useState(false)

  function findEntry(postId: string): DiscussionEntry | undefined {
    const all = [...optimistic.chain, ...optimistic.replies, ...Object.values(optimistic.childrenByParentId).flat()]
    const direct = all.find((i) => i.post.id === postId)
    if (direct) return direct
    return all.find((i) => i.featuredChild?.post.id === postId)?.featuredChild
  }

  function commitLikeToggle(entry: DiscussionEntry) {
    const wasLiked = entry.viewer.hasLiked
    const changes: Partial<DiscussionEntry> = {
      viewer: { ...entry.viewer, hasLiked: !wasLiked },
      stats: { ...entry.stats, likeCount: entry.stats.likeCount + (wasLiked ? -1 : 1) },
    }
    startTransition(async () => {
      addOptimistic({ kind: "patch", postId: entry.post.id, changes })
      const result = wasLiked ? await submitUnlike(entry.post.id) : await submitLike(entry.post.id)
      if (result.ok) {
        setBase((prev) =>
          reduce(prev, {
            kind: "patch",
            postId: entry.post.id,
            changes: { viewer: changes.viewer, stats: { ...entry.stats, likeCount: result.data.likeCount } },
          })
        )
      }
    })
  }

  function handlePollChange(postId: string, next: Pick<PollDTO, "options" | "viewerOptionIds">) {
    const entry = findEntry(postId)
    if (!entry?.poll) return
    const merged: PollDTO = { ...entry.poll, ...next }
    setBase((prev) => reduce(prev, { kind: "patch", postId, changes: { poll: merged } }))
  }

  function handleOpenComposer(entry: DiscussionEntry) {
    setComposerTarget({
      parentId: entry.post.id,
      replyingToName: entry.post.authorName,
      replyingToContent: entry.post.content,
      allowPoll: true,
    })
  }

  function handleOpenFocusComposer() {
    handleOpenComposer(focus)
  }

  function handleSubmitReply(parentId: string, content: string, poll?: { allowMultiple: boolean; options: string[] }) {
    const tempId = `pending-${crypto.randomUUID()}`
    const pendingItem = buildPendingItem(tempId, content, viewer, poll)
    // 回覆焦點貼文的話直接插進下面那串兄弟；回覆其他人的話進到那則的子清單。
    const isFocusParent = parentId === focusId
    setReplyPending(true)

    startTransition(async () => {
      addOptimistic(
        isFocusParent ? { kind: "insertReply", item: pendingItem } : { kind: "insertChild", parentId, item: pendingItem }
      )
      const result = await submitReply(parentId, content, poll)
      if (result.ok) {
        setBase((prev) =>
          reduce(
            prev,
            isFocusParent
              ? { kind: "insertReply", item: result.data }
              : { kind: "insertChild", parentId, item: result.data }
          )
        )
        setComposerTarget(null)
        if (!isFocusParent) setLoadedChildParents((prev) => new Set(prev).add(parentId))
      }
      setReplyPending(false)
    })
  }

  function handleDelete(postId: string) {
    const entry = findEntry(postId)
    if (!entry) return
    const deletedDto: PostDTO = { ...entry.post, content: "", isDeleted: true }

    startTransition(async () => {
      addOptimistic({ kind: "patch", postId, changes: { post: deletedDto } })
      const result = await submitDeleteReply(postId)
      if (result.ok) {
        setBase((prev) => reduce(prev, { kind: "patch", postId, changes: { post: deletedDto } }))
      }
    })
  }

  // 規則 4：展開只顯示一條主幹。主幹查詢沒有分頁游標——鏈超過長度上限時，
  // 鏈尾那則自己會長出「查看更多」，點下去就是從它再走一段。
  async function handleLoadMoreChildren(postId: string) {
    if (childLoadingMap[postId]) return
    setChildLoadingMap((prev) => ({ ...prev, [postId]: true }))

    const result = await loadReplyChain(postId)
    if (result.ok) {
      setBase((prev) => ({
        ...prev,
        childrenByParentId: { ...prev.childrenByParentId, [postId]: result.data },
      }))
      setLoadedChildParents((prev) => new Set(prev).add(postId))
    }
    setChildLoadingMap((prev) => ({ ...prev, [postId]: false }))
  }

  async function handleLoadMorePage() {
    setPagePending(true)
    const result = await loadThreadReplies(focusId, sort, cursor)
    if (result.ok) {
      setBase((prev) => ({ ...prev, replies: [...prev.replies, ...result.data.replies] }))
      setCursor(result.data.nextCursor)
      setHasMore(result.data.hasMore)
    }
    setPagePending(false)
  }

  async function handleSortChange(nextSort: SortMode) {
    if (nextSort === sort) return
    setSort(nextSort)
    setSortPending(true)
    const result = await loadThreadReplies(focusId, nextSort, null)
    if (result.ok) {
      setBase((prev) => ({ ...prev, replies: result.data.replies, childrenByParentId: {} }))
      setCursor(result.data.nextCursor)
      setHasMore(result.data.hasMore)
      setLoadedChildParents(new Set())
    }
    setSortPending(false)
  }

  function renderChildrenList(postId: string, depth: number) {
    return renderChain(optimistic.childrenByParentId[postId] ?? [], depth, controller)
  }

  const controller: PostRowController = {
    viewerId: viewer.id,
    viewerRole: viewer.role,
    isDiscussionAdmin,
    onOpenComposer: handleOpenComposer,
    onLike: commitLikeToggle,
    onPollChange: handlePollChange,
    // 置頂只作用在 root 的直接回覆上（規格第 12 點），討論串頁看到的都不是
    // root 的直接回覆，所以這裡不提供置頂。
    onPin: () => {},
    onUnpin: () => {},
    onDelete: handleDelete,
    onLoadMoreChildren: handleLoadMoreChildren,
    childLoading: (postId) => childLoadingMap[postId] ?? false,
    childHasLoaded: (postId) => loadedChildParents.has(postId),
    renderChildren: renderChildrenList,
    canPin: () => false,
  }

  const chain = optimistic.chain

  return (
    <div className="flex flex-col gap-8 pb-20">
      {/* 祖先鏈 + 焦點貼文：全部 depth 0（不縮排），除了最後一則之外都往下
          畫直線，一路串到焦點貼文。 */}
      <div className="flex flex-col">
        {chain.map((item, index) => (
          <PostRow
            key={item.post.id}
            // 這裡的每一則底下都還有更多回覆，但那些回覆就是接下來要顯示的
            // 東西，不需要再給一顆「查看更多」——所以隱藏數歸零。
            item={{ ...item, hiddenReplyCount: 0, featuredChild: undefined }}
            controller={controller}
            depth={0}
            hasFollowingSibling={index < chain.length - 1}
          />
        ))}
      </div>

      <div className="flex items-center border-t border-border pt-4">
        <select
          value={sort}
          onChange={(e) => handleSortChange(e.target.value as SortMode)}
          aria-label="排序方式"
          className="rounded-full border border-border bg-transparent px-3 py-1.5 text-sm outline-none"
        >
          <option value="top">熱門</option>
          <option value="latest">最新</option>
        </select>
      </div>

      {/* 焦點貼文的直接子回覆：互為兄弟，用水平線分隔、不畫垂直線（規則 3）。 */}
      <div className={cn(sortPending && "opacity-60")}>
        {optimistic.replies.length === 0 ? (
          <p className="text-sm text-muted-foreground">還沒有人回覆這則，成為第一個回覆的人吧。</p>
        ) : (
          <SiblingList
            items={optimistic.replies}
            getKey={(item) => item.post.id}
            render={(item) => <PostRow item={item} controller={controller} depth={0} />}
          />
        )}
      </div>

      {hasMore && (
        <Button variant="outline" onClick={handleLoadMorePage} disabled={pagePending} className="self-center">
          顯示更多回覆
        </Button>
      )}

      <BottomComposerBar placeholder="回覆這則討論..." onOpen={handleOpenFocusComposer} />

      <ComposerOverlay
        key={composerTarget?.parentId ?? "closed"}
        target={composerTarget}
        pending={replyPending}
        onSubmit={handleSubmitReply}
        onClose={() => setComposerTarget(null)}
      />
    </div>
  )
}
