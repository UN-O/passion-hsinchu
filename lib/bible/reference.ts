import { BOOK_BY_CODE } from "./books"
import type { BibleReference } from "./types"

// "NEH.2.11-20" → { book: "NEH", chapter: 2, verseStart: 11, verseEnd: 20 }
// "JHN.3.16" → { book: "JHN", chapter: 3, verseStart: 16 }
export function parseReferenceString(reference: string): BibleReference | null {
  const match = /^([1-3]?[A-Z]+)\.(\d+)\.(\d+)(?:-(\d+))?$/.exec(reference)
  if (!match) return null
  const [, book, chap, start, end] = match
  if (!BOOK_BY_CODE.has(book)) return null
  return {
    book,
    chapter: Number(chap),
    verseStart: Number(start),
    verseEnd: end ? Number(end) : undefined,
  }
}

export function referenceToString(ref: BibleReference): string {
  const range = ref.verseEnd && ref.verseEnd !== ref.verseStart ? `${ref.verseStart}-${ref.verseEnd}` : String(ref.verseStart)
  return `${ref.book}.${ref.chapter}.${range}`
}

// 給畫面顯示用的中文書名＋章節，例如「尼希米記 2:11-20」。
export function referenceToLabel(ref: BibleReference): string {
  const book = BOOK_BY_CODE.get(ref.book)
  const bookLabel = book?.fullName ?? ref.book
  const range = ref.verseEnd && ref.verseEnd !== ref.verseStart ? `${ref.verseStart}-${ref.verseEnd}` : String(ref.verseStart)
  return `${bookLabel} ${ref.chapter}:${range}`
}
