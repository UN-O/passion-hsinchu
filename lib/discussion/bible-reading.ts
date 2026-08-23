import { eq } from "drizzle-orm"

import { db } from "@/db"
import { rootBibleReadings } from "@/db/schema/discussion"
import { fetchPassage } from "@/lib/bible"
import type { BiblePassage, BibleReference, BibleVersionKey } from "@/lib/bible"
import type { Tx } from "./ranking-updates"

// 閱讀模式：只在資料庫存「選了哪個版本／哪一段」，實際經文每次顯示時
// 才即時查詢（見 db/schema/discussion.ts 的說明）。
export async function getRootBiblePassage(rootPostId: string): Promise<BiblePassage | null> {
  const [row] = await db.select().from(rootBibleReadings).where(eq(rootBibleReadings.rootPostId, rootPostId)).limit(1)
  if (!row) return null

  return fetchPassage(row.version as BibleVersionKey, {
    book: row.book,
    chapter: row.chapter,
    verseStart: row.verseStart,
    verseEnd: row.verseEnd ?? undefined,
  })
}

export async function setRootBibleReading(
  rootPostId: string,
  version: BibleVersionKey,
  reference: { book: string; chapter: number; verseStart: number; verseEnd?: number },
  updatedBy: string
): Promise<void> {
  await db
    .insert(rootBibleReadings)
    .values({
      rootPostId,
      version,
      book: reference.book,
      chapter: reference.chapter,
      verseStart: reference.verseStart,
      verseEnd: reference.verseEnd ?? null,
      updatedBy,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: rootBibleReadings.rootPostId,
      set: {
        version,
        book: reference.book,
        chapter: reference.chapter,
        verseStart: reference.verseStart,
        verseEnd: reference.verseEnd ?? null,
        updatedBy,
        updatedAt: new Date(),
      },
    })
}

export async function clearRootBibleReading(rootPostId: string): Promise<void> {
  await db.delete(rootBibleReadings).where(eq(rootBibleReadings.rootPostId, rootPostId))
}

// root 第一次建立時，跟 root 本身、置頂問題一起種進同一個 transaction
// （見 lib/discussion/root.ts 的 getOrCreateDevotionRoot）——管理者事後
// 還是可以透過 RootContent 的「設定閱讀經文」改掉，這裡只是給初始值。
export async function seedRootBibleReading(
  tx: Tx,
  rootPostId: string,
  version: BibleVersionKey,
  reference: BibleReference
): Promise<void> {
  await tx.insert(rootBibleReadings).values({
    rootPostId,
    version,
    book: reference.book,
    chapter: reference.chapter,
    verseStart: reference.verseStart,
    verseEnd: reference.verseEnd ?? null,
  })
}
