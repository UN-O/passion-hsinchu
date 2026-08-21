import { versePrayerCategoryDraw } from "@/lib/opening-gradients"
import { genRyuMin } from "@/app/fonts/gen-ryu-min"

export type ExportCardData = {
  label: string
  verse: string
  verseRef?: string
  categoryKey?: "A" | "B" | "C" | "D"
}

const LOGO_SRC = "/images/conference-hero-logo.webp"
const VISUAL_SRC = "/images/conference-export-visual.png"

// 540×675（4:5）、2 倍輸出 → 1080×1350，跟原本 ExportCard／
// downloadNodeAsImage 用的規格一致。
const CARD_WIDTH = 540
const CARD_HEIGHT = 675
const SCALE = 2
const PADDING = 48 * SCALE // p-12
const GAP = 24 * SCALE // gap-6
const GAP_SMALL = 16 * SCALE // gap-4

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`圖片載入失敗：${src}`))
    img.src = src
  })
}

const BREAK_AFTER = new Set(["，", "。", "！", "？", "；", "：", "、", ","])

// 中日韓字元各自是一個 token，連續的英數字／空白（例如姓名裡的英文）當一個
// token 不能被拆開。
function tokenize(text: string): string[] {
  const tokens: string[] = []
  let i = 0
  while (i < text.length) {
    const ch = text[i]
    if (/[A-Za-z0-9\s]/.test(ch)) {
      let j = i
      while (j < text.length && /[A-Za-z0-9\s]/.test(text[j])) j++
      tokens.push(text.slice(i, j))
      i = j
    } else {
      tokens.push(ch)
      i++
    }
  }
  return tokens
}

// 逐 token 疊寬度，快超出時優先回頭找目前這行最後一個標點符號、從它後面斷行
// （對齊畫面上 conference-verse-prayer-step.tsx 用 text-wrap:pretty 達到的
// 「不會斷在詞語中間、優先斷在逗號句號後面」效果——canvas 文字沒有這個 CSS
// 屬性可用，用同樣的規則手動實作一次）；找不到標點才退回硬斷。
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const tokens = tokenize(text)
  const lines: string[] = []
  let line = ""
  for (const token of tokens) {
    const candidate = line + token
    if (line !== "" && ctx.measureText(candidate).width > maxWidth) {
      let breakAt = -1
      for (let i = line.length - 1; i >= 0; i--) {
        if (BREAK_AFTER.has(line[i])) {
          breakAt = i + 1
          break
        }
      }
      if (breakAt > 0) {
        lines.push(line.slice(0, breakAt))
        line = line.slice(breakAt) + token
      } else {
        lines.push(line)
        line = token
      }
    } else {
      line = candidate
    }
  }
  if (line) lines.push(line)
  return lines
}

// 「儲存圖片」不再用 html-to-image 截圖 DOM，改成從頭在一張真正的 <canvas>
// 上直接畫出整張輸出圖。前兩版分別把背景（canvas→CSS 漸層）跟 LOGO／底部
// 主視覺（一般路徑→預先讀好的 data URI）改掉，想避開的都是「html-to-image
// 把 DOM 序列化成 SVG、包進 foreignObject 再畫回 canvas」這個機制本身在
// 真機 Safari 上不可靠；使用者換了兩次修法後，LOGO／底部主視覺還是不見，
// 代表問題出在 foreignObject 裡的 <img> 本身，不是圖片有沒有預先讀好。
// 這裡乾脆整個不透過 DOM 截圖：直接用 ctx.drawImage／ctx.fillText 把畫面上
// 看到的每一塊（漸層背景、LOGO、經文文字、底部主視覺）在真正的 canvas 上
// 畫一次，畫完直接 toBlob()。全程都是同步的 canvas 繪圖 API，沒有 DOM
// 序列化、沒有 foreignObject，跟前面兩個修法屬於同一個「不要依賴擷取，
// 讓系統自己生成」的方向，但這次連圖片、文字都一起自己生成。
export async function renderConferenceExportCard(data: ExportCardData): Promise<HTMLCanvasElement> {
  const width = CARD_WIDTH * SCALE
  const height = CARD_HEIGHT * SCALE
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("無法取得 2d context")

  versePrayerCategoryDraw(data.categoryKey)(ctx, { width, height, time: 0 })

  const [logoImg, visualImg] = await Promise.all([loadImage(LOGO_SRC), loadImage(VISUAL_SRC)])
  await document.fonts.load(`700 ${24 * SCALE}px ${genRyuMin.style.fontFamily}`).catch(() => {})

  const contentX = PADDING
  const contentWidth = width - PADDING * 2

  const logoWidth = contentWidth * 0.55
  const logoHeight = logoWidth * (logoImg.naturalHeight / logoImg.naturalWidth)
  ctx.drawImage(logoImg, contentX + (contentWidth - logoWidth) / 2, PADDING, logoWidth, logoHeight)

  const visualWidth = contentWidth
  const visualHeight = visualWidth * (visualImg.naturalHeight / visualImg.naturalWidth)
  const visualY = height - PADDING - visualHeight
  ctx.globalAlpha = 0.2
  ctx.drawImage(visualImg, contentX, visualY, visualWidth, visualHeight)
  ctx.globalAlpha = 1

  const middleTop = PADDING + logoHeight + GAP
  const middleBottom = visualY - GAP
  const centerX = width / 2

  const labelFontSize = 14 * SCALE
  const verseFontSize = 24 * SCALE
  const verseLineHeight = verseFontSize * 1.625 // leading-relaxed
  const verseRefFontSize = 16 * SCALE
  const verseMaxWidth = Math.min(contentWidth * 0.74, 28 * 16 * SCALE) // w-[min(74%,28rem)]

  ctx.font = `700 ${verseFontSize}px ${genRyuMin.style.fontFamily}, sans-serif`
  const lines = wrapText(ctx, data.verse, verseMaxWidth)

  const labelLineHeight = labelFontSize * 1.2
  const verseRefLineHeight = verseRefFontSize * 1.2
  const blockHeight =
    labelLineHeight +
    GAP_SMALL +
    lines.length * verseLineHeight +
    (data.verseRef ? GAP_SMALL + verseRefLineHeight : 0)

  let cursorY = middleTop + (middleBottom - middleTop - blockHeight) / 2

  ctx.textAlign = "center"
  ctx.textBaseline = "top"

  ctx.font = `${labelFontSize}px -apple-system, "PingFang TC", sans-serif`
  ctx.fillStyle = "rgba(255,255,255,0.7)"
  ctx.fillText(data.label, centerX, cursorY)
  cursorY += labelLineHeight + GAP_SMALL

  ctx.font = `700 ${verseFontSize}px ${genRyuMin.style.fontFamily}, sans-serif`
  ctx.fillStyle = "#ffffff"
  for (const line of lines) {
    ctx.fillText(line, centerX, cursorY)
    cursorY += verseLineHeight
  }

  if (data.verseRef) {
    cursorY += GAP_SMALL
    ctx.font = `${verseRefFontSize}px -apple-system, "PingFang TC", sans-serif`
    ctx.fillStyle = "rgba(255,255,255,0.7)"
    ctx.fillText(`（${data.verseRef}）`, centerX, cursorY)
  }

  return canvas
}

export async function downloadConferenceExportCard(data: ExportCardData, filename: string) {
  const canvas = await renderConferenceExportCard(data)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"))
  if (!blob) return

  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
