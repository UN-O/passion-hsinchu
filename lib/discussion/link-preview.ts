import { createHash } from "node:crypto"
import { lookup } from "node:dns/promises"
import { isIP } from "node:net"
import { eq, inArray } from "drizzle-orm"

import { db } from "@/db"
import { linkPreviews } from "@/db/schema/discussion"
import { putObject } from "@/lib/r2"
import type { LinkPreviewDTO } from "./dto"
import { displayHost, normalizeUrl } from "./links"

// 連結預覽卡片的伺服器端：抓對方頁面的 <head>、解出 og:* 標籤、把縮圖
// 收進自己的 R2，然後以網址為單位快取起來。
//
// ⚠ 這支程式碼會用「使用者給的網址」去發請求，是典型的 SSRF 面：沒有防護
// 的話，任何人只要在討論區貼一則留言，就能叫我們的伺服器去打內網位址、
// 雲端的 metadata endpoint（169.254.169.254）或 localhost 上的服務，
// 而且把回應內容渲染成卡片給他看。所以下面每一次連線（含每一次轉址）
// 都要重新驗證目的地。

const FETCH_TIMEOUT_MS = 6000
const MAX_HTML_BYTES = 1024 * 1024
const MAX_IMAGE_BYTES = 1_500_000
const MAX_REDIRECTS = 3
// 快取多久之後重抓。頁面標題會改、圖片會換，但不需要即時。
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000

function toDTO(row: typeof linkPreviews.$inferSelect): LinkPreviewDTO | null {
  if (row.status !== "ok") return null
  // 標題都沒有的頁面做不出卡片（只會是一塊寫著網域的空框）。
  if (!row.title && !row.description && !row.imageKey) return null
  return {
    url: row.url,
    host: displayHost(row.url),
    title: row.title,
    description: row.description,
    siteName: row.siteName,
    imageUrl: row.imageKey ? `/api/discussion/link-image/${row.id}` : null,
  }
}

// 目的地是不是「公開網際網路上的某台機器」。私有網段、loopback、
// link-local（雲端 metadata 就住在這裡）一律拒絕。
function isPublicAddress(address: string): boolean {
  if (isIP(address) === 6) {
    const value = address.toLowerCase()
    if (value === "::1" || value === "::") return false
    //唯一位址（fc00::/7）、link-local（fe80::/10）
    if (/^f[cd]/.test(value) || value.startsWith("fe8") || value.startsWith("fe9") || value.startsWith("fea") || value.startsWith("feb")) {
      return false
    }
    // ::ffff:10.0.0.1 這種 IPv4-mapped 位址要拆出來用 IPv4 的規則看
    const mapped = value.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
    if (mapped) return isPublicAddress(mapped[1])
    return true
  }

  const parts = address.split(".").map(Number)
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return false
  const [a, b] = parts
  if (a === 0 || a === 10 || a === 127) return false
  if (a === 169 && b === 254) return false // link-local／雲端 metadata
  if (a === 172 && b >= 16 && b <= 31) return false
  if (a === 192 && b === 168) return false
  if (a === 100 && b >= 64 && b <= 127) return false // CGNAT
  if (a >= 224) return false // multicast／保留
  return true
}

// 連線前先確認這個網址指向的位址是公開的。
//
// 這裡用 DNS 查詢的結果判斷，理論上仍有 TOCTOU（查完到連線之間 DNS 換了
// 答案）——要完全消除得自己接管連線、把 socket 綁到已驗證的 IP 上。以這個
// 專案的風險程度（攻擊者最多只能讓伺服器去打一次內網並看到卡片標題）來說，
// 擋掉「直接寫內網位址」跟「用網域指向內網」這兩種實際會發生的情況已經
// 足夠；留這段註解是為了之後有人要收緊時知道差在哪。
async function assertSafeTarget(url: URL): Promise<void> {
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("unsupported protocol")

  const host = url.hostname.replace(/^\[|\]$/g, "")
  if (isIP(host)) {
    if (!isPublicAddress(host)) throw new Error("private address")
    return
  }
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new Error("private host")
  }

  const results = await lookup(host, { all: true })
  if (results.length === 0) throw new Error("dns failed")
  if (!results.every((result) => isPublicAddress(result.address))) throw new Error("private address")
}

