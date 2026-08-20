// 討論串排序的所有權重集中在這裡——不要在別的檔案裡散落 magic number。
//
// 第一版沒有「hidden」狀態（見 db/schema/discussion.ts 的說明：只做 soft
// delete，不過度設計），所以這裡沒有 moderationPenalty 項：被刪除的貼文
// 一律在查詢階段用 deleted_at IS NULL 篩掉，不會進到排序計算。
export const DISCUSSION_RANKING_CONFIG = {
  replyScore: {
    likeWeight: 1,
    directReplyWeight: 0.5,
    freshnessWeight: 1,
    // 過了這麼多小時，新鮮度訊號衰減到一半
    freshnessHalfLifeHours: 48,
    // 教材作者／工作人員（staff、admin）親自回覆學生討論的加分
    staffReplyBonus: 2,
  },
  branchScore: {
    rootReplyWeight: 1,
    bestChildWeight: 0.5,
    descendantWeight: 0.3,
    // 老師／工作人員曾經參與這條 branch 的加分
    staffParticipationBonus: 3,
  },
  // Top 排序先抓的候選池大小（M），避免只抓最終顯示筆數就做決策
  candidatePoolSize: 30,
  defaultPageSize: 10,
  maxPageSize: 30,
} as const

export type ReplyScoreInput = {
  likeCount: number
  directReplyCount: number
  createdAt: Date
  isStaffAuthor: boolean
  now?: Date
}

// log1p 而不是線性乘積：避免單一熱門內容的讚數線性放大、完全壟斷排序。
export function computeReplyScore(input: ReplyScoreInput): number {
  const cfg = DISCUSSION_RANKING_CONFIG.replyScore
  const now = input.now ?? new Date()
  const ageHours = Math.max(0, (now.getTime() - input.createdAt.getTime()) / (1000 * 60 * 60))

  const likeSignal = cfg.likeWeight * Math.log1p(Math.max(0, input.likeCount))
  const directReplySignal = cfg.directReplyWeight * Math.log1p(Math.max(0, input.directReplyCount))
  const freshnessSignal = cfg.freshnessWeight * Math.exp(-ageHours / cfg.freshnessHalfLifeHours)
  const staffSignal = input.isStaffAuthor ? cfg.staffReplyBonus : 0

  return likeSignal + directReplySignal + freshnessSignal + staffSignal
}

export type BranchScoreInput = {
  rootReplyScore: number
  bestDirectChildScore: number
  descendantCount: number
  rootAuthorParticipated: boolean
}

// branchScore 表示這一整條 discussion branch（root 的某個 direct reply
// 開始往下的所有子孫）值不值得被排在前面，不只看這則 reply 自己的分數。
export function computeBranchScore(input: BranchScoreInput): number {
  const cfg = DISCUSSION_RANKING_CONFIG.branchScore

  const rootSignal = cfg.rootReplyWeight * input.rootReplyScore
  const childSignal = cfg.bestChildWeight * input.bestDirectChildScore
  const descendantSignal = cfg.descendantWeight * Math.log1p(Math.max(0, input.descendantCount))
  const participationSignal = input.rootAuthorParticipated ? cfg.staffParticipationBonus : 0

  return rootSignal + childSignal + descendantSignal + participationSignal
}
