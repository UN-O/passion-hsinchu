import { BOOK_BY_CODE } from "./books"
import type { BiblePassage, BibleReference, BibleVerse, BibleVersionKey } from "./types"
import { BIBLE_VERSIONS } from "./types"

// 信望愛（FHL）的公開 JSON API，不用 Key、不用審核。中文和合本／現代中文
// 譯本目前是用這個來源。授權範圍還在跟台灣聖經公會確認中，見專案內部討論——
// 上線前務必先拿到書面同意（cb.fhl.net 的著作權聲明只開放個人網頁閱讀，
// 沒有授權下載／自行儲存／再傳輸）。
const FHL_BASE = "https://bible.fhl.net/json/qb.php"

const FHL_VERSION_CODE: Record<"unv" | "tcv2019", string> = {
  unv: "unv",
  tcv2019: "tcv2019",
}

export function isFhlVersion(version: BibleVersionKey): version is "unv" | "tcv2019" {
  return version === "unv" || version === "tcv2019"
}

export async function fetchFhlPassage(version: "unv" | "tcv2019", ref: BibleReference): Promise<BiblePassage | null> {
  const sec = ref.verseEnd && ref.verseEnd !== ref.verseStart ? `${ref.verseStart}-${ref.verseEnd}` : String(ref.verseStart)
  return fetchFhlBySec(version, ref.book, ref.chapter, sec, ref)
}

// 整章——不帶 sec 參數，FHL 會回傳該章全部經節。給書卷／章節選擇畫面用：
// 選好章之後要先看到整章內容，再從裡面點選要用的節。
export async function fetchFhlChapter(version: "unv" | "tcv2019", book: string, chapter: number): Promise<BiblePassage | null> {
  return fetchFhlBySec(version, book, chapter, undefined, { book, chapter, verseStart: 1 })
}

async function fetchFhlBySec(
  version: "unv" | "tcv2019",
  book: string,
  chapter: number,
  sec: string | undefined,
  ref: BibleReference
): Promise<BiblePassage | null> {
  const bookMeta = BOOK_BY_CODE.get(book)
  if (!bookMeta) return null

  const url = new URL(FHL_BASE)
  url.searchParams.set("chineses", bookMeta.abbr)
  url.searchParams.set("chap", String(chapter))
  if (sec) url.searchParams.set("sec", sec)
  url.searchParams.set("version", FHL_VERSION_CODE[version])
  url.searchParams.set("gb", "0")

  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) return null

  const data = await res.json()
  if (data.status !== "success" || !Array.isArray(data.record) || data.record.length === 0) return null

  return {
    version,
    versionLabel: BIBLE_VERSIONS[version].label,
    bookLabel: bookMeta.fullName,
    reference: ref,
    verses: data.record.map((r: { sec: number; bible_text: string }) => parseVerse(r.sec, r.bible_text)),
  }
}

// 現代中文譯本會在段落開頭夾 <h2>標題</h2>（例如「尼希米去耶路撒冷」），
// 要保留起來當小標題顯示，不能跟著 HTML tag 一起清掉。和合本原文在神／
// 耶和華等稱謂前會留一個全形空格（尊稱排版慣例），窄版卡片上會變成一段
// 突兀的空白，換成一般空格。
function parseVerse(verse: number, raw: string): BibleVerse {
  const headingMatch = /<h\d>(.*?)<\/h\d>/i.exec(raw)
  const heading = headingMatch ? headingMatch[1].replace(/<[^>]+>/g, "").trim() : undefined
  const withoutHeading = headingMatch ? raw.slice(headingMatch.index + headingMatch[0].length) : raw

  const text = withoutHeading
    .replace(/　/g, " ")
    .replace(/<[^>]+>/g, "")
    .trim()

  return heading ? { verse, text, heading } : { verse, text }
}
