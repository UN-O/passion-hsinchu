import { and, desc, eq, inArray, isNull, ne, notInArray, sql, type SQL } from "drizzle-orm"
import { alias, type AnyPgColumn } from "drizzle-orm/pg-core"

import { db } from "@/db"
import { user } from "@/db/schema/auth"
import {
  discussionPins,
  pollOptions,
  polls,
  postLikes,
  posts,
  pollVotes,
  replyRank,
} from "@/db/schema/discussion"
import { DISCUSSION_RANKING_CONFIG } from "./ranking"
import { DiscussionError } from "./constants"
import type { DiscussionEntry, DiscussionItem, DiscussionResponse, MoreRepliesResponse, PollDTO, PostDTO } from "./dto"

export type SortMode = "top" | "latest"

type CandidateRow = {
  post: typeof posts.$inferSelect
  authorName: string | null
  authorRole: "attendee" | "staff" | "admin" | null
  likeCount: number
  directReplyCount: number
  bestDirectChildId: string | null
  branchScore: number | null
}

function clampLimit(limit: number | undefined): number {
  const requested = limit ?? DISCUSSION_RANKING_CONFIG.defaultPageSize
  // 不相信 client 傳來的任意 limit——上限由 server 決定，見規格第 41 點。
  return Math.max(1, Math.min(requested, DISCUSSION_RANKING_CONFIG.maxPageSize))
}

type Cursor = { id: string; branchScore?: number; createdAt?: string }

function encodeCursor(c: Cursor): string {
  return Buffer.from(JSON.stringify(c)).toString("base64url")
}

function decodeCursor(raw: string): Cursor {
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"))
    if (typeof parsed?.id !== "string") throw new Error("invalid")
    return parsed
  } catch {
    throw new DiscussionError("分頁游標無效")
  }
}

function toPostDTO(row: CandidateRow, pinnedIds: Set<string>): PostDTO {
  const isDeleted = row.post.deletedAt !== null
  return {
    id: row.post.id,
    authorId: row.post.authorId,
    authorName: row.authorName,
    authorRole: row.authorRole,
    content: isDeleted ? "" : row.post.content,
    createdAt: row.post.createdAt.toISOString(),
    updatedAt: row.post.updatedAt.toISOString(),
    isDeleted,
    isPinned: pinnedIds.has(row.post.id),
  }
}

async function fetchPinned(rootPostId: string): Promise<CandidateRow[]> {
  const rows = await db
    .select({
      post: posts,
      authorName: user.name,
      authorRole: user.role,
      likeCount: replyRank.likeCount,
      directReplyCount: replyRank.directReplyCount,
      bestDirectChildId: replyRank.bestDirectChildId,
      branchScore: replyRank.branchScore,
      position: discussionPins.position,
    })
    .from(discussionPins)
    .innerJoin(posts, eq(posts.id, discussionPins.postId))
    .leftJoin(user, eq(user.id, posts.authorId))
    .leftJoin(replyRank, eq(replyRank.postId, posts.id))
    .where(eq(discussionPins.rootPostId, rootPostId))
    .orderBy(discussionPins.position)

  return rows.map((r) => ({
    post: r.post,
    authorName: r.authorName,
    authorRole: r.authorRole,
    likeCount: r.likeCount ?? 0,
    directReplyCount: r.directReplyCount ?? 0,
    bestDirectChildId: r.bestDirectChildId ?? null,
    branchScore: r.branchScore ?? null,
  }))
}

// Top：走 reply_rank_parent_branch_score_idx (parent_id, branch_score DESC, post_id DESC)。
async function fetchTopCandidates(
  parentPostId: string,
  excludeIds: string[],
  cursor: Cursor | null,
  limit: number
): Promise<CandidateRow[]> {
  const conditions = [eq(replyRank.parentId, parentPostId), isNull(posts.deletedAt)]
  if (excludeIds.length > 0) conditions.push(sqlNotIn(replyRank.postId, excludeIds))
  if (cursor?.branchScore !== undefined) {
    conditions.push(cursorBefore(replyRank.branchScore, replyRank.postId, cursor.branchScore, cursor.id))
  }

  const rows = await db
    .select({
      post: posts,
      authorName: user.name,
      authorRole: user.role,
      likeCount: replyRank.likeCount,
      directReplyCount: replyRank.directReplyCount,
      bestDirectChildId: replyRank.bestDirectChildId,
      branchScore: replyRank.branchScore,
    })
    .from(replyRank)
    .innerJoin(posts, eq(posts.id, replyRank.postId))
    .leftJoin(user, eq(user.id, posts.authorId))
    .where(and(...conditions))
    .orderBy(desc(replyRank.branchScore), desc(replyRank.postId))
    .limit(limit + 1) // LIMIT+1：判斷 hasMore 不用額外的 COUNT，見規格第 43 點

  return rows.map((r) => ({ ...r, likeCount: r.likeCount ?? 0, directReplyCount: r.directReplyCount ?? 0 }))
}

