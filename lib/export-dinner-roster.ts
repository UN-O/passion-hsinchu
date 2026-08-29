import { genRyuMin } from "@/app/fonts/gen-ryu-min"

// 後台「晚餐名單」下載圖片／簽到表，跟 lib/export-workshop-roster.ts 同一套
// 視覺語言（藍底＋背景照片模糊、PASSION LOGO、genRyuMin 標題字），但這裡
// 是真正畫格線的表格（工作坊那支是自由排列的姓名清單）——「是否領取」欄
// 是現場發便當時核對用的空格勾選框，一般名單跟簽到表共用同一支 render
// function，差別只在 withCheckColumn 要不要多畫最後一欄。

export type DinnerRosterData = {
  mealLabel: string // 葷食 / 素食
  dateLabel: string
  timeLabel: string
  location: string
  roster: { name: string; church: string }[]
}

export type DinnerRosterOptions = {
  // 一頁分幾組表格並排，跟工作坊名單的欄數概念一樣。
  columns: number
  withCheckColumn: boolean
}

export const DEFAULT_DINNER_ROSTER_OPTIONS: DinnerRosterOptions = { columns: 2, withCheckColumn: false }

const WIDTH = 1920
const HEIGHT = 1080
const PADDING = 96
const LOGO_SRC = "/images/conference-hero-logo.webp"
const BACKGROUND_SRC = "/images/conference-background.webp"
const BLUE = "#0458e2"
// conference-hero-logo.webp 本身四周留了大量透明留白，見
// lib/export-workshop-roster.ts 同一個常數的說明——這裡直接沿用同一組裁切
// 座標，兩邊畫的是同一張 LOGO。
const LOGO_CROP = { sx: 1249, sy: 260, sWidth: 959, sHeight: 110 }

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`圖片載入失敗：${src}`))
    img.src = src
  })
}

function drawBlurredBackground(ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
  ctx.fillStyle = BLUE
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  const scale = Math.max(WIDTH / img.naturalWidth, HEIGHT / img.naturalHeight)
  const drawWidth = img.naturalWidth * scale
  const drawHeight = img.naturalHeight * scale
  ctx.save()
  ctx.filter = "blur(14px)"
  ctx.globalAlpha = 0.55
  ctx.drawImage(img, (WIDTH - drawWidth) / 2, (HEIGHT - drawHeight) / 2, drawWidth, drawHeight)
  ctx.restore()

  ctx.fillStyle = BLUE
  ctx.globalAlpha = 0.35
  ctx.fillRect(0, 0, WIDTH, HEIGHT)
  ctx.globalAlpha = 1
}

const HEADER_TOP = PADDING * 0.6

function drawHeader(
  ctx: CanvasRenderingContext2D,
  logo: HTMLImageElement,
  data: DinnerRosterData,
  withCheckColumn: boolean
) {
  const logoHeight = 90
  const logoWidth = logoHeight * (LOGO_CROP.sWidth / LOGO_CROP.sHeight)
  ctx.drawImage(
    logo,
    LOGO_CROP.sx,
    LOGO_CROP.sy,
    LOGO_CROP.sWidth,
    LOGO_CROP.sHeight,
    WIDTH - PADDING - logoWidth,
    HEADER_TOP,
    logoWidth,
    logoHeight
  )

  ctx.textAlign = "left"
  ctx.textBaseline = "top"

  const title = `晚餐${withCheckColumn ? "簽到表" : "名單"}・${data.mealLabel}`
  ctx.font = `700 44px ${genRyuMin.style.fontFamily}, "PingFang TC", sans-serif`
  ctx.fillStyle = "#ffffff"
  ctx.fillText(title, PADDING, HEADER_TOP + 6)

  ctx.font = `26px -apple-system, "PingFang TC", sans-serif`
  ctx.fillStyle = "rgba(255,255,255,0.75)"
  const subtitle = `${data.dateLabel} ${data.timeLabel}｜${data.location}｜共 ${data.roster.length} 人`
  ctx.fillText(subtitle, PADDING, HEADER_TOP + 62)
}