// 自己處理轉址：fetch 的自動轉址沒辦法在每一跳之間插入檢查，而「公開網址
// 轉址到內網」正是繞過上面那道檢查最簡單的方法。
async function safeFetch(rawUrl: string, accept: string): Promise<Response> {
  let current = new URL(rawUrl)

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertSafeTarget(current)

    const response = await fetch(current, {
      redirect: "manual",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        // 有些站對沒有 UA 的請求直接回 403。表明自己是誰，不假裝成瀏覽器。
        "User-Agent": "PassionHsinchuBot/1.0 (+https://passion-hsinchu.com)",
        Accept: accept,
      },
    })

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location")
      if (!location) throw new Error("redirect without location")
      current = new URL(location, current)
      continue
    }
    return response
  }
  throw new Error("too many redirects")
}

// 只讀前面一段就夠了——整份文件可能有好幾 MB，而我們要的東西都在前面。
async function readCapped(response: Response, maxBytes: number): Promise<Uint8Array> {
  const reader = response.body?.getReader()
  if (!reader) return new Uint8Array()

  const chunks: Uint8Array[] = []
  let total = 0
  while (total < maxBytes) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    total += value.byteLength
  }
  await reader.cancel().catch(() => {})

  const merged = new Uint8Array(Math.min(total, maxBytes))
  let offset = 0
  for (const chunk of chunks) {
    const room = merged.length - offset
    if (room <= 0) break
    merged.set(chunk.subarray(0, room), offset)
    offset += Math.min(chunk.byteLength, room)
  }
  return merged
}

function decodeEntities(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
}

// 用正規表達式讀 meta 標籤，不引進 HTML parser：要拿的東西只有四個固定的
// 屬性，而且輸入已經被截到 1MB。屬性順序兩種寫法都要接得住
// （<meta property="og:title" content="...">／content 在前）。
function readMeta(html: string, keys: string[]): string | null {
  for (const key of keys) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const patterns = [
      new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]*content=["']([^"']*)["']`, "i"),
      new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${escaped}["']`, "i"),
    ]
    for (const pattern of patterns) {
      const match = html.match(pattern)
      if (match?.[1]?.trim()) return decodeEntities(match[1].trim())
    }
  }
  return null
}

function clamp(value: string | null, max: number): string | null {
  if (!value) return null
  const trimmed = value.replace(/\s+/g, " ").trim()
  if (!trimmed) return null
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed
}

// 有些站的 og:* 標籤埋在超大的 HTML 深處（YouTube 的 watch 頁整份有 1.2MB，
// og:title 在第 690KB），與其為了它們把「要讀多少 bytes」一路往上加，不如
// 直接走它們自己提供的 oEmbed 端點：一個小小的 JSON，就有標題、作者、縮圖。
const OEMBED_PROVIDERS: { hosts: RegExp; endpoint: string }[] = [
  { hosts: /(^|\.)youtube\.com$|^youtu\.be$/, endpoint: "https://www.youtube.com/oembed" },
  { hosts: /(^|\.)vimeo\.com$/, endpoint: "https://vimeo.com/api/oembed.json" },
]

function oembedEndpointFor(url: string): string | null {
  try {
    const host = new URL(url).hostname
    return OEMBED_PROVIDERS.find((provider) => provider.hosts.test(host))?.endpoint ?? null
  } catch {
    return null
  }
}

type Metadata = {
  title: string | null
  description: string | null
  siteName: string | null
  imageUrl: string | null
}

async function fetchOEmbed(endpoint: string, url: string): Promise<Metadata> {
  const target = `${endpoint}?format=json&url=${encodeURIComponent(url)}`
  const response = await safeFetch(target, "application/json")
  if (!response.ok) throw new Error(`oembed http ${response.status}`)

  const raw = new TextDecoder().decode(await readCapped(response, 64 * 1024))
  const data = JSON.parse(raw) as {
    title?: string
    author_name?: string
    provider_name?: string
    thumbnail_url?: string
  }

  return {
    title: clamp(data.title ?? null, 120),
    // oEmbed 沒有描述欄位，作者名稱是這裡最有用的第二行。
    description: clamp(data.author_name ?? null, 200),
    siteName: clamp(data.provider_name ?? null, 60),
    imageUrl: data.thumbnail_url ? new URL(data.thumbnail_url, url).toString() : null,
  }
}

