import { and, eq } from "drizzle-orm"

import { db } from "@/db"
import { user } from "@/db/schema/auth"
import { flowProgress, claimMerges } from "@/db/schema/app"

// 把 CAMP 合成帳號（免驗證、用姓名＋教會登入，見 lib/auth-plugins/camp-identify.ts
// 的 camp-{enrollmentId}@camp.invalid）認領的報名資料，轉移給同一個人後來
// 用 Google 驗證登入的帳號（例如要進 CONFERENCE，需要證明過 Google 帳號
// 所有權）。這不是真的「被別人搶先認領」，是同一個人换了登入方式，
// 卡在 /claim 的「已被其他帳號認領」不該一直卡住他。
//
// 範圍刻意只搬 flow_progress（勇者測驗結果、開場流程完成狀態）——這是
// 「登入後看得到自己進度」最直接相關的資料。討論串貼文／按讚／投票／
// 收藏留在舊帳號底下，不會不見，但新帳號登入後不會自動看到；那幾張表
// 有 (userId, postId) 這類複合唯一鍵，搬移時可能跟新帳號自己的資料
// 衝突，需要另外設計去重邏輯，先不在這次範圍內，之後有需要再處理。
//
// 轉移不需要人工審核就會發生（知道姓名＋教會就能觸發，跟 CAMP 免驗證
// 登入本身的信任假設一致），所以每次轉移都寫一筆 claim_merges 稽核紀錄，
// 工作人員之後可以查「這筆報名什麼時候、從哪個帳號轉去哪個帳號」，
// 出現冒名爭議時至少有留痕可以回頭查。
export async function mergeCampIdentity(
  oldUserId: string,
  oldUserEmail: string,
  newUserId: string,
  newUserEmail: string,
  enrollmentId: string,
  enrollmentName: string
): Promise<void> {
  await db.transaction(async (tx) => {
    const oldRows = await tx.select().from(flowProgress).where(eq(flowProgress.userId, oldUserId))

    for (const row of oldRows) {
      const [existing] = await tx
        .select()
        .from(flowProgress)
        .where(and(eq(flowProgress.userId, newUserId), eq(flowProgress.flow, row.flow)))
        .limit(1)

      if (existing) {
        // 理論上不該發生（沒有 enrollment 就不會有進度可寫），保險起見還是
        // 處理：兩邊都有同一個 flow 的紀錄時，保留完成時間比較新的那筆。
        const keepOld = !existing.completedAt || (row.completedAt !== null && row.completedAt > existing.completedAt)
        if (keepOld) {
          await tx
            .update(flowProgress)
            .set({ completedAt: row.completedAt, payload: row.payload })
            .where(and(eq(flowProgress.userId, newUserId), eq(flowProgress.flow, row.flow)))
        }
        await tx
          .delete(flowProgress)
          .where(and(eq(flowProgress.userId, oldUserId), eq(flowProgress.flow, row.flow)))
      } else {
        await tx
          .update(flowProgress)
          .set({ userId: newUserId })
          .where(and(eq(flowProgress.userId, oldUserId), eq(flowProgress.flow, row.flow)))
      }
    }

    // 舊帳號放掉認領（user_enrollment_id_idx 是 unique index，兩邊不能
    // 同時指到同一筆 enrollment），新帳號接手；姓名一律用名冊上的本名。
    await tx.update(user).set({ enrollmentId: null }).where(eq(user.id, oldUserId))
    await tx.update(user).set({ enrollmentId, name: enrollmentName }).where(eq(user.id, newUserId))

    await tx.insert(claimMerges).values({
      enrollmentId,
      oldUserId,
      oldUserEmail,
      newUserId,
      newUserEmail,
    })
  })
}
