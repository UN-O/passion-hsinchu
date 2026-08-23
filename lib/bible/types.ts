export type BibleVersionKey = "unv" | "tcv2019" | "niv"

export type BibleVersionMeta = {
  key: BibleVersionKey
  label: string
  language: "zh" | "en"
}

export const BIBLE_VERSIONS: Record<BibleVersionKey, BibleVersionMeta> = {
  unv: { key: "unv", label: "和合本", language: "zh" },
  tcv2019: { key: "tcv2019", label: "現代中文譯本2019", language: "zh" },
  niv: { key: "niv", label: "NIV", language: "en" },
}

// 段落參照。verseEnd 省略＝單節。跟 entry.reference 的字串格式（例如
// "NEH.2.11-20"）可以互轉，見 reference.ts。
export type BibleReference = {
  book: string
  chapter: number
  verseStart: number
  verseEnd?: number
}

export type BibleVerse = {
  verse: number
  text: string
  // 這節開頭若有段落標題（例如 NIV 的 "Nehemiah Inspects Jerusalem's
  // Walls"、現代中文譯本的 <h2> 標題），保留在這裡，不要跟著內文一起丟掉——
  // 畫面上要當成一段小標題顯示，不是內文的一部分。
  heading?: string
}

export type BiblePassage = {
  version: BibleVersionKey
  versionLabel: string
  bookLabel: string
  reference: BibleReference
  verses: BibleVerse[]
}
