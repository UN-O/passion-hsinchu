import { unstable_cache } from "next/cache"
import { and, desc, eq, inArray, isNull, ne, notInArray, sql, type SQL } from "drizzle-orm"
import { alias, type AnyPgColumn } from "drizzle-orm/pg-core"

import { db } from "@/db"
import { user } from "@/db/schema/auth"
import { campTeamMember } from "@/db/schema/app"
import {
  discussionPins,
  pollOptions,
  polls,
  postLikes,
  posts,
  pollVotes,
  replyRank,
} from "@/db/schema/discussion"
import { fetchPublicProfiles, type PublicProfile } from "@/lib/profile"
import { fetchImagesByPostIds } from "./images"
import { fetchCachedPreviews } from "./link-preview"
import { firstUrlInContent, normalizeUrl } from "./links"
import { DISCUSSION_RANKING_CONFIG } from "./ranking"
import { DiscussionError } from "./constants"
import type {
  DiscussionEntry,
  DiscussionItem,
  DiscussionResponse,
  MoreRepliesResponse,
  PollDTO,
  PostDTO,
  PostImageDTO,
  LinkPreviewDTO,
} from "./dto"

export type SortMode = "top" | "latest" | "team"

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

function toPostDTO(
  row: CandidateRow,
  pinnedIds: Set<string>,
  images: PostImageDTO[] = [],
  linkPreview: LinkPreviewDTO | null = null,
  profile?: PublicProfile
): PostDTO {
  const isDeleted = row.post.deletedAt !== null
  return {
    id: row.post.id,
    authorId: row.post.authorId,
    // 顯示名稱優先用個人資料（勇者名）；查不到才退回 user.name。
    authorName: profile?.displayName ?? row.authorName,
    authorRole: row.authorRole,
    authorAvatarUrl: isDeleted ? null : (profile?.avatarUrl ?? null),
    authorZone: isDeleted ? null : (profile?.zone ?? null),
    content: isDeleted ? "" : row.post.content,
    createdAt: row.post.createdAt.toISOString(),
    updatedAt: row.post.updatedAt.toISOString(),
    isDeleted,
    isPinned: pinnedIds.has(row.post.id),
    isOfficial: row.post.isOfficial,
    // 已刪除的貼文不吐圖片路徑。圖檔本身在刪除時就已經從 R2 清掉了
    // （見 images.ts deleteImagesForPost），這裡只是不要讓畫面留下
    // 一排載不出來的破圖。
    images: isDeleted ? [] : images,
    linkPreview: isDeleted ? null : linkPreview,
  }
}

