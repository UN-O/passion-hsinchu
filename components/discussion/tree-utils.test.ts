import { test } from "node:test"
import assert from "node:assert/strict"

import type { DiscussionItem } from "@/lib/discussion/dto"
import { patchChildrenMap, patchItem, patchList } from "./tree-utils"

function makeItem(id: string, overrides?: Partial<DiscussionItem>): DiscussionItem {
  return {
    post: {
      id,
      authorId: "user-1",
      authorName: "測試",
      authorRole: "attendee",
      content: "內容",
      createdAt: "2026-08-20T00:00:00.000Z",
      updatedAt: "2026-08-20T00:00:00.000Z",
      isDeleted: false,
      isPinned: false,
      isOfficial: false,
      images: [],
      linkPreview: null,
    },
    stats: { likeCount: 0, directReplyCount: 0 },
    viewer: { hasLiked: false },
    hiddenReplyCount: 0,
    ...overrides,
  }
}

test("patchItem：只改到符合 id 的欄位，其他 item 完全不動（stable identity）", () => {
  const item = makeItem("a")
  const patched = patchItem(item, "a", { stats: { likeCount: 1, directReplyCount: 0 } })
  assert.equal(patched.stats.likeCount, 1)
  assert.notEqual(patched, item) // 有變更的物件應該是新的 reference

  const untouched = patchItem(item, "other-id", { stats: { likeCount: 99, directReplyCount: 0 } })
  assert.equal(untouched, item) // 沒配對到的話回傳同一個 reference，避免不必要的 re-render
})

test("patchItem：也會更新 featuredChild（一個 post 同時出現在別人的 featuredChild 裡）", () => {
  const child = makeItem("child-1")
  const parent = makeItem("parent-1", { featuredChild: child })

  const patched = patchItem(parent, "child-1", { viewer: { hasLiked: true } })
  assert.equal(patched.featuredChild?.viewer.hasLiked, true)
  // parent 自己的欄位沒被動到
  assert.equal(patched.post.id, "parent-1")
})

test("patchList：list 裡只有目標 item 換了 reference，其餘 item 維持原 reference（React key 穩定性）", () => {
  const a = makeItem("a")
  const b = makeItem("b")
  const c = makeItem("c")
  const list = [a, b, c]

  const next = patchList(list, "b", { stats: { likeCount: 5, directReplyCount: 0 } })

  assert.equal(next[0], a)
  assert.notEqual(next[1], b)
  assert.equal(next[1].stats.likeCount, 5)
  assert.equal(next[2], c)
})

test("patchChildrenMap：巢狀回覆 map 裡任一層都能被 patch 到", () => {
  const nested = makeItem("nested-1")
  const map = { "parent-x": [nested] }

  const next = patchChildrenMap(map, "nested-1", { stats: { likeCount: 3, directReplyCount: 0 } })
  assert.equal(next["parent-x"][0].stats.likeCount, 3)
})
