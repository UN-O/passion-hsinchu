import { and, desc, eq, isNull } from "drizzle-orm"

import { db } from "@/db"
import { user } from "@/db/schema/auth"
import { posts, replyRank } from "@/db/schema/discussion"
import { computeBranchScore, computeReplyScore } from "./ranking"

// 從 db.transaction 的 callback 參數型別直接推導，避免手動維護一份
// PgTransaction 泛型簽章。export 出去給 mutations.ts 的 seedOfficialQuestions
// 用（它跟這裡一樣需要在同一個 transaction 裡呼叫 applyRankingForNewReply）。
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

type NewPostForRanking = {
  id: string
  createdAt: Date
  rootPostId: string
  rootBranchId: string | null
}

type ParentForRanking = {
  id: string
  createdAt: Date
  replyToId: string | null
  isStaffAuthor: boolean
}

// 新增一則 reply 之後的排序更新。全部是 O(1)：最多更新「自己」「直接
// parent（如果不是 root）」「branch head（如果 parent 不是 branch head 本身）」
// 三個 reply_rank 列，不做 recursive 往上爬。
export async function applyRankingForNewReply(
  tx: Tx,
  newPost: NewPostForRanking,
  parent: ParentForRanking,
  authorIsStaff: boolean
): Promise<void> {
  const now = new Date()
  const parentIsRoot = parent.replyToId === null

  const ownReplyScore = computeReplyScore({
    likeCount: 0,
    directReplyCount: 0,
    createdAt: newPost.createdAt,
    isStaffAuthor: authorIsStaff,
    now,
  })
  const ownRootAuthorParticipated = parentIsRoot && authorIsStaff
  const ownBranchScore = computeBranchScore({
    rootReplyScore: ownReplyScore,
    bestDirectChildScore: 0,
    descendantCount: 0,
    rootAuthorParticipated: ownRootAuthorParticipated,
  })

  await tx.insert(replyRank).values({
    postId: newPost.id,
    parentId: parent.id,
    rootPostId: newPost.rootPostId,
    rootBranchId: newPost.rootBranchId,
    likeCount: 0,
    directReplyCount: 0,
    descendantCount: 0,
    replyScore: ownReplyScore,
    branchScore: ownBranchScore,
    bestDirectChildId: null,
    bestDirectChildScore: 0,
    rootAuthorParticipated: ownRootAuthorParticipated,
    rootAuthorReplyCount: ownRootAuthorParticipated ? 1 : 0,
    updatedAt: now,
  })

  // parent 是 root：root 本身不參與排序（只有一個 root，沒有「兄弟」可比），
  // 新貼文自己就是 branch head，上面已經完整初始化，不需要再更新誰。
  if (parentIsRoot) return

  const branchHeadId = newPost.rootBranchId
  if (!branchHeadId) return // 理論上不會發生：非 root 的 parent 一定有 rootBranchId

  const parentIsBranchHead = parent.id === branchHeadId

  const [parentRank] = await tx
    .select()
    .from(replyRank)
    .where(eq(replyRank.postId, parent.id))
    .for("update")

  if (!parentRank) return

  const newParentDirectReplyCount = parentRank.directReplyCount + 1
  const newParentReplyScore = computeReplyScore({
    likeCount: parentRank.likeCount,
    directReplyCount: newParentDirectReplyCount,
    createdAt: parent.createdAt,
    isStaffAuthor: parent.isStaffAuthor,
    now,
  })

  let bestChildId = parentRank.bestDirectChildId
  let bestChildScore = parentRank.bestDirectChildScore
  if (ownReplyScore > bestChildScore) {
    bestChildId = newPost.id
    bestChildScore = ownReplyScore
  }

  if (parentIsBranchHead) {
    // parent 同時也是 branch head：兩件事其實是同一列，合併成一次 update
    // 避免對同一列寫兩次造成競態。
    const descendantCount = parentRank.descendantCount + 1
    const rootAuthorParticipated = parentRank.rootAuthorParticipated || authorIsStaff
    const rootAuthorReplyCount = parentRank.rootAuthorReplyCount + (authorIsStaff ? 1 : 0)
    const newBranchScore = computeBranchScore({
      rootReplyScore: newParentReplyScore,
      bestDirectChildScore: bestChildScore,
      descendantCount,
      rootAuthorParticipated,
    })

    await tx
      .update(replyRank)
      .set({
        directReplyCount: newParentDirectReplyCount,
        descendantCount,
        replyScore: newParentReplyScore,
        branchScore: newBranchScore,
        bestDirectChildId: bestChildId,
        bestDirectChildScore: bestChildScore,
        rootAuthorParticipated,
        rootAuthorReplyCount,
        updatedAt: now,
      })
      .where(eq(replyRank.postId, parent.id))

    await refreshGrandparentBestChild(tx, parent)
    return
  }

  // parent 是更深層的 nested reply，跟 branch head 是兩個不同的列：
  // parent 只更新「自己的 direct child 統計」，branch head 只更新「聚合統計」。
  await tx
    .update(replyRank)
    .set({
      directReplyCount: newParentDirectReplyCount,
      replyScore: newParentReplyScore,
      bestDirectChildId: bestChildId,
      bestDirectChildScore: bestChildScore,
      updatedAt: now,
    })
    .where(eq(replyRank.postId, parent.id))

  const [branchRank] = await tx
    .select()
    .from(replyRank)
    .where(eq(replyRank.postId, branchHeadId))
    .for("update")
  if (!branchRank) return

  const descendantCount = branchRank.descendantCount + 1
  const rootAuthorParticipated = branchRank.rootAuthorParticipated || authorIsStaff
  const rootAuthorReplyCount = branchRank.rootAuthorReplyCount + (authorIsStaff ? 1 : 0)
  const newBranchScore = computeBranchScore({
    rootReplyScore: branchRank.replyScore,
    bestDirectChildScore: branchRank.bestDirectChildScore,
    descendantCount,
    rootAuthorParticipated,
  })

  await tx
    .update(replyRank)
    .set({
      descendantCount,
      branchScore: newBranchScore,
      rootAuthorParticipated,
      rootAuthorReplyCount,
      updatedAt: now,
    })
    .where(eq(replyRank.postId, branchHeadId))

  await refreshGrandparentBestChild(tx, parent)
}