// 置頂的貼文排序永遠排最前面（依 discussionPins.position），但畫面上跟
// 其他回覆是同一份 SiblingList，不是另外搬到獨立區塊——所以做法是：
// fetchTopCandidates／fetchLatestCandidates 的排名查詢排除掉置頂的 id
// （靠 rank/時間排的那份清單不用管它們），只在「第一頁」（cursor 是
// null）另外查一次置頂的貼文，直接接在陣列最前面。分頁往後翻不會重複
// 帶出置頂貼文，因為它們本來就沒進過那份分頁查詢。
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
    })
    .from(discussionPins)
    .innerJoin(posts, eq(posts.id, discussionPins.postId))
    .leftJoin(user, eq(user.id, posts.authorId))
    .leftJoin(replyRank, eq(replyRank.postId, posts.id))
    .where(and(eq(discussionPins.rootPostId, rootPostId), isNull(posts.deletedAt)))
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
// branchIds 不是 null 時，額外限制只回傳 id 落在這個集合裡的頂層貼文——「小隊」
// 篩選用這個縮小範圍，見 getTeamBranchIds。
async function fetchLatestCandidates(
  parentPostId: string,
  excludeIds: string[],
  cursor: Cursor | null,
  limit: number,
  branchIds?: string[] | null
): Promise<CandidateRow[]> {
  const conditions = [eq(posts.replyToId, parentPostId), isNull(posts.deletedAt)]
  if (excludeIds.length > 0) conditions.push(sqlNotIn(posts.id, excludeIds))
  if (branchIds) conditions.push(inArray(posts.id, branchIds))
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

// 每個 CAMP 討論頁（/camp/meeting/[sessionId]、/camp/devotion/[day]）進場都會
// 查一次這筆，只是為了決定要不要顯示「小隊」排序選項——營隊期間這兩類頁面
// 會被大量重複開啟，所以包一層 unstable_cache，減少重複查詢。
//
// 目前 camp_team_member 沒有任何後台／server action 會寫入或更新（只能靠
// Neon SQL editor 手動改，見 CLAUDE.md 的工作人員名單那段是同一套做法），
// 所以完全沒有 updateTag(CAMP_TEAM_TAG) 這種即時失效的路徑可以掛——TTL 訂
// 短一點（10 分鐘，而不是 exp/church-list 那種 1 小時）是刻意的：萬一營隊
// 期間有人被改小隊、換房，最多等 10 分鐘就會反映出來，不用等到活動結束。
// 之後如果真的做了可以改小隊的後台，記得在那個 action 裡呼叫
// updateTag(CAMP_TEAM_TAG)，就可以把 TTL 拉長回 1 小時。
export const CAMP_TEAM_TAG = "camp-team"
const CAMP_TEAM_TTL_SECONDS = 60 * 10

// 「小隊」篩選只有 CAMP 討論、而且使用者自己有進 camp_team_member 才有意義
// （工作人員、還沒排進小隊的人都沒有這筆資料）。查不到就回傳 null，呼叫端
// 當「沒有小隊可篩」處理，不是錯誤。
//
// viewerId 一定要留在被包住的函式參數裡（不能改成外面 closure 帶進去）：
// unstable_cache 是拿參數序列化後的值當 cache key 的一部分，這樣才能保證
// 每個使用者的小隊資料放在各自獨立的快取項目裡，不會查到別人的小隊。
export const getViewerCampTeam = unstable_cache(
  async (viewerId: string | null): Promise<{ teamName: string } | null> => {
    if (!viewerId) return null
    // user.enrollment_id 是 better-auth 產生器加的 text 欄位（見 db/schema/auth.ts
    // 頂端的說明），camp_team_member.enrollment_id 是真的 uuid——兩者型別不同，
    // Postgres 不會自動轉型，join 條件要自己 cast 掉，不然直接噴
    // 「operator does not exist: uuid = text」。
    const [row] = await db
      .select({ teamName: campTeamMember.teamName })
      .from(user)
      .innerJoin(campTeamMember, sql`${campTeamMember.enrollmentId}::text = ${user.enrollmentId}`)
      .where(eq(user.id, viewerId))
      .limit(1)
    return row ?? null
  },
  ["viewer-camp-team"],
  { tags: [CAMP_TEAM_TAG], revalidate: CAMP_TEAM_TTL_SECONDS }
)

// 某個小隊在這個討論裡，有出現在哪些頂層討論串（不管小隊成員的貼文實際上
// 藏多深）。posts.root_branch_id 對任何深度的貼文都是 O(1) 直接存好「自己
// 屬於哪個頂層討論串」（見 db/schema/discussion.ts 的說明），頂層貼文自己的
// root_branch_id 就是它自己的 id——所以「篩出的 root_branch_id 集合」直接
// 拿來對頂層列表做 posts.id IN (...) 就好，不用另外爬子樹。這樣「小隊成員
// 只在很深的地方回過一則」的討論串，整條還是會完整出現，不會被拆散。
async function getTeamBranchIds(rootPostId: string, teamName: string): Promise<string[]> {
  const rows = await db
    .selectDistinct({ rootBranchId: posts.rootBranchId })
    .from(posts)
    .innerJoin(user, eq(user.id, posts.authorId))
    // 同樣的型別問題，見 getViewerCampTeam 的說明。
    .innerJoin(campTeamMember, sql`${campTeamMember.enrollmentId}::text = ${user.enrollmentId}`)
    .where(
      and(
        eq(posts.rootPostId, rootPostId),
        eq(campTeamMember.teamName, teamName),
        isNull(posts.deletedAt)
      )
    )
  return rows.map((r) => r.rootBranchId).filter((id): id is string => id !== null)
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

  // 連結預覽只讀快取（fetchCachedPreviews 不會發外部請求）——列表要立刻
  // 回得出來，沒抓過的連結由前端自己補打一次 server action。
  const authorIds = allRows.map((r) => r.post.authorId).filter((id): id is string => id !== null)

  const [pollByPostId, imagesByPostId, previewsByUrl, profilesByUserId, likedIds] = await Promise.all([
    fetchPollsByPostIds(allIds, viewerId),
    fetchImagesByPostIds(allIds),
    fetchCachedPreviews(allRows.map((r) => firstUrlInContent(r.post.content)).filter((u): u is string => u !== null)),
    fetchPublicProfiles(authorIds),
    viewerId
      ? db
          .select({ postId: postLikes.postId })
          .from(postLikes)
          .where(and(inArray(postLikes.postId, allIds), eq(postLikes.userId, viewerId)))
      : Promise.resolve([]),
  ])

  function previewFor(content: string): LinkPreviewDTO | null {
    const url = firstUrlInContent(content)
    const normalized = url ? normalizeUrl(url) : null
    return normalized ? (previewsByUrl.get(normalized) ?? null) : null
  }

  const likedSet = new Set(likedIds.map((r) => r.postId))
  const featuredByChildId = new Map(featuredRows.map((r) => [r.post.id, r]))

  function toEntry(row: CandidateRow): DiscussionEntry {
    return {
      post: toPostDTO(
        row,
        pinnedIds,
        imagesByPostId.get(row.post.id) ?? [],
        previewFor(row.post.content),
        row.post.authorId ? profilesByUserId.get(row.post.authorId) : undefined
      ),
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

  // 置頂的貼文永遠排最前面（不管熱門還是最新排序），但跟其他回覆同一份
  // SiblingList，不是獨立區塊。只在第一頁（cursor 是 null）撈一次置頂
  // 貼文接在最前面；往後翻頁不會重複，因為排名查詢本來就排除了它們。
  const pinnedRows = cursor === null ? await fetchPinned(input.rootPostId) : []
  const pinnedIds = pinnedRows.map((r) => r.post.id)

  let candidateRows: CandidateRow[]
  if (input.sort === "top") {
    candidateRows = await fetchTopCandidates(input.rootPostId, pinnedIds, cursor, limit)
  } else if (input.sort === "team") {
    const team = await getViewerCampTeam(input.viewerId)
    // 沒有小隊可篩（不該發生——UI 只在使用者有小隊時才會出現這個選項），
    // 當作篩出空集合處理，不是拋錯讓整頁掛掉。
    const branchIds = team ? await getTeamBranchIds(input.rootPostId, team.teamName) : []
    candidateRows =
      branchIds.length > 0 ? await fetchLatestCandidates(input.rootPostId, pinnedIds, cursor, limit, branchIds) : []
  } else {
    candidateRows = await fetchLatestCandidates(input.rootPostId, pinnedIds, cursor, limit)
  }

  const hasMore = candidateRows.length > limit
  const pageRows = candidateRows.slice(0, limit)

  // pinned 跟 page 合成一次 enrichRows：featured child／poll／like 這幾批
  // 查詢對兩邊是共用的批次操作，分開呼叫兩次等於白白多打一輪。
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
    replies: [...enrichedPinned, ...enrichedPage],
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
  limit?: number,
  // 呼叫端如果已經知道 parent 的最佳子節點是哪一則（例如：這個 parent 自己
  // 就是上一次展開的鏈尾那則之前的節點，它的最佳子節點已經在同一條鏈裡
  // 顯示過了），把那個 id 傳進來排除掉，種子改選「次佳」子節點。不排除的話，
  // 種子查詢每次都選同一個 reply_score 最高的子節點，會跟已經顯示在畫面上
  // 的那則重複渲染。
  excludeSeedId?: string | null
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
          ${excludeSeedId ? sql`AND r2.post_id != ${excludeSeedId}` : sql``}
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
