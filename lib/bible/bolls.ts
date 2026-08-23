import { BIBLE_BOOKS, BOOK_BY_CODE } from "./books"
import type { BiblePassage, BibleReference, BibleVerse } from "./types"

// NIV 走 Bolls（bolls.life）——不用申請 Key。**這是刻意的取捨，不是不知道
// 風險**：Bolls 沒有公開任何跟 Biblica（NIV 版權方）的合作/授權聲明，YouVersion
// 跟 API.Bible 都特地把 NIV 放在要 Key 的那層正是因為 Biblica 要求追蹤用量，
// 一個完全不驗證身份就能整節吐出 NIV 正文的來源，法律上比 FHL 的和合本／
// 現代中文譯本更說不過去。這是使用者在看過 API.Bible 自助申請 Key的替代方案
// 後仍然選擇的方向，不是預設推薦——正式上線前這塊風險要自己承擔或改用
// api.bible／public domain 版本。
const BOLLS_BASE = "https://bolls.life"

export async function fetchNivPassage(ref: BibleReference): Promise<BiblePassage | null> {
  const passage = await fetchNivChapter(ref.book, ref.chapter)
  if (!passage) return null

  const verseEnd = ref.verseEnd ?? ref.verseStart
  const verses = passage.verses.filter((v) => v.verse >= ref.verseStart && v.verse <= verseEnd)
  if (verses.length === 0) return null

  return { ...passage, reference: ref, verses }
}

// 整章。給書卷／章節選擇畫面用：選好章之後先看到整章內容，再從裡面點選
// 要用的節。
export async function fetchNivChapter(book: string, chapter: number): Promise<BiblePassage | null> {
  const bookMeta = BOOK_BY_CODE.get(book)
  if (!bookMeta) return null

  // Bolls 的書卷編號就是正典順序 1-66（創世記=1...啟示錄=66），跟
  // BIBLE_BOOKS 的排列順序一致，用 index+1 換算，不用另外維護一份對照表。
  const bookNumber = BIBLE_BOOKS.findIndex((b) => b.code === book) + 1
  if (bookNumber === 0) return null

  const url = `${BOLLS_BASE}/get-text/NIV/${bookNumber}/${chapter}/`
  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) return null

  const data = await res.json()
  if (!Array.isArray(data) || data.length === 0) return null

  return {
    version: "niv",
    versionLabel: "NIV",
    bookLabel: bookMeta.fullName,
    reference: { book, chapter, verseStart: 1 },
    verses: data.map((v: { verse: number; text: string }) => parseVerse(v.verse, v.text)),
  }
}

// Bolls 把段落標題／詩篇標題塞進該節文字裡，用 <br/> 隔開，例如
// "Nehemiah Inspects Jerusalem's Walls<br/>I went to Jerusalem, and after
// staying there three days"——標題混在第一節開頭，要保留起來當小標題顯示，
// 不能丟掉。只檢查第一段是不是「看起來像標題」（沒有句尾標點、字數不
// 多）；第一段之後的所有片段一律當內文——有些經文本身就是一句話被 <br/>
// 斷成兩段接到下一節，那些片段也常常沒有句尾標點，只看「是不是第一段」
// 才不會誤判成標題（曾經在尼希米記 2:11 上踩到這個坑：整節內容被判斷成
// 「像標題」而消失）。
function parseVerse(verse: number, raw: string): BibleVerse {
  const segments = raw
    .split(/<br\s*\/?>/gi)
    .map((s) => s.replace(/<[^>]+>/g, "").trim())
    .filter(Boolean)

  const hasHeading = segments.length > 1 && looksLikeHeading(segments[0])
  const heading = hasHeading ? segments[0] : undefined
  const text = (hasHeading ? segments.slice(1) : segments).join(" ").trim()

  return heading ? { verse, text, heading } : { verse, text }
}

function looksLikeHeading(segment: string) {
  return segment.length <= 60 && !/[.!?"'）」]$/.test(segment)
}
