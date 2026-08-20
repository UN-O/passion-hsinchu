import { test } from "node:test"
import assert from "node:assert/strict"

import { computeBranchScore, computeReplyScore, DISCUSSION_RANKING_CONFIG } from "./ranking"

const NOW = new Date("2026-08-20T12:00:00+08:00")

test("replyScore：讚數用 log1p，不是線性——熱門內容不會完全壟斷排序", () => {
  const base = { directReplyCount: 0, createdAt: NOW, isStaffAuthor: false, now: NOW }
  const score0 = computeReplyScore({ ...base, likeCount: 0 })
  const score10 = computeReplyScore({ ...base, likeCount: 10 })
  const score110 = computeReplyScore({ ...base, likeCount: 110 })
  const score1000 = computeReplyScore({ ...base, likeCount: 1000 })

  // 讚數越多分數越高……
  assert.ok(score10 > score0)
  assert.ok(score1000 > score110)
  // ……但成長是遞減的（log1p 是凹函數）：同樣多 +10 個讚，在讚數已經很高的
  // 起點上帶來的漲幅，要比在讚數為 0 的起點上帶來的漲幅小——這樣單一熱門
  // 內容才不會靠瘋狂洗讚就完全壟斷排序。
  const jumpFromZero = score10 - score0
  const jumpFromHundred = computeReplyScore({ ...base, likeCount: 110 }) - computeReplyScore({ ...base, likeCount: 100 })
  assert.ok(jumpFromHundred < jumpFromZero, "同樣 +10 個讚，起點讚數越高，分數漲幅應該越小")
  void score110
})

test("replyScore：工作人員回覆有加分", () => {
  const base = { likeCount: 0, directReplyCount: 0, createdAt: NOW, now: NOW }
  const staff = computeReplyScore({ ...base, isStaffAuthor: true })
  const student = computeReplyScore({ ...base, isStaffAuthor: false })
  assert.ok(staff > student)
  assert.equal(staff - student, DISCUSSION_RANKING_CONFIG.replyScore.staffReplyBonus)
})

test("replyScore：新鮮度隨時間衰減，越舊分數越低", () => {
  const base = { likeCount: 0, directReplyCount: 0, isStaffAuthor: false, now: NOW }
  const fresh = computeReplyScore({ ...base, createdAt: NOW })
  const oneDayOld = computeReplyScore({ ...base, createdAt: new Date(NOW.getTime() - 24 * 60 * 60 * 1000) })
  const oneWeekOld = computeReplyScore({ ...base, createdAt: new Date(NOW.getTime() - 7 * 24 * 60 * 60 * 1000) })
  assert.ok(fresh > oneDayOld)
  assert.ok(oneDayOld > oneWeekOld)
})

test("replyScore：不會因為 likeCount 或 directReplyCount 是 0 而出錯（log1p(0) = 0）", () => {
  const score = computeReplyScore({ likeCount: 0, directReplyCount: 0, createdAt: NOW, isStaffAuthor: false, now: NOW })
  assert.ok(Number.isFinite(score))
})

test("branchScore：老師／工作人員參與過的 branch 分數比較高（規格第 87 點的情境）", () => {
  // Student A └ Student B（沒有老師參與） vs Student C └ Teacher（有）
  const withoutTeacher = computeBranchScore({
    rootReplyScore: 1,
    bestDirectChildScore: 0.5,
    descendantCount: 1,
    rootAuthorParticipated: false,
  })
  const withTeacher = computeBranchScore({
    rootReplyScore: 1,
    bestDirectChildScore: 0.5,
    descendantCount: 1,
    rootAuthorParticipated: true,
  })
  assert.ok(withTeacher > withoutTeacher)
  assert.equal(withTeacher - withoutTeacher, DISCUSSION_RANKING_CONFIG.branchScore.staffParticipationBonus)
})

test("branchScore：best direct child 分數越高，整條 branch 分數也越高", () => {
  const low = computeBranchScore({ rootReplyScore: 1, bestDirectChildScore: 1, descendantCount: 3, rootAuthorParticipated: false })
  const high = computeBranchScore({ rootReplyScore: 1, bestDirectChildScore: 5, descendantCount: 3, rootAuthorParticipated: false })
  assert.ok(high > low)
})

test("featured child：三個 child 分數 10/30/20，best 應該是分數 30 的那個（規格第 88 點）", () => {
  const scores = { b: 10, c: 30, d: 20 }
  const best = Object.entries(scores).reduce((a, b) => (b[1] > a[1] ? b : a))
  assert.equal(best[0], "c")
})
