"use client"

import { useOptimistic, useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { DiscussionEntry, DiscussionItem, DiscussionResponse, PollDTO, PostDTO } from "@/lib/discussion/dto"
import {
  loadDiscussion,
  loadMoreReplies,
  submitLike,
  submitPin,
  submitDeleteReply,
  submitReply,
  submitUnlike,
  submitUnpin,
} from "@/lib/discussion/actions"
import type { SortMode } from "@/lib/discussion/queries"
import { ComposerOverlay, type ComposerTarget } from "./composer-overlay"
import { BottomComposerBar } from "./bottom-composer-bar"
import { PostRow, type PostRowController } from "./post-row"
import { patchList, patchChildrenMap } from "./tree-utils"

type ViewerInfo = {
  id: string
  name: string
  role: "attendee" | "staff" | "admin"
}

type DiscussionData = {
  pinned: DiscussionItem[]
  replies: DiscussionItem[]
  childrenByParentId: Record<string, DiscussionItem[]>
}

type Action =
  | { kind: "patch"; postId: string; changes: Partial<DiscussionEntry> }
  | { kind: "insertTopLevel"; item: DiscussionItem }
  | { kind: "insertChild"; parentId: string; item: DiscussionItem }
  | { kind: "pin"; postId: string }
  | { kind: "unpin"; postId: string }

function reduce(state: DiscussionData, action: Action): DiscussionData {
  switch (action.kind) {
    case "patch":
      return {
        pinned: patchList(state.pinned, action.postId, action.changes),
        replies: patchList(state.replies, action.postId, action.changes),
        childrenByParentId: patchChildrenMap(state.childrenByParentId, action.postId, action.changes),
      }
    case "insertTopLevel":
      return { ...state, replies: [action.item, ...state.replies] }
    case "insertChild":
      return {
        ...state,
        childrenByParentId: {
          ...state.childrenByParentId,
          [action.parentId]: [...(state.childrenByParentId[action.parentId] ?? []), action.item],
        },
      }
    case "pin": {
      const target = state.replies.find((r) => r.post.id === action.postId)
      if (!target) return state
      const pinned = { ...target, post: { ...target.post, isPinned: true } }
      return {
        ...state,
        replies: state.replies.filter((r) => r.post.id !== action.postId),
        pinned: [...state.pinned, pinned],
      }
    }
    case "unpin": {
      const target = state.pinned.find((r) => r.post.id === action.postId)
      if (!target) return state
      const unpinned = { ...target, post: { ...target.post, isPinned: false } }
      return {
        ...state,
        pinned: state.pinned.filter((r) => r.post.id !== action.postId),
        replies: [unpinned, ...state.replies],
      }
    }
  }
}

function buildPendingItem(
  tempId: string,
  content: string,
  author: ViewerInfo,
  poll?: { allowMultiple: boolean; options: string[] }
): DiscussionItem {
  const now = new Date().toISOString()
  return {
    post: {
      id: tempId,
      authorId: author.id,
      authorName: author.name,
      authorRole: author.role,
      content,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
      isPinned: false,
    },
    stats: { likeCount: 0, directReplyCount: 0 },
    viewer: { hasLiked: false },
    hiddenReplyCount: 0,
    poll: poll
      ? {
          postId: tempId,
          allowMultiple: poll.allowMultiple,
          closed: false,
          options: poll.options.map((label, i) => ({ id: `${tempId}-${i}`, label, voteCount: 0 })),
          viewerOptionIds: [],
        }
      : undefined,
  }
}

export function DiscussionView({
  rootKey,
  rootPostId,
  viewer,
  isDiscussionAdmin,
  initial,
}: {
  rootKey: string
  rootPostId: string
  viewer: ViewerInfo
  isDiscussionAdmin: boolean
  initial: DiscussionResponse
}) {
  const [sort, setSort] = useState<SortMode>("top")
  const [base, setBase] = useState<DiscussionData>({
    pinned: initial.pinnedReplies,
    replies: initial.replies,
    childrenByParentId: {},
  })
  const [cursor, setCursor] = useState<string | null>(initial.nextCursor)
  const [hasMore, setHasMore] = useState(initial.hasMore)
  const [optimistic, addOptimistic] = useOptimistic(base, reduce)
  const [, startTransition] = useTransition()

  const [composerTarget, setComposerTarget] = useState<ComposerTarget | null>(null)
  const [replyPending, setReplyPending] = useState(false)

  const [childCursor, setChildCursor] = useState<Record<string, string | null>>({})
  const [childHasMoreMap, setChildHasMoreMap] = useState<Record<string, boolean>>({})
  const [childLoadingMap, setChildLoadingMap] = useState<Record<string, boolean>>({})
  const [loadedChildParents, setLoadedChildParents] = useState<Set<string>>(new Set())

  const [pagePending, setPagePending] = useState(false)
  const [sortPending, setSortPending] = useState(false)

  function findEntry(postId: string): DiscussionEntry | undefined {
    const all = [...optimistic.pinned, ...optimistic.replies, ...Object.values(optimistic.childrenByParentId).flat()]
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

  function handleOpenRootComposer() {
    setComposerTarget({ parentId: rootPostId, replyingToName: null, replyingToContent: null, allowPoll: true })
  }

  function handleSubmitReply(parentId: string, content: string, poll?: { allowMultiple: boolean; options: string[] }) {
    const tempId = `pending-${crypto.randomUUID()}`
    const pendingItem = buildPendingItem(tempId, content, viewer, poll)
    const isRootParent = parentId === rootPostId
    setReplyPending(true)

    startTransition(async () => {
      addOptimistic(
        isRootParent
          ? { kind: "insertTopLevel", item: pendingItem }
          : { kind: "insertChild", parentId, item: pendingItem }
      )
      const result = await submitReply(parentId, content, poll)
      if (result.ok) {
        setBase((prev) =>
          reduce(
            prev,
            isRootParent
              ? { kind: "insertTopLevel", item: result.data }
              : { kind: "insertChild", parentId, item: result.data }
          )
        )
        setComposerTarget(null)
        if (!isRootParent) setLoadedChildParents((prev) => new Set(prev).add(parentId))
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

  function handlePin(postId: string) {
    startTransition(async () => {
      addOptimistic({ kind: "pin", postId })
      const result = await submitPin(rootPostId, postId)
      if (result.ok) setBase((prev) => reduce(prev, { kind: "pin", postId }))
    })
  }

  function handleUnpin(postId: string) {
    startTransition(async () => {
      addOptimistic({ kind: "unpin", postId })
      const result = await submitUnpin(rootPostId, postId)
      if (result.ok) setBase((prev) => reduce(prev, { kind: "unpin", postId }))
    })
  }

  async function handleLoadMoreChildren(postId: string, excludeId?: string) {
    setChildLoadingMap((prev) => ({ ...prev, [postId]: true }))
    const cursorForChild = childCursor[postId] ?? null
    const result = await loadMoreReplies(postId, cursorForChild, excludeId)
    if (result.ok) {
      setBase((prev) => ({
        ...prev,
        childrenByParentId: {
          ...prev.childrenByParentId,
          [postId]: [...(prev.childrenByParentId[postId] ?? []), ...result.data.replies],
        },
      }))
      setChildCursor((prev) => ({ ...prev, [postId]: result.data.nextCursor }))
      setChildHasMoreMap((prev) => ({ ...prev, [postId]: result.data.hasMore }))
      setLoadedChildParents((prev) => new Set(prev).add(postId))
    }
    setChildLoadingMap((prev) => ({ ...prev, [postId]: false }))
  }

  async function handleLoadMorePage() {
    setPagePending(true)
    const result = await loadDiscussion(rootKey, sort, cursor)
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
    const result = await loadDiscussion(rootKey, nextSort, null)
    if (result.ok) {
      setBase({ pinned: result.data.pinnedReplies, replies: result.data.replies, childrenByParentId: {} })
      setCursor(result.data.nextCursor)
      setHasMore(result.data.hasMore)
      setLoadedChildParents(new Set())
    }
    setSortPending(false)
  }

  function renderChildrenList(postId: string, depth: number) {
    const children = optimistic.childrenByParentId[postId] ?? []
    return children.map((child) => <PostRow key={child.post.id} item={child} controller={controller} depth={depth} />)
  }

  const controller: PostRowController = {
    viewerId: viewer.id,
    viewerRole: viewer.role,
    isDiscussionAdmin,
    onOpenComposer: handleOpenComposer,
    onLike: commitLikeToggle,
    onPollChange: handlePollChange,
    onPin: handlePin,
    onUnpin: handleUnpin,
    onDelete: handleDelete,
    onLoadMoreChildren: handleLoadMoreChildren,
    childLoading: (postId) => childLoadingMap[postId] ?? false,
    childHasLoaded: (postId) => loadedChildParents.has(postId),
    childHasMore: (postId) => childHasMoreMap[postId] ?? false,
    renderChildren: renderChildrenList,
    // 只有 root 的 direct reply（depth 0 的頂層項目）能被 pin，見規格第 12 點。
    canPin: (_item, depth) => isDiscussionAdmin && depth === 0,
  }

  return (
    <div className="flex flex-col gap-8 pb-20">
      {optimistic.pinned.length > 0 && (
        <div className="flex flex-col gap-6">
          {optimistic.pinned.map((item) => (
            <PostRow key={item.post.id} item={item} controller={controller} depth={0} />
          ))}
        </div>
      )}

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

      <div className={cn("flex flex-col gap-6", sortPending && "opacity-60")}>
        {optimistic.replies.length === 0 && optimistic.pinned.length === 0 ? (
          <p className="text-sm text-muted-foreground">還沒有人分享，成為第一個留言的人吧。</p>
        ) : (
          optimistic.replies.map((item) => <PostRow key={item.post.id} item={item} controller={controller} depth={0} />)
        )}
      </div>

      {hasMore && (
        <Button variant="outline" onClick={handleLoadMorePage} disabled={pagePending} className="self-center">
          顯示更多討論
        </Button>
      )}

      <BottomComposerBar placeholder="在這則討論中留言..." onOpen={handleOpenRootComposer} />

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
