"use server"

import { fetchChapter, fetchPassage } from "./index"
import { BIBLE_VERSIONS } from "./types"
import type { BiblePassage, BibleReference, BibleVersionKey } from "./types"

// 給前端互動用（書卷／章節選擇、比較不同版本）的 server action 入口——
// 統一走這裡取資料，client component 不直接 import fhl.ts／bolls.ts，
// 資料來源要換掉（例如 NIV 之後改走有正式授權的 API）時只要改這一層。

export async function getPassageAction(version: BibleVersionKey, reference: BibleReference): Promise<BiblePassage | null> {
  return fetchPassage(version, reference)
}

export async function getChapterAction(version: BibleVersionKey, book: string, chapter: number): Promise<BiblePassage | null> {
  return fetchChapter(version, book, chapter)
}

export async function getAllVersionsAction(
  reference: BibleReference
): Promise<Partial<Record<BibleVersionKey, BiblePassage | null>>> {
  const keys = Object.keys(BIBLE_VERSIONS) as BibleVersionKey[]
  const results = await Promise.all(keys.map((key) => fetchPassage(key, reference)))
  return Object.fromEntries(keys.map((key, i) => [key, results[i]]))
}