async function fetchMetadata(url: string): Promise<Metadata> {
  const oembed = oembedEndpointFor(url)
  if (oembed) {
    try {
      return await fetchOEmbed(oembed, url)
    } catch {
      // oEmbed 掛了就照一般流程去讀 HTML，不要因此整張卡片都沒有。
    }
  }

  const response = await safeFetch(url, "text/html,application/xhtml+xml")
  if (!response.ok) throw new Error(`http ${response.status}`)

  const contentType = response.headers.get("content-type") ?? ""
  if (!contentType.includes("html")) throw new Error("not html")

  const html = new TextDecoder("utf-8", { fatal: false }).decode(await readCapped(response, MAX_HTML_BYTES))

  const rawImage = readMeta(html, ["og:image", "og:image:url", "twitter:image"])
  return {
    title:
      clamp(readMeta(html, ["og:title", "twitter:title"]), 120) ??
      clamp(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ? decodeEntities(html.match(/<title[^>]*>([^<]*)<\/title>/i)![1]) : null, 120),
    description: clamp(readMeta(html, ["og:description", "twitter:description", "description"]), 200),
    siteName: clamp(readMeta(html, ["og:site_name"]), 60),
    // og:image 常常是相對路徑
    imageUrl: rawImage ? new URL(rawImage, url).toString() : null,
  }
}

// 把對方的縮圖收進自己的 R2。存起來（而不是每次渲染都去對方站上抓）有兩
// 個理由：看貼文的人不會被第三方站台看到 IP，對方的圖之後改掉或掛掉也
// 不會讓卡片破圖。
async function storeImage(imageUrl: string, previewUrl: string): Promise<string | null> {
  try {
    const response = await safeFetch(imageUrl, "image/*")
    if (!response.ok) return null

    const contentType = (response.headers.get("content-type") ?? "").split(";")[0].trim()
    if (!contentType.startsWith("image/")) return null

    const declared = Number(response.headers.get("content-length") ?? 0)
    if (declared > MAX_IMAGE_BYTES) return null

    const bytes = await readCapped(response, MAX_IMAGE_BYTES + 1)
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_IMAGE_BYTES) return null

    const extension = contentType.split("/")[1]?.replace(/[^a-z0-9]/gi, "").slice(0, 5) || "img"
    const key = `link-preview/${createHash("sha256").update(previewUrl).digest("hex")}.${extension}`
    await putObject(key, bytes, contentType)
    return key
  } catch {
    // 縮圖抓不到不算失敗，卡片還是可以只有標題跟描述。
    return null
  }
}

// 取得（必要時抓取並快取）一個網址的預覽。回傳 null＝這個網址做不出卡片。
export async function ensureLinkPreview(rawUrl: string): Promise<LinkPreviewDTO | null> {
  const url = normalizeUrl(rawUrl)
  if (!url) return null

  const [cached] = await db.select().from(linkPreviews).where(eq(linkPreviews.url, url)).limit(1)
  if (cached && Date.now() - cached.fetchedAt.getTime() < CACHE_TTL_MS) return toDTO(cached)

  let values: Omit<typeof linkPreviews.$inferInsert, "url">
  try {
    const metadata = await fetchMetadata(url)
    const imageKey = metadata.imageUrl ? await storeImage(metadata.imageUrl, url) : null
    values = {
      status: "ok",
      title: metadata.title,
      description: metadata.description,
      siteName: metadata.siteName,
      imageKey,
      fetchedAt: new Date(),
    }
  } catch {
    // 抓不到也要寫一列：沒有這一列的話，每次有人看到這則貼文都會再去
    // 連一次那個連不上的網址。
    values = { status: "failed", title: null, description: null, siteName: null, imageKey: null, fetchedAt: new Date() }
  }

  const [row] = await db
    .insert(linkPreviews)
    .values({ url, ...values })
    .onConflictDoUpdate({ target: linkPreviews.url, set: values })
    .returning()

  return toDTO(row)
}

// 列表渲染用：一次把好幾則貼文的連結預覽撈出來。只讀快取，不在這裡發外部
// 請求——列表要能立刻回應，沒抓過的連結由前端自己補打一次 server action
// （見 lib/discussion/actions.ts 的 loadLinkPreview）。
export async function fetchCachedPreviews(rawUrls: string[]): Promise<Map<string, LinkPreviewDTO>> {
  const urls = [...new Set(rawUrls.map(normalizeUrl).filter((url): url is string => url !== null))]
  if (urls.length === 0) return new Map()

  const rows = await db.select().from(linkPreviews).where(inArray(linkPreviews.url, urls))

  const result = new Map<string, LinkPreviewDTO>()
  for (const row of rows) {
    const dto = toDTO(row)
    if (dto) result.set(row.url, dto)
  }
  return result
}

// 讀取端點要用的：拿 preview id 換 R2 key。
export async function getLinkImageKey(previewId: string): Promise<string | null> {
  const [row] = await db
    .select({ imageKey: linkPreviews.imageKey })
    .from(linkPreviews)
    .where(eq(linkPreviews.id, previewId))
    .limit(1)
  return row?.imageKey ?? null
}
