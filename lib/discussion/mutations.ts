import { randomUUID } from "node:crypto"
import { and, desc, eq, isNull, sql } from "drizzle-orm"

import { db } from "@/db"
import { user } from "@/db/schema/auth"
import {
  discussionPins,
  discussionSettings,
  pollOptions,
  polls,
  postLikes,
  posts,
  pollVotes,
  replyRank,
} from "@/db/schema/discussion"
import { applyRankingForNewReply, propagateScoreChange, recomputeBestDirectChild, type Tx } from "./ranking-updates"
import {
  DiscussionError,
  MAX_CONTENT_LENGTH,
  MAX_POLL_OPTIONS,
  MAX_POLL_OPTION_LENGTH,
  MIN_POLL_OPTIONS,
} from "./constants"

type UserRole = "attendee" | "staff" | "admin"

function isStaffRole(role: UserRole): boolean {
  return role === "staff" || role === "admin"
}

export type CreateReplyInput = {
  parentPostId: string
  authorId: string
  authorRole: UserRole
  content: string
  poll?: { allowMultiple: boolean; options: string[] }
}

export async function createReply(input: CreateReplyInput) {
  const content = input.content.trim()
  if (!content) throw new DiscussionError("內容不能是空的")
  if (content.length > MAX_CONTENT_LENGTH) throw new DiscussionError(`內容不能超過 ${MAX_CONTENT_LENGTH} 字`)

  let pollOptionLabels: string[] | null = null
  if (input.poll) {
    // 只有工作人員以上能建立投票——前端已經用 viewer.role 隱藏了「加入投票」
    // 按鈕，但 server action 可以被直接呼叫，這裡沒擋就等於沒擋。
    if (!isStaffRole(input.authorRole)) throw new DiscussionError("只有工作人員可以建立投票")
    pollOptionLabels = input.poll.options.map((label) => label.trim()).filter(Boolean)
    if (pollOptionLabels.length < MIN_POLL_OPTIONS) {
      throw new DiscussionError(`投票至少要有 ${MIN_POLL_OPTIONS} 個選項`)
    }
    if (pollOptionLabels.length > MAX_POLL_OPTIONS) {
      throw new DiscussionError(`投票最多 ${MAX_POLL_OPTIONS} 個選項`)
    }
    if (pollOptionLabels.some((label) => label.length > MAX_POLL_OPTION_LENGTH)) {
      throw new DiscussionError(`每個選項不能超過 ${MAX_POLL_OPTION_LENGTH} 字`)
    }
  }

  const [parent] = await db.select().from(posts).where(eq(posts.id, input.parentPostId)).limit(1)
  if (!parent || parent.deletedAt) throw new DiscussionError("找不到這則貼文")

  const [settings] = await db
    .select()
    .from(discussionSettings)
    .where(eq(discussionSettings.rootPostId, parent.rootPostId))
    .limit(1)

  if (settings && !settings.discussionEnabled) throw new DiscussionError("這個討論目前已關閉")

  const parentIsRoot = parent.replyToId === null
  if (!parentIsRoot && settings && !settings.allowNestedReplies) {
    throw new DiscussionError("這個討論不開放巢狀回覆")
  }
  if (parentIsRoot && input.authorRole === "attendee" && settings && !settings.allowStudentRootReplies) {
    throw new DiscussionError("這個討論目前不開放學生直接回覆")
  }

  if (settings && settings.slowModeSeconds > 0) {
    const [lastReply] = await db
      .select({ createdAt: posts.createdAt })
      .from(posts)
      .where(and(eq(posts.authorId, input.authorId), eq(posts.rootPostId, parent.rootPostId)))
      .orderBy(desc(posts.createdAt))
      .limit(1)
    if (lastReply) {
      const elapsedSeconds = (Date.now() - lastReply.createdAt.getTime()) / 1000
      if (elapsedSeconds < settings.slowModeSeconds) {
        throw new DiscussionError(`發言太快了，請等 ${Math.ceil(settings.slowModeSeconds - elapsedSeconds)} 秒後再試`)
      }
    }
  }

  const parentAuthorIsStaff = await isAuthorStaff(parent.authorId)
  const authorIsStaff = isStaffRole(input.authorRole)

  const id = randomUUID()
  const now = new Date()
  const rootBranchId = parentIsRoot ? id : parent.rootBranchId

  return db.transaction(async (tx) => {
    const [newPost] = await tx
      .insert(posts)
      .values({
        id,
        authorId: input.authorId,
        content,
        replyToId: parent.id,
        rootPostId: parent.rootPostId,
        rootBranchId,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    if (pollOptionLabels) {
      await tx.insert(polls).values({ postId: id, allowMultiple: input.poll!.allowMultiple })
      await tx.insert(pollOptions).values(
        pollOptionLabels.map((label, position) => ({ pollPostId: id, label, position }))
      )
    }

    await applyRankingForNewReply(
      tx,
      { id, createdAt: now, rootPostId: parent.rootPostId, rootBranchId },
      { id: parent.id, createdAt: parent.createdAt, replyToId: parent.replyToId, isStaffAuthor: parentAuthorIsStaff },
      authorIsStaff
    )

    return newPost
  })
}

async function isAuthorStaff(authorId: string | null): Promise<boolean> {
  if (!authorId) return false
  const [row] = await db.select({ role: user.role }).from(user).where(eq(user.id, authorId)).limit(1)
  return row?.role === "staff" || row?.role === "admin"
}

export async function editReply(postId: string, authorId: string, content: string): Promise<void> {
  const trimmed = content.trim()
  if (!trimmed) throw new DiscussionError("內容不能是空的")
  if (trimmed.length > MAX_CONTENT_LENGTH) throw new DiscussionError(`內容不能超過 ${MAX_CONTENT_LENGTH} 字`)

  const rows = await db
    .update(posts)
    .set({ content: trimmed, updatedAt: new Date() })
    .where(and(eq(posts.id, postId), eq(posts.authorId, authorId), isNull(posts.deletedAt)))
    .returning({ id: posts.id })

  if (rows.length === 0) throw new DiscussionError("找不到這則貼文，或你不是作者")
}

// 只能切換自己發的貼文（跟 editReply 一樣用 authorId 卡在 WHERE 裡）——
// 呼叫端（actions.ts）已經先確認過是 discussion admin，這裡再擋一層
// 「必須是自己的貼文」，兩個條件都要成立。isOfficial 純粹是顯示旗標，
// 不影響 authorId／編輯／刪除權限。
export async function toggleOfficial(postId: string, authorId: string, next: boolean): Promise<void> {
  const rows = await db
    .update(posts)
    .set({ isOfficial: next, updatedAt: new Date() })
    .where(and(eq(posts.id, postId), eq(posts.authorId, authorId), isNull(posts.deletedAt)))
    .returning({ id: posts.id })

  if (rows.length === 0) throw new DiscussionError("找不到這則貼文，或你不是作者")
}

// root post 沒有作者（authorId 是 null），沒辦法像 editReply 那樣比對
// authorId——呼叫端（actions.ts）改用 isDiscussionAdmin 擋，這裡只用
// reply_to_id is null 確認真的是在改 root，不是隨便一則貼文。
export async function editRootContent(rootPostId: string, content: string): Promise<void> {
  const trimmed = content.trim()
  if (!trimmed) throw new DiscussionError("內容不能是空的")
  if (trimmed.length > MAX_CONTENT_LENGTH) throw new DiscussionError(`內容不能超過 ${MAX_CONTENT_LENGTH} 字`)

  const rows = await db
    .update(posts)
    .set({ content: trimmed, updatedAt: new Date() })
    .where(and(eq(posts.id, rootPostId), isNull(posts.replyToId)))
    .returning({ id: posts.id })

  if (rows.length === 0) throw new DiscussionError("找不到這個討論 root")
}

// 靈修引導問題＝root 底下置頂的「官方」直接回覆，只在 root 剛建立時（見
// lib/discussion/root.ts 的 getOrCreateDevotionRoot）由那個 request 播種一次
// ——呼叫端已經用 posts.root_key 的 unique index 保證只有一個 request 會
// 走到這裡，不用再另外防重。authorId 是 null：這些問題不是任何人發的，
// 是活動內容本身（跟 root post 自己 authorId 是 null 同樣的道理）。
export async function seedOfficialQuestions(tx: Tx, rootId: string, questions: string[]): Promise<void> {
  const now = new Date()
  for (const [index, question] of questions.entries()) {
    const trimmed = question.trim()
    if (!trimmed) continue

    const id = randomUUID()
    await tx.insert(posts).values({
      id,
      authorId: null,
      content: trimmed,
      replyToId: rootId,
      rootPostId: rootId,
      rootBranchId: id,
      isOfficial: true,
      createdAt: now,
      updatedAt: now,
    })

    await applyRankingForNewReply(
      tx,
      { id, createdAt: now, rootPostId: rootId, rootBranchId: id },
      { id: rootId, createdAt: now, replyToId: null, isStaffAuthor: false },
      false
    )

    await tx.insert(discussionPins).values({ rootPostId: rootId, postId: id, pinnedBy: null, position: index })
  }
}

// 保留 tree 結構：只標記 deleted_at，子孫節點完全不動。
export async function softDeleteReply(
  postId: string,
  actingUserId: string,
  canModerateOthers: boolean
): Promise<void> {
  await db.transaction(async (tx) => {
    const where = canModerateOthers
      ? and(eq(posts.id, postId), isNull(posts.deletedAt))
      : and(eq(posts.id, postId), eq(posts.authorId, actingUserId), isNull(posts.deletedAt))

    const rows = await tx
      .update(posts)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(where)
      .returning({ id: posts.id, replyToId: posts.replyToId })

    if (rows.length === 0) throw new DiscussionError("找不到這則貼文，或沒有權限刪除")

    const [{ replyToId }] = rows
    if (replyToId) await recomputeBestDirectChild(tx, replyToId)
  })
}

export async function likePost(postId: string, userId: string): Promise<{ likeCount: number }> {
  return db.transaction(async (tx) => {
    const inserted = await tx.insert(postLikes).values({ userId, postId }).onConflictDoNothing().returning()

    if (inserted.length > 0) {
      await tx
        .update(replyRank)
        .set({ likeCount: sql`${replyRank.likeCount} + 1` })
        .where(eq(replyRank.postId, postId))
      await propagateScoreChange(tx, postId)
    }

    const [rank] = await tx.select({ likeCount: replyRank.likeCount }).from(replyRank).where(eq(replyRank.postId, postId))
    return { likeCount: rank?.likeCount ?? 0 }
  })
}

export async function unlikePost(postId: string, userId: string): Promise<{ likeCount: number }> {
  return db.transaction(async (tx) => {
    const deleted = await tx
      .delete(postLikes)
      .where(and(eq(postLikes.userId, userId), eq(postLikes.postId, postId)))
      .returning()

    if (deleted.length > 0) {
      // GREATEST(...) 是防禦性寫法：正常情況下 delete 的 returning 已經保證
      // 只有真的刪掉才會走到這裡，不會出現負數，但多一層保險成本很低。
      await tx
        .update(replyRank)
        .set({ likeCount: sql`GREATEST(${replyRank.likeCount} - 1, 0)` })
        .where(eq(replyRank.postId, postId))
      await propagateScoreChange(tx, postId)
    }

    const [rank] = await tx.select({ likeCount: replyRank.likeCount }).from(replyRank).where(eq(replyRank.postId, postId))
    return { likeCount: rank?.likeCount ?? 0 }
  })
}

// 單選：投同一個選項＝取消；投別的選項＝換票（先移除舊票再插新票）。
// 多選：對單一選項做 toggle。用 poll 那一列的 row lock 當序列化點，
// 同一個 poll 的並發投票會排隊處理，避免 vote_count 漏加/漏減。
export async function votePoll(pollPostId: string, optionId: string, userId: string) {
  return db.transaction(async (tx) => {
    const [poll] = await tx.select().from(polls).where(eq(polls.postId, pollPostId)).for("update")
    if (!poll) throw new DiscussionError("找不到這個投票")
    if (poll.closedAt) throw new DiscussionError("投票已結束")

    const existingVotes = await tx
      .select()
      .from(pollVotes)
      .where(and(eq(pollVotes.pollPostId, pollPostId), eq(pollVotes.userId, userId)))

    const alreadyVotedThisOption = existingVotes.some((vote) => vote.pollOptionId === optionId)

    if (poll.allowMultiple) {
      if (alreadyVotedThisOption) {
        await tx
          .delete(pollVotes)
          .where(
            and(eq(pollVotes.pollPostId, pollPostId), eq(pollVotes.pollOptionId, optionId), eq(pollVotes.userId, userId))
          )
        await tx
          .update(pollOptions)
          .set({ voteCount: sql`GREATEST(${pollOptions.voteCount} - 1, 0)` })
          .where(eq(pollOptions.id, optionId))
      } else {
        await tx.insert(pollVotes).values({ pollPostId, pollOptionId: optionId, userId })
        await tx
          .update(pollOptions)
          .set({ voteCount: sql`${pollOptions.voteCount} + 1` })
          .where(eq(pollOptions.id, optionId))
      }
    } else {
      if (alreadyVotedThisOption) {
        await tx.delete(pollVotes).where(and(eq(pollVotes.pollPostId, pollPostId), eq(pollVotes.userId, userId)))
        await tx
          .update(pollOptions)
          .set({ voteCount: sql`GREATEST(${pollOptions.voteCount} - 1, 0)` })
          .where(eq(pollOptions.id, optionId))
      } else {
        if (existingVotes.length > 0) {
          await tx.delete(pollVotes).where(and(eq(pollVotes.pollPostId, pollPostId), eq(pollVotes.userId, userId)))
          await tx
            .update(pollOptions)
            .set({ voteCount: sql`GREATEST(${pollOptions.voteCount} - 1, 0)` })
            .where(eq(pollOptions.id, existingVotes[0].pollOptionId))
        }
        await tx.insert(pollVotes).values({ pollPostId, pollOptionId: optionId, userId })
        await tx
          .update(pollOptions)
          .set({ voteCount: sql`${pollOptions.voteCount} + 1` })
          .where(eq(pollOptions.id, optionId))
      }
    }

    const options = await tx
      .select()
      .from(pollOptions)
      .where(eq(pollOptions.pollPostId, pollPostId))
      .orderBy(pollOptions.position)
    const viewerVotes = await tx
      .select({ pollOptionId: pollVotes.pollOptionId })
      .from(pollVotes)
      .where(and(eq(pollVotes.pollPostId, pollPostId), eq(pollVotes.userId, userId)))

    return { options, viewerOptionIds: viewerVotes.map((v) => v.pollOptionId) }
  })
}

// 第一版只允許 pin root 的 direct reply（rootBranchId === postId 代表這則
// post 本身就是某條 branch 的起點，也就是 root 的直接回覆）。
export async function pinReply(rootPostId: string, postId: string, pinnedBy: string): Promise<void> {
  const [post] = await db
    .select({ rootPostId: posts.rootPostId, rootBranchId: posts.rootBranchId })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1)

  if (!post || post.rootPostId !== rootPostId || post.rootBranchId !== postId) {
    throw new DiscussionError("只能置頂 root 的直接回覆")
  }

  const [{ maxPosition }] = await db
    .select({ maxPosition: sql<number>`coalesce(max(${discussionPins.position}), -1)` })
    .from(discussionPins)
    .where(eq(discussionPins.rootPostId, rootPostId))

  await db.insert(discussionPins).values({ rootPostId, postId, pinnedBy, position: maxPosition + 1 }).onConflictDoNothing()
}

export async function unpinReply(rootPostId: string, postId: string): Promise<void> {
  await db
    .delete(discussionPins)
    .where(and(eq(discussionPins.rootPostId, rootPostId), eq(discussionPins.postId, postId)))
}

export type DiscussionSettingsPatch = Partial<{
  discussionEnabled: boolean
  defaultSort: "top" | "latest"
  slowModeSeconds: number
  allowStudentRootReplies: boolean
  allowNestedReplies: boolean
}>

export async function updateDiscussionSettings(rootPostId: string, patch: DiscussionSettingsPatch): Promise<void> {
  await db.update(discussionSettings).set({ ...patch, updatedAt: new Date() }).where(eq(discussionSettings.rootPostId, rootPostId))
}
