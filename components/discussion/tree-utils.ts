import type { DiscussionEntry, DiscussionItem, UserRole } from "@/lib/discussion/dto"

export type ViewerInfo = {
  id: string
  name: string
  role: UserRole
}

// 送出回覆時先放進畫面的暫時項目（樂觀更新）。server action 回來之後會被
// 真正的那筆取代。討論串頁跟討論主頁共用同一份，兩邊的樂觀更新才會長一樣。
export function buildPendingItem(
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
      isOfficial: false,
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

// 這個檔案只做「在本地 state 樹裡找到某個 post 並套用 patch」，不碰網路。
// mutation 完成後永遠是 local patch，不是整包 DiscussionResponse 替換掉
// ——即使某個 post 同時出現在 top-level 列表跟別人的 featuredChild 裡，
// 兩個地方都要一起更新，畫面才會一致。

function applyIfMatch<T extends DiscussionEntry>(entry: T, postId: string, patch: Partial<DiscussionEntry>): T {
  if (entry.post.id !== postId) return entry
  return { ...entry, ...patch }
}

export function patchItem(item: DiscussionItem, postId: string, patch: Partial<DiscussionEntry>): DiscussionItem {
  let next = applyIfMatch(item, postId, patch)
  if (next.featuredChild) {
    const patchedChild = applyIfMatch(next.featuredChild, postId, patch)
    if (patchedChild !== next.featuredChild) next = { ...next, featuredChild: patchedChild }
  }
  return next
}

export function patchList(list: DiscussionItem[], postId: string, patch: Partial<DiscussionEntry>): DiscussionItem[] {
  return list.map((item) => patchItem(item, postId, patch))
}

export function patchChildrenMap(
  map: Record<string, DiscussionItem[]>,
  postId: string,
  patch: Partial<DiscussionEntry>
): Record<string, DiscussionItem[]> {
  const next: Record<string, DiscussionItem[]> = {}
  for (const [parentId, items] of Object.entries(map)) {
    next[parentId] = patchList(items, postId, patch)
  }
  return next
}
