import { eq, ne, and } from "drizzle-orm"

import { db } from "@/db"
import { enrollment } from "@/db/schema/app"
import { normalizeChurch } from "@/lib/normalize"

// 一次性腳本：把資料庫裡的教會簡寫/變體改成主辦方提供的正規名稱。
// 只改 church / church_norm 顯示與比對用的值，不影響 name / camp / conference。
//
// 每一筆更新前都先檢查會不會撞到既有的 (name_norm, church_norm) unique index——
// 如果撞到，代表同一個人可能被記錄了兩次（不同教會寫法），這種情況不自動處理，
// 印出來讓工作人員自己在後台判斷要不要合併。

const RENAMES: Record<string, string> = {
  五尖教會: "五尖長老教會",
  恩典教會: "新竹恩典教會",
  新人堂: "浸信會新人堂",
  磐石浸信會: "新豐磐石浸信會",
  雅歌靈糧堂: "新竹雅歌靈糧堂",
  "新竹浸信會-合一小組": "新竹浸信會",
  新豐磐石教會: "新豐磐石浸信會",
  美崙基督長老教會: "美崙長老教會",
}

async function main() {
  let updated = 0
  let skipped = 0

  for (const [from, to] of Object.entries(RENAMES)) {
    const rows = await db.select().from(enrollment).where(eq(enrollment.church, from))
    const toNorm = normalizeChurch(to)

    for (const row of rows) {
      const [collision] = await db
        .select({ id: enrollment.id, name: enrollment.name })
        .from(enrollment)
        .where(
          and(
            eq(enrollment.nameNorm, row.nameNorm),
            eq(enrollment.churchNorm, toNorm),
            ne(enrollment.id, row.id)
          )
        )
        .limit(1)

      if (collision) {
        skipped++
        console.log(
          `跳過：${row.name} / ${from} → ${to} 會撞到既有的 ${collision.name}（id ${collision.id}），請在後台手動確認是否為同一人`
        )
        continue
      }

      await db
        .update(enrollment)
        .set({ church: to, churchNorm: toNorm, updatedAt: new Date() })
        .where(eq(enrollment.id, row.id))
      updated++
      console.log(`已更新：${row.name} / ${from} → ${to}`)
    }
  }

  console.log(`\n共更新 ${updated} 筆，跳過 ${skipped} 筆`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