// Latest：走 posts_reply_to_created_idx (reply_to_id, created_at DESC, id DESC)。
async function fetchLatestCandidates(
  parentPostId: string,
  excludeIds: string[],
  cursor: Cursor | null,
  limit: number
): Promise<CandidateRow[]> {
  const conditions = [eq(posts.replyToId, parentPostId), isNull(posts.deletedAt)]
  if (excludeIds.length > 0) conditions.push(sqlNotIn(posts.id, excludeIds))
  if (cursor?.createdAt !== undefined) {
    conditions.push(cursorBefore(posts.createdAt, posts.id, new Date(cursor.createdAt), cursor.id))
  }

  const rows = await db
    .select({
      post: posts,
      authorName: user.name,
      authorRole: user.role,
      likeCount: replyRank.likeCount,
      directReplyCount: replyRank.directReplyCount,
      bestDirectChildId: replyRank.bestDirectChildId,
      branchScore: replyRank.branchScore,
    })
    .from(posts)
    .leftJoin(user, eq(user.id, posts.authorId))
    .leftJoin(replyRank, eq(replyRank.postId, posts.id))
    .where(and(...conditions))
    .orderBy(desc(posts.createdAt), desc(posts.id))
    .limit(limit + 1)

  return rows.map((r) => ({
    ...r,
    likeCount: r.likeCount ?? 0,
    directReplyCount: r.directReplyCount ?? 0,
    branchScore: r.branchScore ?? null,
  }))
}

async function fetchByIds(ids: string[]): Promise<CandidateRow[]> {
  if (ids.length === 0) return []
  const rows = await db
    .select({
      post: posts,
      authorName: user.name,
      authorRole: user.role,
      likeCount: replyRank.likeCount,
      directReplyCount: replyRank.directReplyCount,
      bestDirectChildId: replyRank.bestDirectChildId,
      branchScore: replyRank.branchScore,
    })
    .from(posts)
    .leftJoin(user, eq(user.id, posts.authorId))
    .leftJoin(replyRank, eq(replyRank.postId, posts.id))
    .where(inArray(posts.id, ids))

  return rows.map((r) => ({
    ...r,
    likeCount: r.likeCount ?? 0,
    directReplyCount: r.directReplyCount ?? 0,
    branchScore: r.branchScore ?? null,
  }))
}

async function fetchPollsByPostIds(postIds: string[], viewerId: string | null): Promise<Map<string, PollDTO>> {
  if (postIds.length === 0) return new Map()

  const [pollRows, optionRows, viewerVoteRows] = await Promise.all([
    db.select().from(polls).where(inArray(polls.postId, postIds)),
    db.select().from(pollOptions).where(inArray(pollOptions.pollPostId, postIds)).orderBy(pollOptions.position),
    viewerId
      ? db
          .select({ pollPostId: pollVotes.pollPostId, pollOptionId: pollVotes.pollOptionId })
          .from(pollVotes)
          .where(and(inArray(pollVotes.pollPostId, postIds), eq(pollVotes.userId, viewerId)))
      : Promise.resolve([]),
  ])

  const optionsByPoll = new Map<string, PollDTO["options"]>()
  for (const option of optionRows) {
    const list = optionsByPoll.get(option.pollPostId) ?? []
    list.push({ id: option.id, label: option.label, voteCount: option.voteCount })
    optionsByPoll.set(option.pollPostId, list)
  }

  const votesByPoll = new Map<string, string[]>()
  for (const vote of viewerVoteRows) {
    const list = votesByPoll.get(vote.pollPostId) ?? []
    list.push(vote.pollOptionId)
    votesByPoll.set(vote.pollPostId, list)
  }

  const result = new Map<string, PollDTO>()
  for (const poll of pollRows) {
    result.set(poll.postId, {
      postId: poll.postId,
      allowMultiple: poll.allowMultiple,
      closed: poll.closedAt !== null,
      options: optionsByPoll.get(poll.postId) ?? [],
      viewerOptionIds: votesByPoll.get(poll.postId) ?? [],
    })
  }
  return result
}

