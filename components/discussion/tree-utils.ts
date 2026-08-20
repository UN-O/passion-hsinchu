import type { DiscussionEntry, DiscussionItem } from "@/lib/discussion/dto"

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