// 新增一則回覆會讓「直接 parent」的 replyScore 改變（directReplyCount +1），
// 而 parent 的分數正是「祖父母挑 best direct child」的依據——所以祖父母那層
// 要重挑一次，不然會卡在舊的選擇（例如祖父母一直指向比較淺、但當初比較新
// 的那個兄弟，主幹就永遠鑽不下去）。
//
// 只需要往上一層：這則新回覆並沒有改變 parent 自己的 directReplyCount，
// 所以祖父母的 replyScore 沒變，再上一層的 best child 不受影響。O(1)。
async function refreshGrandparentBestChild(tx: Tx, parent: ParentForRanking): Promise<void> {
  if (!parent.replyToId) return // parent 是 root 的直接子節點，root 不參與排序
  await recomputeBestDirectChild(tx, parent.replyToId)
}

// Like / Unlike 之後：likeCount 已經在呼叫端用 canonical 的
// post_likes INSERT/DELETE 結果原子更新過，這裡只需要重新算 replyScore，
// 並往上游播（parent 的 best-direct-child、branch head 的 branch_score）。
export async function propagateScoreChange(tx: Tx, postId: string): Promise<void> {
  // FOR UPDATE 只鎖 reply_rank 這一列：Postgres 不允許把 FOR UPDATE 套用在
  // outer join 可能為 NULL 的那一側（這裡是 posts LEFT JOIN user，root 沒有
  // author）。鎖先拿到，author 的 role 用第二個不需要鎖的查詢另外讀。
  const [locked] = await tx.select().from(replyRank).where(eq(replyRank.postId, postId)).for("update")
  if (!locked) return

  const [row] = await tx
    .select({ createdAt: posts.createdAt, authorRole: user.role })
    .from(posts)
    .leftJoin(user, eq(user.id, posts.authorId))
    .where(eq(posts.id, postId))
    .limit(1)

  if (!row) return

  const isStaffAuthor = row.authorRole === "staff" || row.authorRole === "admin"

  const newReplyScore = computeReplyScore({
    likeCount: locked.likeCount,
    directReplyCount: locked.directReplyCount,
    createdAt: row.createdAt,
    isStaffAuthor,
    now: new Date(),
  })

  const isBranchHead = locked.rootBranchId === postId
  const newBranchScore = isBranchHead
    ? computeBranchScore({
        rootReplyScore: newReplyScore,
        bestDirectChildScore: locked.bestDirectChildScore,
        descendantCount: locked.descendantCount,
        rootAuthorParticipated: locked.rootAuthorParticipated,
      })
    : undefined

  await tx
    .update(replyRank)
    .set({
      replyScore: newReplyScore,
      ...(newBranchScore !== undefined ? { branchScore: newBranchScore } : {}),
      updatedAt: new Date(),
    })
    .where(eq(replyRank.postId, postId))

  if (locked.parentId) {
    await recomputeBestDirectChild(tx, locked.parentId)
  }
}

