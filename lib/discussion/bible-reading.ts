import { eq } from "drizzle-orm"

import { db } from "@/db"
import { rootBibleReadings } from "@/db/schema/discussion"
import { fetchPassage } from "@/lib/bible"
import type { BiblePassage, BibleVersionKey } from "@/lib/bible"

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
