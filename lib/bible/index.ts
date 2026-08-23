import { fetchFhlPassage, fetchFhlChapter, isFhlVersion } from "./fhl"
import { fetchNivPassage, fetchNivChapter } from "./bolls"
import type { BiblePassage, BibleReference, BibleVersionKey } from "./types"

export { BIBLE_VERSIONS } from "./types"
export type { BiblePassage, BibleReference, BibleVersionKey, BibleVersionMeta, BibleVerse } from "./types"
export { BIBLE_BOOKS, BOOK_BY_CODE } from "./books"
export { parseReferenceString, referenceToString, referenceToLabel } from "./reference"

export async function fetchPassage(version: BibleVersionKey, ref: BibleReference): Promise<BiblePassage | null> {
  if (isFhlVersion(version)) return fetchFhlPassage(version, ref)
  if (version === "niv") return fetchNivPassage(ref)
  return null
}

// 整章——書卷／章節選擇畫面用：選好章之後先顯示整章內容，再從裡面點選
// 要用的節（quote／閱讀模式都是這個流程）。
export async function fetchChapter(version: BibleVersionKey, book: string, chapter: number): Promise<BiblePassage | null> {
  if (isFhlVersion(version)) return fetchFhlChapter(version, book, chapter)
  if (version === "niv") return fetchNivChapter(book, chapter)
  return null
}