function drawPageNumber(ctx: CanvasRenderingContext2D, page: number, pageCount: number) {
  if (pageCount <= 1) return
  ctx.textAlign = "right"
  ctx.textBaseline = "bottom"
  ctx.font = `24px -apple-system, "PingFang TC", sans-serif`
  ctx.fillStyle = "rgba(255,255,255,0.6)"
  ctx.fillText(`${page + 1} / ${pageCount}`, WIDTH - PADDING * 0.6, HEIGHT - PADDING * 0.5)
}

const HEADER_ROW_HEIGHT = 48
const ROW_HEIGHT = 56
const GROUP_GAP = 40
const GROUP_TOP = 56 // 頁面內容區頂端到表格的距離

function contentRect(headerHeight: number) {
  const y = headerHeight
  const height = HEIGHT - headerHeight - PADDING
  return { x: PADDING, y, width: WIDTH - PADDING * 2, height }
}

function rowsPerGroup(contentHeight: number): number {
  const usable = contentHeight - GROUP_TOP - HEADER_ROW_HEIGHT
  return Math.max(1, Math.floor(usable / ROW_HEIGHT))
}

// 一組表格（姓名｜教會｜［是否領取］）：外框、表頭底色跟文字、直線分隔
// 欄位、橫線分隔列，是否領取欄畫一個空的勾選框，不預先打勾。
function drawTableGroup(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  entries: { name: string; church: string }[],
  withCheckColumn: boolean
) {
  const checkColWidth = withCheckColumn ? width * 0.18 : 0
  const remaining = width - checkColWidth
  const nameColWidth = remaining * 0.5
  const churchColWidth = remaining - nameColWidth
  const tableHeight = HEADER_ROW_HEIGHT + entries.length * ROW_HEIGHT

  ctx.fillStyle = "rgba(255,255,255,0.14)"
  ctx.fillRect(x, y, width, HEADER_ROW_HEIGHT)
  ctx.strokeStyle = "rgba(255,255,255,0.45)"
  ctx.lineWidth = 1.5
  ctx.strokeRect(x, y, width, tableHeight)

  ctx.textAlign = "left"
  ctx.textBaseline = "middle"
  ctx.font = `600 24px -apple-system, "PingFang TC", sans-serif`
  ctx.fillStyle = "rgba(255,255,255,0.85)"
  ctx.fillText("姓名", x + 16, y + HEADER_ROW_HEIGHT / 2)
  ctx.fillText("教會", x + nameColWidth + 16, y + HEADER_ROW_HEIGHT / 2)
  if (withCheckColumn) {
    ctx.textAlign = "center"
    ctx.fillText("是否領取", x + nameColWidth + churchColWidth + checkColWidth / 2, y + HEADER_ROW_HEIGHT / 2)
    ctx.textAlign = "left"
  }

  ctx.beginPath()
  ctx.moveTo(x + nameColWidth, y)
  ctx.lineTo(x + nameColWidth, y + tableHeight)
  ctx.moveTo(x + nameColWidth + churchColWidth, y)
  ctx.lineTo(x + nameColWidth + churchColWidth, y + tableHeight)
  ctx.strokeStyle = "rgba(255,255,255,0.28)"
  ctx.lineWidth = 1
  ctx.stroke()

  entries.forEach((entry, i) => {
    const rowY = y + HEADER_ROW_HEIGHT + i * ROW_HEIGHT
    if (i > 0) {
      ctx.beginPath()
      ctx.moveTo(x, rowY)
      ctx.lineTo(x + width, rowY)
      ctx.strokeStyle = "rgba(255,255,255,0.2)"
      ctx.lineWidth = 1
      ctx.stroke()
    }

    ctx.textAlign = "left"
    ctx.font = `600 26px -apple-system, "PingFang TC", sans-serif`
    ctx.fillStyle = "#ffffff"
    ctx.fillText(entry.name, x + 16, rowY + ROW_HEIGHT / 2)

    ctx.font = `24px -apple-system, "PingFang TC", sans-serif`
    ctx.fillStyle = "rgba(255,255,255,0.75)"
    ctx.fillText(entry.church, x + nameColWidth + 16, rowY + ROW_HEIGHT / 2)

    if (withCheckColumn) {
      const boxSize = 24
      const boxX = x + nameColWidth + churchColWidth + checkColWidth / 2 - boxSize / 2
      const boxY = rowY + ROW_HEIGHT / 2 - boxSize / 2
      ctx.strokeStyle = "rgba(255,255,255,0.75)"
      ctx.lineWidth = 2
      ctx.strokeRect(boxX, boxY, boxSize, boxSize)
    }
  })
}

