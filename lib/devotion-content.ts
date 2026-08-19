export type DevotionEntry = {
  day: string
  title: string
  // USFM 格式的固定經節（book.chapter.verse-verse），例如 "JHN.3.16"、"NEH.2.11-20"。
  reference: string
}

// 靈修內容目前只拿到部分場次的資料，先放已經確定的，其餘（例如第一天早上）
// 等資料到齊再補進這個陣列，不要編造內容。
export const DEVOTION_ENTRIES: DevotionEntry[] = [
  { day: "第二天早上", title: "勇敢是：選擇神看為正確的是", reference: "NEH.2.11-20" },
  { day: "第三天早上", title: "勇敢是：相信耶穌已經得勝", reference: "JHN.16.25-33" },
]

// 中文標準譯本（繁體）。目前 YouVersion Platform API 只有兩個繁體中文譯本可選
// （中文標準譯本 CSBT、當代譯本 CCBT），沒有和合本；使用者可以用元件內建的
// 版本切換器改選，這裡只是預設值。
export const YOUVERSION_DEFAULT_VERSION_ID = 312