// 回覆被刪除（soft delete）之後的排序更新，跟 applyRankingForNewReply 對稱、
// 方向相反：parent 的 direct_reply_count 要減一，如果 parent 同時是 branch
// head，descendant_count 也要減一；否則 descendant_count 記在 branch head
// 自己那一列，另外更新。不這樣做的話 direct_reply_count 會一直停在刪除前
// 的數字，畫面上「查看更多回覆」的按鈕（靠 hiddenReplyCount = directReplyCount
// - 1 算出來，見 queries.ts enrichRows）就會一直以為底下還有內容，點下去卻是
// 空的——因為實際查詢已經用 deleted_at IS NULL 把已刪除的貼文濾掉了。
//
// 最後呼叫 recomputeBestDirectChild 重新挑 parent 的最佳 child（處理「被刪的
// 剛好是原本的精選回覆」），以及往上一層重新挑 grandparent 的最佳 child
// （parent 自己的 replyScore 因為 directReplyCount 變了，可能會讓 grandparent
// 原本選的 best child 不再是最佳——跟 applyRankingForNewReply 的
// refreshGrandparentBestChild 是同一個理由）。
export async function applyRankingForDelete(tx: Tx, parentId: string): Promise<void> {
  const now = new Date()

  const [parentPost] = await tx
    .select({ createdAt: posts.createdAt, replyToId: posts.replyToId, authorRole: user.role })
    .from(posts)
    .leftJoin(user, eq(user.id, posts.authorId))
    .where(eq(posts.id, parentId))
    .limit(1)
  if (!parentPost || parentPost.replyToId === null) return // parent 是 root，不參與排序

  const [parentRank] = await tx.select().from(replyRank).where(eq(replyRank.postId, parentId)).for("update")
  if (!parentRank) return

  const isStaffAuthor = parentPost.authorRole === "staff" || parentPost.authorRole === "admin"
  const newDirectReplyCount = Math.max(0, parentRank.directReplyCount - 1)
  const newReplyScore = computeReplyScore({
    likeCount: parentRank.likeCount,
    directReplyCount: newDirectReplyCount,
    createdAt: parentPost.createdAt,
    isStaffAuthor,
    now,
  })

  const isBranchHead = parentRank.rootBranchId === parentId

  if (isBranchHead) {
    const newDescendantCount = Math.max(0, parentRank.descendantCount - 1)
    const newBranchScore = computeBranchScore({
      rootReplyScore: newReplyScore,
      bestDirectChildScore: parentRank.bestDirectChildScore,
      descendantCount: newDescendantCount,
      rootAuthorParticipated: parentRank.rootAuthorParticipated,
    })
    await tx
      .update(replyRank)
      .set({
        directReplyCount: newDirectReplyCount,
        descendantCount: newDescendantCount,
        replyScore: newReplyScore,
        branchScore: newBranchScore,
        updatedAt: now,
      })
      .where(eq(replyRank.postId, parentId))
  } else {
    await tx
      .update(replyRank)
      .set({ directReplyCount: newDirectReplyCount, replyScore: newReplyScore, updatedAt: now })
      .where(eq(replyRank.postId, parentId))

    const branchHeadId = parentRank.rootBranchId
    if (branchHeadId) {
      const [branchRank] = await tx.select().from(replyRank).where(eq(replyRank.postId, branchHeadId)).for("update")
      if (branchRank) {
        const newDescendantCount = Math.max(0, branchRank.descendantCount - 1)
        const newBranchScore = computeBranchScore({
          rootReplyScore: branchRank.replyScore,
          bestDirectChildScore: branchRank.bestDirectChildScore,
          descendantCount: newDescendantCount,
          rootAuthorParticipated: branchRank.rootAuthorParticipated,
        })
        await tx
          .update(replyRank)
          .set({ descendantCount: newDescendantCount, branchScore: newBranchScore, updatedAt: now })
          .where(eq(replyRank.postId, branchHeadId))
      }
    }
  }

  await recomputeBestDirectChild(tx, parentId)
  if (parentPost.replyToId) {
    await recomputeBestDirectChild(tx, parentPost.replyToId)
  }
}

// 找出某個 parent 目前真正最佳的 direct child，並且在必要時更新該 parent
// 的 reply_rank 列（包含它是 branch head 時的 branch_score）。用索引查詢
// 而不是「只跟目前快取值比大小」，這樣「最佳 child 被降分／刪除」時也能
// 正確地重新找到第二名，不會卡住舊值。
export async function recomputeBestDirectChild(tx: Tx, parentId: string): Promise<void> {
  const [best] = await tx
    .select({ id: replyRank.postId, score: replyRank.replyScore })
    .from(replyRank)
    .innerJoin(posts, eq(posts.id, replyRank.postId))
    .where(and(eq(replyRank.parentId, parentId), isNull(posts.deletedAt)))
    .orderBy(desc(replyRank.replyScore), desc(replyRank.postId))
    .limit(1)

  const [parentRank] = await tx
    .select()
    .from(replyRank)
    .where(eq(replyRank.postId, parentId))
    .for("update")
  if (!parentRank) return // parent 是 root，不參與排序

  const bestId = best?.id ?? null
  const bestScore = best?.score ?? 0
  if (parentRank.bestDirectChildId === bestId && parentRank.bestDirectChildScore === bestScore) return

  const isBranchHead = parentRank.rootBranchId === parentId
  const newBranchScore = isBranchHead
    ? computeBranchScore({
        rootReplyScore: parentRank.replyScore,
        bestDirectChildScore: bestScore,
        descendantCount: parentRank.descendantCount,
        rootAuthorParticipated: parentRank.rootAuthorParticipated,
      })
    : parentRank.branchScore

  await tx
    .update(replyRank)
    .set({
      bestDirectChildId: bestId,
      bestDirectChildScore: bestScore,
      branchScore: newBranchScore,
      updatedAt: new Date(),
    })
    .where(eq(replyRank.postId, parentId))
}
