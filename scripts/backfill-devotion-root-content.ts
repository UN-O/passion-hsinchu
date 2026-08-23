import { eq } from "drizzle-orm"

import { db } from "@/db"
import { posts } from "@/db/schema/discussion"
import { DISCUSSION_ROOT_TAG } from "@/lib/discussion/constants"
import { seedRootBibleReading } from "@/lib/discussion/bible-reading"
import { campDevotionRootKey } from "@/lib/discussion/root-registry"
import { DEVOTION_ENTRIES, buildDevotionContent } from "@/lib/devotion-content"
import { parseReferenceString } from "@/lib/bible"
import { triggerRevalidate } from "./trigger-revalidate"

// 一次性腳本：靈修內容（day2／day3）的討論 root 在「靈修內容改成聖經模組／
// 真正的 root post」這次改版之前就已經建立過了，content 那時候只種了
// entry.title，沒有 intro／closing，也沒有 root_bible_readings 那筆閱讀
// 段落——getOrCreateDevotionRoot 的種子邏輯只在 root「第一次建立」時跑，
// 已經存在的 root 不會自動補上新內容，所以要跑這支腳本補一次。
//
// 只在 content 還跟 entry.title 完全一樣（=沒被 admin 手動編輯過）時才覆寫，
// 避免蓋掉活動期間管理者已經自己改過的文字。
//
// 用法： pnpm exec node --env-file=.env --import ./scripts/ts-hook.mjs ./scripts/backfill-devotion-root-content.ts
//       加 --apply 才真的寫入，不加是預覽。
async function main() {
  const apply = process.argv.includes("--apply")

  for (const entry of DEVOTION_ENTRIES) {
    const rootKey = campDevotionRootKey(entry.id)
    const [root] = await db.select().from(posts).where(eq(posts.rootKey, rootKey)).limit(1)

    if (!root) {
      console.log(`[${entry.id}] 還沒有 root（第一次打開頁面時會自動建立含新內容的版本），跳過`)
      continue
    }

    const newContent = buildDevotionContent(entry)
    const contentUnchanged = root.content === entry.title
    const reference = parseReferenceString(entry.reference)

    console.log(`[${entry.id}] root ${root.id}`)
    console.log(`  content 目前：${JSON.stringify(root.content)}`)
    if (contentUnchanged && newContent) {
      console.log(`  content 將改為：${JSON.stringify(newContent)}`)
    } else if (!contentUnchanged) {
      console.log(`  content 看起來已經被手動編輯過，不覆寫`)
    }
    if (reference) {
      console.log(`  閱讀段落將設為：${entry.reference}（${entry.version}）`)
    }

    if (!apply) continue

    if (contentUnchanged && newContent) {
      await db.update(posts).set({ content: newContent, updatedAt: new Date() }).where(eq(posts.id, root.id))
    }

    if (reference) {
      await db.transaction(async (tx) => {
        await seedRootBibleReading(tx, root.id, entry.version, reference).catch(() => {
          // unique constraint（rootPostId 已經有一筆）＝已經設定過了，不覆寫既有選擇。
          console.log(`  （已經有閱讀段落設定，不覆寫）`)
        })
      })
    }
  }

  if (!apply) {
    console.log("\n這是預覽，尚未寫入資料庫。要套用請加 --apply。")
    return
  }

  await triggerRevalidate(DISCUSSION_ROOT_TAG)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