async function enrichRows(
  rows: CandidateRow[],
  viewerId: string | null,
  pinnedIds: Set<string>,
  // 拉平顯示的主幹鏈不需要再各自預覽 featured child（鏈本身就是往下的預覽），
  // 這時候跳過那一輪批次查詢，省掉一次不必要的往返。
  options?: { withFeaturedChild?: boolean }
): Promise<DiscussionItem[]> {
  if (rows.length === 0) return []

  const withFeaturedChild = options?.withFeaturedChild ?? true
  const featuredChildIds = withFeaturedChild
    ? [...new Set(rows.map((r) => r.bestDirectChildId).filter((id): id is string => id !== null))]
    : []
  const featuredRows = await fetchByIds(featuredChildIds)

  const allRows = [...rows, ...featuredRows]
  const allIds = allRows.map((r) => r.post.id)

  const [pollByPostId, likedIds] = await Promise.all([
    fetchPollsByPostIds(allIds, viewerId),
    viewerId
      ? db
          .select({ postId: postLikes.postId })
          .from(postLikes)
          .where(and(inArray(postLikes.postId, allIds), eq(postLikes.userId, viewerId)))
      : Promise.resolve([]),
  ])

  const likedSet = new Set(likedIds.map((r) => r.postId))
  const featuredByChildId = new Map(featuredRows.map((r) => [r.post.id, r]))

  function toEntry(row: CandidateRow): DiscussionEntry {
    return {
      post: toPostDTO(row, pinnedIds),
      stats: { likeCount: row.likeCount, directReplyCount: row.directReplyCount },
      viewer: { hasLiked: likedSet.has(row.post.id) },
      poll: pollByPostId.get(row.post.id),
    }
  }

  return rows.map((row) => {
    const featuredRow = row.bestDirectChildId ? featuredByChildId.get(row.bestDirectChildId) : undefined
    return {
      ...toEntry(row),
      featuredChild: featuredRow ? toEntry(featuredRow) : undefined,
      hiddenReplyCount: Math.max(0, row.directReplyCount - (featuredRow ? 1 : 0)),
    }
  })
}

export type GetDiscussionPageInput = {
  rootPostId: string
  viewerId: string | null
  sort: SortMode
  cursor?: string | null
  limit?: number
}

export async function getDiscussionPage(input: GetDiscussionPageInput): Promise<DiscussionResponse> {
  const limit = clampLimit(input.limit)
  const cursor = input.cursor ? decodeCursor(input.cursor) : null

  const pinnedRows = await fetchPinned(input.rootPostId)
  const pinnedIds = pinnedRows.map((r) => r.post.id)

  const candidateRows =
    input.sort === "top"
      ? await fetchTopCandidates(input.rootPostId, pinnedIds, cursor, limit)
      : await fetchLatestCandidates(input.rootPostId, pinnedIds, cursor, limit)

  const hasMore = candidateRows.length > limit
  const pageRows = candidateRows.slice(0, limit)

  // pinned 跟 page 合成一次 enrichRows：featured child／poll／like
  // 這幾批查詢對兩邊是共用的批次操作，分開呼叫兩次等於白白多打一輪。
  const pinnedIdSet = new Set(pinnedIds)
  const enrichedAll = await enrichRows([...pinnedRows, ...pageRows], input.viewerId, pinnedIdSet)
  const enrichedPinned = enrichedAll.slice(0, pinnedRows.length)
  const enrichedPage = enrichedAll.slice(pinnedRows.length)

  const last = pageRows[pageRows.length - 1]
  const nextCursor =
    hasMore && last
      ? encodeCursor(
          input.sort === "top"
            ? { id: last.post.id, branchScore: last.branchScore ?? 0 }
            : { id: last.post.id, createdAt: last.post.createdAt.toISOString() }
        )
      : null

  return {
    pinnedReplies: enrichedPinned,
    replies: enrichedPage,
    nextCursor,
    hasMore,
  }
}

export type GetMoreRepliesInput = {
  parentPostId: string
  viewerId: string | null
  cursor?: string | null
  limit?: number
  // 該 parent 目前的 featured child——已經在上一層 UI 顯示過了，這裡要排除
  // 掉，不然「查看更多回覆」展開之後會看到同一則貼文出現兩次。
  excludePostId?: string
}