export async function renderDinnerRosterSlides(
  data: DinnerRosterData,
  options: DinnerRosterOptions = DEFAULT_DINNER_ROSTER_OPTIONS
): Promise<HTMLCanvasElement[]> {
  const columns = Math.max(1, Math.min(4, Math.round(options.columns)))
  const [logo, background] = await Promise.all([loadImage(LOGO_SRC), loadImage(BACKGROUND_SRC)])
  await document.fonts.load(`700 44px ${genRyuMin.style.fontFamily}`).catch(() => {})

  const headerHeight = 210
  const content = contentRect(headerHeight)
  const perGroup = data.roster.length > 0 ? rowsPerGroup(content.height) : 1
  const perPage = Math.max(1, perGroup * columns)
  const pageCount = Math.max(1, Math.ceil(data.roster.length / perPage))

  const canvases: HTMLCanvasElement[] = []

  for (let page = 0; page < pageCount; page++) {
    const canvas = document.createElement("canvas")
    canvas.width = WIDTH
    canvas.height = HEIGHT
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("無法取得 2d context")

    drawBlurredBackground(ctx, background)
    drawHeader(ctx, logo, data, options.withCheckColumn)
    drawPageNumber(ctx, page, pageCount)

    const pageEntries = data.roster.slice(page * perPage, (page + 1) * perPage)
    const groupWidth = (content.width - GROUP_GAP * (columns - 1)) / columns

    for (let col = 0; col < columns; col++) {
      const groupEntries = pageEntries.slice(col * perGroup, (col + 1) * perGroup)
      if (groupEntries.length === 0) continue
      const groupX = content.x + col * (groupWidth + GROUP_GAP)
      drawTableGroup(ctx, groupX, content.y + GROUP_TOP, groupWidth, groupEntries, options.withCheckColumn)
    }

    canvases.push(canvas)
  }

  return canvases
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("轉換圖片失敗"))), "image/png")
  })
}

// 只有一張：直接下載那張 PNG。多張：打包成 zip 一次下載，
// 跟 lib/export-workshop-roster.ts 同一個做法。
export async function downloadDinnerRosterImages(
  data: DinnerRosterData,
  filenamePrefix: string,
  options: DinnerRosterOptions = DEFAULT_DINNER_ROSTER_OPTIONS
) {
  const canvases = await renderDinnerRosterSlides(data, options)

  if (canvases.length === 1) {
    const blob = await canvasToBlob(canvases[0])
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${filenamePrefix}.png`
    link.click()
    URL.revokeObjectURL(url)
    return
  }

  const { default: JSZip } = await import("jszip")
  const zip = new JSZip()
  for (let i = 0; i < canvases.length; i++) {
    const blob = await canvasToBlob(canvases[i])
    zip.file(`${filenamePrefix}-${i + 1}.png`, blob)
  }

  const zipBlob = await zip.generateAsync({ type: "blob" })
  const url = URL.createObjectURL(zipBlob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${filenamePrefix}.zip`
  link.click()
  URL.revokeObjectURL(url)
}
