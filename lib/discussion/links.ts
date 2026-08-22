// 純文字裡的網址處理。這個檔案不 import 任何伺服器端的東西——client
// component 要用同一套規則把內文切成「文字 / 連結」，伺服器端也要用同一
// 套規則決定「要幫哪個網址抓預覽卡片」，兩邊必須完全一致，不然畫面上看到
// 的連結跟卡片會對不起來。

// 只認 http/https 開頭的完整網址。刻意不做「www.xxx.com 也算網址」那種
// 猜測：貼文裡出現的裸網域經常只是講到某個站，把它變成可點的連結（甚至
// 去抓它的預覽）不是使用者的意思。
const URL_PATTERN = /https?:\/\/[^\s<>"']+/gi

// 網址結尾常常黏到中文標點或括號（「詳見 https://a.com/b。」），這些字元
// 不該算進網址裡。成對的右括號只有在前面沒有對應的左括號時才切掉——
// 維基百科那種 https://zh.wikipedia.org/wiki/C_(程式語言) 的網址是合法的。
function trimTrailingPunctuation(url: string): string {
  let end = url.length
  while (end > 0) {
    const char = url[end - 1]
    if (".,;:!?、。，；：！？「」『』…".includes(char)) {
      end -= 1
      continue
    }
    if (char === ")" || char === "）" || char === "]" || char === "】") {
      const open = char === ")" ? "(" : char === "）" ? "（" : char === "]" ? "[" : "【"
      const slice = url.slice(0, end - 1)
      // 數量對得起來就留著，代表這個右括號是網址的一部分。
      if (slice.split(open).length > slice.split(char).length) break
      end -= 1
      continue
    }
    break
  }
  return url.slice(0, end)
}

export type ContentSegment = { kind: "text"; value: string } | { kind: "link"; value: string }

// 把內文切成文字段落跟連結段落，順序保持原樣（渲染時直接照這個陣列走）。
export function splitContentByUrls(content: string): ContentSegment[] {
  const segments: ContentSegment[] = []
  let lastIndex = 0

  for (const match of content.matchAll(URL_PATTERN)) {
    const raw = match[0]
    const url = trimTrailingPunctuation(raw)
    const start = match.index ?? 0
    if (start > lastIndex) segments.push({ kind: "text", value: content.slice(lastIndex, start) })
    segments.push({ kind: "link", value: url })
    lastIndex = start + url.length
  }

  if (lastIndex < content.length) segments.push({ kind: "text", value: content.slice(lastIndex) })
  return segments
}

// 一則貼文只做一張預覽卡片，用的是內文裡第一個網址（跟 Threads／FB 一樣）。
// 貼一整排連結的貼文不該長出一整排卡片。
export function firstUrlInContent(content: string): string | null {
  for (const segment of splitContentByUrls(content)) {
    if (segment.kind === "link") return segment.value
  }
  return null
}

// 快取的鍵。去掉 hash（#之後只影響瀏覽器捲到哪裡，同一個頁面）跟結尾的
// 斜線，避免同一個頁面因為寫法不同被抓兩次。查詢字串保留——很多站的內容
// 就是靠 query 決定的（?v=xxx 的 YouTube 影片）。
export function normalizeUrl(raw: string): string | null {
  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    return null
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null
  parsed.hash = ""
  if (parsed.pathname.endsWith("/") && parsed.pathname !== "/") {
    parsed.pathname = parsed.pathname.replace(/\/+$/, "")
  }
  return parsed.toString()
}

// 卡片上顯示的網域（去掉 www.），讓人一眼看出這個連結會把他帶去哪裡。
export function displayHost(raw: string): string {
  try {
    return new URL(raw).hostname.replace(/^www\./, "")
  } catch {
    return raw
  }
}

// root post 的內文是 markdown（一般回覆是純文字），所以裸網址要另外處理：
// CommonMark 只有寫成 [文字](網址) 或 <網址> 才會變成連結，直接貼一串
// https://... 會被當成普通文字印出來。這裡把裸網址包成 <網址>（CommonMark
// 的 autolink 語法），交給 markdown 自己渲染成 <a>，不用另外加 remark 外掛。
//
// 已經是連結的地方不能再包一層，所以先把「不該碰的片段」整段跳過：
// 程式碼區塊、行內程式碼、[文字](網址)／![說明](網址)、已經寫成 <網址>
// 的自動連結。
const MARKDOWN_SKIP = /(```[\s\S]*?```|`[^`\n]*`|!?\[[^\]]*\]\([^)]*\)|<https?:\/\/[^>\s]*>)/g

export function autolinkMarkdown(markdown: string): string {
  return markdown
    .split(MARKDOWN_SKIP)
    .map((segment, index) => {
      // split 帶捕獲群組時，奇數索引就是被跳過的那些片段，原樣保留。
      if (index % 2 === 1) return segment
      return splitContentByUrls(segment)
        .map((part) => (part.kind === "link" ? `<${part.value}>` : part.value))
        .join("")
    })
    .join("")
}
