"use client"

import { useOptimistic, useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { DiscussionEntry, DiscussionItem, DiscussionResponse, PollDTO, PostDTO, PostImageDTO } from "@/lib/discussion/dto"
import {
  loadDiscussion,
  loadReplyChain,
  submitLike,
  submitPin,
  submitDeleteReply,
  submitEditReply,
  submitRemovePostImages,
  submitReply,
  submitToggleOfficial,
  submitUnlike,
  submitUnpin,
} from "@/lib/discussion/actions"
import type { SortMode } from "@/lib/discussion/queries"
import { ComposerOverlay, type ComposerTarget } from "./composer-overlay"
import { BottomComposerBar } from "./bottom-composer-bar"
import { PostRow, SiblingList, renderChain, type PostRowController } from "./post-row"
import { buildPendingItem, patchList, patchChildrenMap, type ViewerInfo } from "./tree-utils"

type DiscussionData = {
  replies: DiscussionItem[]
  childrenByParentId: Record<string, DiscussionItem[]>
}

type Action =
  | { kind: "patch"; postId: string; changes: Partial<DiscussionEntry> }
  | { kind: "insertTopLevel"; item: DiscussionItem }

function reduce(state: DiscussionData, action: Action): DiscussionData {
  switch (action.kind) {
    case "patch":
      return {
        replies: patchList(state.replies, action.postId, action.changes),
        childrenByParentId: patchChildrenMap(state.childrenByParentId, action.postId, action.changes),
      }
    case "insertTopLevel":
      return { ...state, replies: [action.item, ...state.replies] }
  }
}

export function DiscussionView({
  rootKey,
  rootPostId,
  viewer,
  isDiscussionAdmin,
  initial,
  showTeamFilter = false,
}: {
  rootKey: string
  rootPostId: string
  viewer: ViewerInfo
  isDiscussionAdmin: boolean
  initial: DiscussionResponse
  // 只有 CAMP 討論、而且使用者自己有進小隊名單時才顯示「小隊」這個排序選項
  // （見 discussion-root.tsx 的 getViewerCampTeam）。
  showTeamFilter?: boolean
}) {
  const [sort, setSort] = useState<SortMode>("top")
  const [base, setBase] = useState<DiscussionData>({
    replies: initial.replies,
    childrenByParentId: {},
  })
  const [cursor, setCursor] = useState<string | null>(initial.nextCursor)
  const [hasMore, setHasMore] = useState(initial.hasMore)
  const [optimistic, addOptimistic] = useOptimistic(base, reduce)
  const [, startTransition] = useTransition()

  const [composerTarget, setComposerTarget] = useState<ComposerTarget | null>(null)
  const [replyPending, setReplyPending] = useState(false)

  const [childLoadingMap, setChildLoadingMap] = useState<Record<string, boolean>>({})
  const [loadedChildParents, setLoadedChildParents] = useState<Set<string>>(new Set())

  const [pagePending, setPagePending] = useState(false)
  const [sortPending, setSortPending] = useState(false)

  function findEntry(postId: string): DiscussionEntry | undefined {
    const all = [...optimistic.replies, ...Object.values(optimistic.childrenByParentId).flat()]
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

  // 回覆一律先進到某則貼文自己的討論串頁（有返回鍵可以回來），全螢幕的
  // 回覆框只在那一頁裡才會出現——這裡（root 層級的討論列表）只有「在這則
  // 討論中留言」這個入口，直接回覆 root，不會有針對某一則貼文另外開框的
  // 情況（見 post-row.tsx：貼文本身跟回覆 icon 都改成連到討論串頁）。
  function handleOpenRootComposer() {
    // 只有工作人員以上能建立投票（server action 也會擋，見 mutations.ts）。
    setComposerTarget({ parentId: rootPostId, context: [], allowPoll: viewer.role !== "attendee" })
  }

  function handleSubmitReply(content: string, poll?: { allowMultiple: boolean; options: string[] }, images?: PostImageDTO[]) {
    const tempId = `pending-${crypto.randomUUID()}`
    const pendingItem = buildPendingItem(tempId, content, viewer, poll, images)
    setReplyPending(true)

    startTransition(async () => {
      addOptimistic({ kind: "insertTopLevel", item: pendingItem })
      const result = await submitReply(rootPostId, content, poll, images?.map((image) => image.id))
      if (result.ok) {
        setBase((prev) => reduce(prev, { kind: "insertTopLevel", item: result.data }))
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

  function handleEdit(postId: string, content: string) {
    const entry = findEntry(postId)
    if (!entry) return
    const editedPost: PostDTO = { ...entry.post, content, updatedAt: new Date().toISOString() }

    startTransition(async () => {
      addOptimistic({ kind: "patch", postId, changes: { post: editedPost } })
      const result = await submitEditReply(postId, content)
      if (result.ok) {
        setBase((prev) => reduce(prev, { kind: "patch", postId, changes: { post: editedPost } }))
      }
    })
  }

  // 移除已發布貼文上的某張圖。圖片在 R2 上是真的被刪掉（不可復原），所以
  // 樂觀更新之後如果 server 回失敗，畫面上那張圖會在下次載入時回來——
  // 不特別 rollback，因為失敗的唯一原因是「不是作者」，那種情況畫面上
  // 本來就不會有這顆按鈕。
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

  // 置頂／取消置頂只是切換 isPinned 這個標記（EntryBody 上的「已置頂」
  // 徽章），貼文留在原本排序的位置，不會被搬到另一個區塊。
  function handlePin(postId: string) {
    const entry = findEntry(postId)
    if (!entry) return
    const pinnedPost: PostDTO = { ...entry.post, isPinned: true }

    startTransition(async () => {
      addOptimistic({ kind: "patch", postId, changes: { post: pinnedPost } })
      const result = await submitPin(rootPostId, postId)
      if (result.ok) setBase((prev) => reduce(prev, { kind: "patch", postId, changes: { post: pinnedPost } }))
    })
  }

  function handleUnpin(postId: string) {
    const entry = findEntry(postId)
    if (!entry) return
    const unpinnedPost: PostDTO = { ...entry.post, isPinned: false }

    startTransition(async () => {
      addOptimistic({ kind: "patch", postId, changes: { post: unpinnedPost } })
      const result = await submitUnpin(rootPostId, postId)
      if (result.ok) setBase((prev) => reduce(prev, { kind: "patch", postId, changes: { post: unpinnedPost } }))
    })
  }

  // 官方旗標只換顯示（見 mutations.ts toggleOfficial 的說明），一樣走
  // patch，不影響貼文在列表裡的位置。
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

  // 規則 4：展開只顯示「一條主幹」，不是把整層子回覆攤開。
  //
  // 主幹查詢沒有分頁游標——它從這個節點開始，順著
  // reply_rank.best_direct_child_id 往下走最多 K 步。鏈超過 K 的時候不需要
  // 另外的分頁：鏈尾那則自己會長出「查看更多」，點下去就是從它再走一段。
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
      setBase({ replies: result.data.replies, childrenByParentId: {} })
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
    onPin: handlePin,
    onUnpin: handleUnpin,
    onDelete: handleDelete,
    onEdit: handleEdit,
    onRemoveImage: handleRemoveImage,
    onToggleOfficial: handleToggleOfficial,
    onLoadMoreChildren: handleLoadMoreChildren,
    childLoading: (postId) => childLoadingMap[postId] ?? false,
    childHasLoaded: (postId) => loadedChildParents.has(postId),
    renderChildren: renderChildrenList,
    // 只有 root 的 direct reply（depth 0 的頂層項目）能被 pin，見規格第 12 點。
    canPin: (_item, depth) => isDiscussionAdmin && depth === 0,
  }

  return (
    <div className="flex flex-col gap-8 pb-20">
      <div className="flex items-center border-t border-border pt-4">
        <select
          value={sort}
          onChange={(e) => handleSortChange(e.target.value as SortMode)}
          aria-label="排序方式"
          className="rounded-full border border-border bg-transparent px-3 py-1.5 text-sm outline-none"
        >
          <option value="top">熱門</option>
          <option value="latest">最新</option>
          {showTeamFilter && <option value="team">小隊</option>}
        </select>
      </div>

      {/* root 的直接回覆彼此不隸屬，用水平分隔線區隔（規則 3）。置頂的貼文
          留在原本排序的位置，只是多一個「已置頂」徽章，不會被搬到另一個
          區塊——所以這裡就是單一份 replies 列表，沒有另外的 pinned 區塊。 */}
      <div className={cn(sortPending && "opacity-60")}>
        {optimistic.replies.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {sort === "team" ? "小隊裡還沒有人在這則討論留言。" : "還沒有人分享，成為第一個留言的人吧。"}
          </p>
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
