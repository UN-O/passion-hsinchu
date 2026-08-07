// 名冊比對用的正規化。原始值仍會完整保留在 enrollment.name / enrollment.church，
// 這裡產生的只是拿來比對的 *_norm 欄位。
//
// 政策是「比對不到就擋下來」，所以這裡每漏掉一種寫法變體，現場就多一個進不去的人。

// 複製貼上常帶進來的零寬字元，肉眼看不見但會讓比對失敗。
// 用字串建構避免在原始碼裡放進看不見的字元。
const ZERO_WIDTH = new RegExp("[\\u200B-\\u200D\\uFEFF]", "g")

function baseNormalize(input: string): string {
  return input
    .normalize("NFKC") // 全形英數 → 半形、相容字元展開（全形空格也會變成一般空格）
    .replace(ZERO_WIDTH, "")
    .replace(/\s+/g, "") // 中文姓名中間的空白沒有意義，一律移除
    .toLowerCase()
}

// 姓名是使用者自己輸入的，這是登入能不能成功的關鍵
export function normalizeName(input: string): string {
  return baseNormalize(input)
}

// 教會在 UI 上是從 DB 撈的下拉選單，使用者不會手打，
// 所以這裡主要是讓 CSV 重複匯入時能對到同一列（台北/臺北混用非常普遍）。
export function normalizeChurch(input: string): string {
  return baseNormalize(input).replace(/臺/g, "台")
}