// Root 跟 nested reply 共用同一個 retrieval service：都是「某個 parent
// 底下的 direct children」，差別只在 parent 是不是 root。不建立
// root-comments / subcomments 兩套 API（見規格第 71 點）。
export async function getMoreReplies(input: GetMoreRepliesInput): Promise<MoreRepliesResponse> {
  const limit = clampLimit(input.limit)
  const cursor = input.cursor ? decodeCursor(input.cursor) : null

  const conditions = [eq(posts.replyToId, input.parentPostId), isNull(posts.deletedAt)]
  if (input.excludePostId) {
    conditions.push(ne(posts.id, input.excludePostId))
  }
  if (cursor?.createdAt !== undefined) {
    conditions.push(cursorAfter(posts.createdAt, posts.id, new Date(cursor.createdAt), cursor.id))
  }

  const rows = await db
    .select({
      post: posts,
      authorName: user.name,
      authorRole: user.role,
      likeCount: replyRank.likeCount,
      directReplyCount: replyRank.directReplyCount,
      bestDirectChildId: replyRank.bestDirectChildId,
      branchScore: replyRank.branchScore,
    })
    .from(posts)
    .leftJoin(user, eq(user.id, posts.authorId))
    .leftJoin(replyRank, eq(replyRank.postId, posts.id))
    .where(and(...conditions))
    .orderBy(posts.createdAt, posts.id)
    .limit(limit + 1)
    .then((r) =>
      r.map((row) => ({
        ...row,
        likeCount: row.likeCount ?? 0,
        directReplyCount: row.directReplyCount ?? 0,
        branchScore: row.branchScore ?? null,
      }))
    )

  const hasMore = rows.length > limit
  const pageRows = rows.slice(0, limit)
  const enriched = await enrichRows(pageRows, input.viewerId, new Set())

  const last = pageRows[pageRows.length - 1]
  const nextCursor = hasMore && last ? encodeCursor({ id: last.post.id, createdAt: last.post.createdAt.toISOString() }) : null

  return { replies: enriched, nextCursor, hasMore }
}

// 某個節點往下的「主幹」：順著 reply_rank.best_direct_child_id 這條已經在
// 寫入時 O(1) 維護好的指標往下走，最多走 limit 步。
//
// ⚠ 刻意「不」用「列舉整個子樹再挑最深的那條」的寫法：那種 recursive CTE
// 必須掃過每一個後代才知道誰最深，等於每點一次「查看更多」就是 O(子樹大小)
// 的掃描，違反規格第 72/73 點的複雜度目標，活動現場一堆人同時滑會把資料庫
// 流量打爆。這裡每一步都是 reply_rank 的主鍵查找，總共只碰 limit 列。
//
// 代價：走的是「分數最高」而不是嚴格「層數最多」的鏈。實務上兩者多半一致，
// 因為 reply_score 裡的 directReplyCount 訊號會讓「底下還有回覆」的節點分數
// 比較高，自然往深處長。真的需要嚴格深度優先的話，要在 reply_rank 另外加
// subtree_depth 欄位、寫入時往上更新 O(深度) 列（見 Implementation Report
// 的技術債）。
export async function getReplyChain(
  parentPostId: string,
  viewerId: string | null,
  limit?: number
): Promise<DiscussionItem[]> {
  const max = clampLimit(limit)

  // 種子刻意用 (parent_id, reply_score DESC) 這個索引直接挑出 parent 的最佳
  // 子節點，而不是讀 parent 自己那列的 best_direct_child_id——因為 root 沒有
  // reply_rank 列，用後者的話從 root 展開會直接拿到空結果。
  const result = await db.execute<{ post_id: string; lvl: number }>(sql`
    WITH RECURSIVE spine AS (
      SELECT rr.post_id, rr.best_direct_child_id AS next_id, 1 AS lvl
      FROM reply_rank rr
      WHERE rr.post_id = (
        SELECT r2.post_id
        FROM reply_rank r2
        JOIN posts p2 ON p2.id = r2.post_id
        WHERE r2.parent_id = ${parentPostId} AND p2.deleted_at IS NULL
        ORDER BY r2.reply_score DESC, r2.post_id DESC
        LIMIT 1
      )
      UNION ALL
      SELECT r.post_id, r.best_direct_child_id, s.lvl + 1
      FROM reply_rank r
      JOIN spine s ON r.post_id = s.next_id
      WHERE s.lvl < ${max}
    )
    SELECT post_id, lvl FROM spine ORDER BY lvl
  `)

  const rows = (result as unknown as { rows?: { post_id: string }[] }).rows ?? (result as unknown as { post_id: string }[])
  const orderedIds = rows.map((r) => r.post_id)
  if (orderedIds.length === 0) return []

  const fetched = await fetchByIds(orderedIds)
  const byId = new Map(fetched.map((r) => [r.post.id, r]))
  const ordered = orderedIds.map((id) => byId.get(id)).filter((r): r is CandidateRow => !!r && r.post.deletedAt === null)

  return enrichRows(ordered, viewerId, new Set(), { withFeaturedChild: false })
}

