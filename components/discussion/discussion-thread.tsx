"use client"

import { useOptimistic, useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { DiscussionEntry, DiscussionItem, DiscussionResponse, PollDTO, PostDTO, PostImageDTO } from "@/lib/discussion/dto"
import {
  loadReplyChain,
  loadThreadReplies,
  submitDeleteReply,
  submitEditReply,
  submitLike,
  submitRemovePostImages,
  submitReply,
  submitToggleOfficial,
  submitUnlike,
} from "@/lib/discussion/actions"
import type { SortMode } from "@/lib/discussion/queries"
import { ComposerOverlay, type ComposerTarget } from "./composer-overlay"
import { BottomComposerBar } from "./bottom-composer-bar"
import { PostRow, SiblingList, renderChain, type PostRowController } from "./post-row"
import { RootContent } from "./root-content"
import { buildPendingItem, patchList, patchChildrenMap, type ViewerInfo } from "./tree-utils"

// 規則 5：點進某一則貼文之後看到的畫面。
//
//   root post（跟祖先鏈接同一條線，見規則 2）
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

type Action = { kind: "patch"; postId: string; changes: Partial<DiscussionEntry> } | { kind: "insertReply"; item: DiscussionItem }

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
  }
}

export function DiscussionThread({
  root,
  ancestors,
  focus,
  viewer,
  isDiscussionAdmin,
  initialReplies,
}: {
  root: DiscussionItem
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

  // 回覆一律回覆「這一頁的焦點貼文」——回覆別人（祖先、或底下顯示的其他
  // 回覆）要先點進它自己的討論串頁，這裡不會另外針對某一則開回覆框（見
  // post-row.tsx）。回覆框裡要顯示完整的上文，用目前這條祖先鏈（chain，
  // 已經包含焦點貼文自己）當 context，一路排到最上層，不裁切。
  function handleOpenFocusComposer() {
    setComposerTarget({
      parentId: focusId,
      context: optimistic.chain.map((item) => ({
        id: item.post.id,
        authorName: item.post.authorName,
        content: item.post.content,
        isDeleted: item.post.isDeleted,
      })),
      // 只有工作人員以上能建立投票（server action 也會擋，見 mutations.ts）。
      allowPoll: viewer.role !== "attendee",
    })
  }

  function handleSubmitReply(content: string, poll?: { allowMultiple: boolean; options: string[] }, images?: PostImageDTO[]) {
    const tempId = `pending-${crypto.randomUUID()}`
    const pendingItem = buildPendingItem(tempId, content, viewer, poll, images)
    setReplyPending(true)

    startTransition(async () => {
      addOptimistic({ kind: "insertReply", item: pendingItem })
      const result = await submitReply(focusId, content, poll, images?.map((image) => image.id))
      if (result.ok) {
        setBase((prev) => reduce(prev, { kind: "insertReply", item: result.data }))
        setComposerTarget(null)
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

  function handleEdit(postId: string, content: string, images?: PostImageDTO[]) {
    const entry = findEntry(postId)
    if (!entry) return
    const editedPost: PostDTO = {
      ...entry.post,
      content,
      // 編輯時新加的圖接在原本那幾張後面，跟伺服器端的 position 一致。
      images: [...entry.post.images, ...(images ?? [])],
      updatedAt: new Date().toISOString(),
    }

    startTransition(async () => {
      addOptimistic({ kind: "patch", postId, changes: { post: editedPost } })
      const result = await submitEditReply(postId, content, images?.map((image) => image.id))
      if (result.ok) {
        setBase((prev) => reduce(prev, { kind: "patch", postId, changes: { post: editedPost } }))
      }
    })
  }

  // 移除已發布貼文上的某張圖。圖片在 R2 上是真的被刪掉（不可復原）——
  // 失敗的唯一原因是「不是作者」，那種情況畫面上本來就不會有這顆按鈕，
  // 所以不特別 rollback。
  function handleRemoveImage(postId: string, imageId: string) {
    const entry = findEntry(postId)
    if (!entry) return
    const nextPost: PostDTO = { ...entry.post, images: entry.post.images.filter((image) => image.id !== imageId) }

    startTransition(async () => {
      addOptimistic({ kind: "patch", postId, changes: { post: nextPost } })
      const result = await submitRemovePostImages(postId, [imageId])
      if (result.ok) setBase((prev) => reduce(prev, { kind: "patch", postId, changes: { post: nextPost } }))
    })
  }

  function handleToggleOfficial(postId: string, next: boolean) {
    const entry = findEntry(postId)
    if (!entry) return
    const patchedPost: PostDTO = { ...entry.post, isOfficial: next }

    startTransition(async () => {
      addOptimistic({ kind: "patch", postId, changes: { post: patchedPost } })
      const result = await submitToggleOfficial(postId, next)
      if (result.ok) setBase((prev) => reduce(prev, { kind: "patch", postId, changes: { post: patchedPost } }))
    })
  }

  // 規則 4：展開只顯示一條主幹。主幹查詢沒有分頁游標——鏈超過長度上限時，
  // 鏈尾那則自己會長出「查看更多」，點下去就是從它再走一段。
  async function handleLoadMoreChildren(postId: string, excludeChildId?: string) {
    if (childLoadingMap[postId]) return
    setChildLoadingMap((prev) => ({ ...prev, [postId]: true }))

    const result = await loadReplyChain(postId, excludeChildId)
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
    onLike: commitLikeToggle,
    onPollChange: handlePollChange,
    // 置頂只作用在 root 的直接回覆上（規格第 12 點），討論串頁看到的都不是
    // root 的直接回覆，所以這裡不提供置頂。
    onPin: () => {},
    onUnpin: () => {},
    onDelete: handleDelete,
    onEdit: handleEdit,
    onRemoveImage: handleRemoveImage,
    onToggleOfficial: handleToggleOfficial,
    onLoadMoreChildren: handleLoadMoreChildren,
    childLoading: (postId) => childLoadingMap[postId] ?? false,
    childHasLoaded: (postId) => loadedChildParents.has(postId),
    renderChildren: renderChildrenList,
    canPin: () => false,
  }

  const chain = optimistic.chain

  return (
    <div className="flex flex-col gap-8 pb-20">
      {/* root post + 祖先鏈 + 焦點貼文：全部 depth 0（不縮排），root 跟祖先
          鏈之間、祖先鏈內部除了最後一則之外都往下畫直線，一路串到焦點貼文
          （規則 2）。root 不用 patch／optimistic 那一套（不會被讚、刪除），
          直接吃頁面傳進來的 root prop。 */}
      <div className="flex flex-col">
        <RootContent
          rootPostId={root.post.id}
          content={root.post.content}
          images={root.post.images}
          isDiscussionAdmin={isDiscussionAdmin}
          hasRail
        />
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
