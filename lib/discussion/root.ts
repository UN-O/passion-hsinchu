import { randomUUID } from "node:crypto"
import { unstable_cache } from "next/cache"
import { eq } from "drizzle-orm"

import { db } from "@/db"
import { discussionSettings, posts } from "@/db/schema/discussion"
import { getRegisteredRoot } from "./root-registry"
import { seedOfficialQuestions } from "./mutations"

export type DiscussionRoot = typeof posts.$inferSelect

async function selectOrCreateRoot(rootKey: string): Promise<DiscussionRoot> {
  const definition = getRegisteredRoot(rootKey)
  if (!definition) {
    throw new Error(`未知的討論 root key："${rootKey}"，請先在 root-registry.ts 註冊`)
  }

  const [existing] = await db.select().from(posts).where(eq(posts.rootKey, rootKey)).limit(1)
  if (existing) return existing

  // 併發下第一次建立可能有多個 request 同時打進來：用 root_key 的
  // unique index 擋重複，輸的一方 fallback 回查詢既有的那筆。
  const id = randomUUID()
  const now = new Date()

  const inserted = await db
    .insert(posts)
    .values({
      id,
      authorId: null,
      content: definition.title,
      replyToId: null,
      rootPostId: id,
      rootBranchId: null,
      rootKey: definition.key,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing({ target: posts.rootKey })
    .returning()

  if (inserted.length > 0) {
    await db.insert(discussionSettings).values({ rootPostId: id }).onConflictDoNothing()
    return inserted[0]
  }

  const [row] = await db.select().from(posts).where(eq(posts.rootKey, rootKey)).limit(1)
  if (!row) throw new Error(`建立討論 root 失敗："${rootKey}"`)
  return row
}

// 這支會在 CAMP/CONFERENCE 每一次打開討論頁時都執行——聚會期間大家會
// 反覆重新整理頁面，跟 lib/exp.ts 的 getRegionTotals 是同一個風險：root
// 建立後幾乎不會再變（title 是程式碼裡的靜態文字），不快取就是每次重刷
// 頁面都白白對有額度限制的資料庫查一次。root_key 的數量是固定的（來自
// root-registry.ts 的白名單），cache key 基數不會爆炸。
//
// 刻意把「查詢＋必要時建立」整段包進 cache，而不是只 cache 查詢結果：
// 如果只 cache「查不到」這個結果，第一個訪客建立完 root 之後，同一個
// cache entry 還是會在 TTL 內持續回傳「查不到」，逼著接下來一小時每次
// 都重跑一次冪等建立邏輯——等於完全沒省到。包整段之後，一旦成功回傳
// 一筆真的存在的 row，就會被原樣快取，之後同一個 rootKey 直接吃 cache。
const TTL_SECONDS = 60 * 60

const getCachedRoot = unstable_cache(selectOrCreateRoot, ["discussion-root-by-key"], { revalidate: TTL_SECONDS })

// 冪等取得（必要時建立）某個頁面的討論 root。rootKey 一定要先出現在
// root-registry.ts 才能被建立——client 端傳來的 rootKey 只是「查哪一個
// 已核准的討論」，不是「建立任意新討論」的權限。
export async function getOrCreateDiscussionRoot(rootKey: string): Promise<DiscussionRoot> {
  return getCachedRoot(rootKey)
}

// 靈修 root：引導問題要在 root 第一次建立的當下、跟 root 本身在同一個
// transaction 裡種進去，變成置頂的官方回覆（見 mutations.ts 的
// seedOfficialQuestions）。刻意不走上面的 unstable_cache——那支被包過的
// 函式沒辦法夾帶「贏家才做的事」這個 callback，而且靈修頁的流量遠低於
// 一般討論頁，省下這層快取的代價可以接受。
//
// 用跟 selectOrCreateRoot 一樣的「INSERT ... ON CONFLICT DO NOTHING on
// posts.root_key」機制決定誰是贏家：只有真的插進那筆 root 的 request
// 才會執行 seedOfficialQuestions，天生防重——併發下第二個 request 一定會
// 撞到 unique index、拿到空陣列，直接跳過播種、回查既有那筆。
export async function getOrCreateDevotionRoot(rootKey: string, questions: string[]): Promise<DiscussionRoot> {
  const definition = getRegisteredRoot(rootKey)
  if (!definition) {
    throw new Error(`未知的討論 root key："${rootKey}"，請先在 root-registry.ts 註冊`)
  }

  const [existing] = await db.select().from(posts).where(eq(posts.rootKey, rootKey)).limit(1)
  if (existing) return existing

  const id = randomUUID()
  const now = new Date()

  return db.transaction(async (tx) => {
    const inserted = await tx
      .insert(posts)
      .values({
        id,
        authorId: null,
        content: definition.title,
        replyToId: null,
        rootPostId: id,
        rootBranchId: null,
        rootKey: definition.key,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing({ target: posts.rootKey })
      .returning()

    if (inserted.length > 0) {
      await tx.insert(discussionSettings).values({ rootPostId: id }).onConflictDoNothing()
      await seedOfficialQuestions(tx, id, questions)
      return inserted[0]
    }

    const [row] = await tx.select().from(posts).where(eq(posts.rootKey, rootKey)).limit(1)
    if (!row) throw new Error(`建立討論 root 失敗："${rootKey}"`)
    return row
  })
}