// 從某則貼文往上撈到 root 的完整祖先鏈（root 在最前面，焦點貼文在最後面）。
// 走 reply_to_id，複雜度 O(深度)——討論串深度本來就很淺，不是掃描。
export async function getAncestorChain(postId: string, viewerId: string | null): Promise<DiscussionItem[]> {
  const result = await db.execute<{ id: string; lvl: number }>(sql`
    WITH RECURSIVE chain AS (
      SELECT ${posts.id} AS id, ${posts.replyToId} AS parent_id, 0 AS lvl
      FROM ${posts}
      WHERE ${posts.id} = ${postId}
      UNION ALL
      SELECT p.id, p.reply_to_id, c.lvl + 1
      FROM posts p
      JOIN chain c ON p.id = c.parent_id
    )
    SELECT id, lvl FROM chain ORDER BY lvl DESC
  `)

  const rows = (result as unknown as { rows?: { id: string }[] }).rows ?? (result as unknown as { id: string }[])
  const orderedIds = rows.map((r) => r.id)
  if (orderedIds.length === 0) return []

  const fetched = await fetchByIds(orderedIds)
  const byId = new Map(fetched.map((r) => [r.post.id, r]))
  const ordered = orderedIds.map((id) => byId.get(id)).filter((r): r is CandidateRow => !!r)

  return enrichRows(ordered, viewerId, new Set(), { withFeaturedChild: false })
}

// 一則貼文屬於哪個討論 root。/discussion/[postId] 是通用路由，網址上只有
// post id，沒有任何活動資訊——要判斷「這個人有沒有資格看這則貼文」只能先
// 從貼文反查它的 root，再由 root_key 對應回 flow。這支查詢刻意只回傳
// 權限判斷需要的欄位，不吐任何貼文內容。
export type DiscussionPostContext = {
  postId: string
  rootPostId: string
  rootKey: string | null
  isRoot: boolean
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function getPostContext(postId: string): Promise<DiscussionPostContext | null> {
  // post id 直接來自網址。非 UUID 的字串丟給 Postgres 的 uuid 欄位會噴
  // invalid input syntax 例外（變成 500 而不是 404），先自己擋掉。
  if (!UUID_PATTERN.test(postId)) return null

  const rootPost = alias(posts, "root_post")
  const [row] = await db
    .select({
      postId: posts.id,
      rootPostId: posts.rootPostId,
      rootKey: rootPost.rootKey,
      deletedAt: posts.deletedAt,
    })
    .from(posts)
    .innerJoin(rootPost, eq(rootPost.id, posts.rootPostId))
    .where(eq(posts.id, postId))
    .limit(1)

  if (!row) return null
  return {
    postId: row.postId,
    rootPostId: row.rootPostId,
    rootKey: row.rootKey,
    isRoot: row.postId === row.rootPostId,
  }
}

// --- 小工具：keyset pagination 的比較條件、IN/NOT IN ---

function sqlNotIn(column: AnyPgColumn, ids: string[]): SQL {
  return notInArray(column, ids)
}

// ORDER BY primary DESC, secondary DESC 的下一頁條件：
// (primary < cursorPrimary) OR (primary = cursorPrimary AND secondary < cursorSecondary)
function cursorBefore(
  primary: AnyPgColumn,
  secondary: AnyPgColumn,
  cursorPrimary: number | Date,
  cursorSecondary: string
): SQL {
  return sql`(${primary} < ${cursorPrimary} OR (${primary} = ${cursorPrimary} AND ${secondary} < ${cursorSecondary}))`
}

// ORDER BY primary ASC, secondary ASC 的下一頁條件（給 getMoreReplies 的
// 時間正序用）：(primary > cursorPrimary) OR (primary = cursorPrimary AND secondary > cursorSecondary)
function cursorAfter(
  primary: AnyPgColumn,
  secondary: AnyPgColumn,
  cursorPrimary: number | Date,
  cursorSecondary: string
): SQL {
  return sql`(${primary} > ${cursorPrimary} OR (${primary} = ${cursorPrimary} AND ${secondary} > ${cursorSecondary}))`
}
