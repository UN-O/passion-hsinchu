import { genRyuMin } from "@/app/fonts/gen-ryu-min"

// 後台「下載名單（圖片）」。輸出 16:9、可以直接丟進 PPT 的投影片，視覺跟
// 特會任務主頁一致：純藍底＋背景照片（模糊處理，呼應頁面上玻璃卡片的
// 毛玻璃質感）、PASSION LOGO、標題字體用 genRyuMin（跟開場經文、靈修卡片
// 同一套），名單本身放在一塊半透明玻璃面板裡。人多的工作坊一張投影片放
// 不下，就自動分成好幾張（頁首同樣的標題＋「2/3」這種頁碼），每張都還是
// 完整的 16:9，丟進 PPT 可以直接當連續兩三張投影片用。

export type WorkshopRosterData = {
  title: string
  speaker: string
  location: string
  roundLabel: string
  roundTimeLabel: string
  dateLabel: string
  roster: { name: string; church: string }[]
}

const WIDTH = 1920
const HEIGHT = 1080
const PADDING = 96
const LOGO_SRC = "/images/conference-hero-logo.webp"
const BACKGROUND_SRC = "/images/conference-background.webp"
const BLUE = "#0458e2"

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`圖片載入失敗：${src}`))
    img.src = src
  })
}

// 背景照片模糊後鋪滿，跟主頁上玻璃卡片後面透出來的效果同一個方向——
// canvas 2D 的 ctx.filter 支援 blur()，不用真的做 backdrop-sampling。
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

  // 藍色疊一層，壓住模糊照片的雜訊，確保白字在任何位置都夠對比
  ctx.fillStyle = BLUE
  ctx.globalAlpha = 0.35
  ctx.fillRect(0, 0, WIDTH, HEIGHT)
  ctx.globalAlpha = 1
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function drawHeader(
  ctx: CanvasRenderingContext2D,
  logo: HTMLImageElement,
  data: WorkshopRosterData,
  pageLabel: string
) {
  const logoWidth = 420
  const logoHeight = logoWidth * (logo.naturalHeight / logo.naturalWidth)
  ctx.drawImage(logo, (WIDTH - logoWidth) / 2, PADDING * 0.6, logoWidth, logoHeight)

  const titleY = PADDING * 0.6 + logoHeight + 40
  ctx.textAlign = "center"
  ctx.textBaseline = "top"

  ctx.font = `700 44px ${genRyuMin.style.fontFamily}, "PingFang TC", sans-serif`
  ctx.fillStyle = "#ffffff"
  ctx.fillText(data.title, WIDTH / 2, titleY)

  ctx.font = `28px -apple-system, "PingFang TC", sans-serif`
  ctx.fillStyle = "rgba(255,255,255,0.75)"
  const subtitle = `${data.speaker}｜${data.location}｜${data.dateLabel} ${data.roundLabel}｜${data.roundTimeLabel}｜共 ${data.roster.length} 人${pageLabel}`
  ctx.fillText(subtitle, WIDTH / 2, titleY + 64)
}

// 一張投影片的玻璃面板放得下幾個人（先量測，決定要分幾張），欄數固定 3 欄，
// 人多時欄數不變、往下加高不會超出面板——超過面板高度的部分本來就該分頁。
const COLUMNS = 3
const ROW_HEIGHT = 56
const COL_GAP = 48
const ROW_GAP_TOP = 140 // 面板頂端到第一列名字的距離（面板標題留白）

function panelRect(headerHeight: number) {
  const y = headerHeight
  const height = HEIGHT - headerHeight - PADDING
  return { x: PADDING, y, width: WIDTH - PADDING * 2, height }
}

function rowsPerPage(panelHeight: number): number {
  const usable = panelHeight - ROW_GAP_TOP - 40
  return Math.max(1, Math.floor(usable / ROW_HEIGHT)) * COLUMNS
}

export async function renderWorkshopRosterSlides(data: WorkshopRosterData): Promise<HTMLCanvasElement[]> {
  const [logo, background] = await Promise.all([loadImage(LOGO_SRC), loadImage(BACKGROUND_SRC)])
  await document.fonts.load(`700 44px ${genRyuMin.style.fontFamily}`).catch(() => {})

  const headerHeight = 420
  const panel = panelRect(headerHeight)
  const perPage = data.roster.length > 0 ? rowsPerPage(panel.height) : 1
  const pageCount = Math.max(1, Math.ceil(data.roster.length / perPage))

  const canvases: HTMLCanvasElement[] = []

  for (let page = 0; page < pageCount; page++) {
    const canvas = document.createElement("canvas")
    canvas.width = WIDTH
    canvas.height = HEIGHT
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("無法取得 2d context")

    drawBlurredBackground(ctx, background)

    const pageLabel = pageCount > 1 ? `（${page + 1}/${pageCount}）` : ""
    drawHeader(ctx, logo, data, pageLabel)

    // 玻璃面板：跟主頁卡片同一種半透明白＋圓角，這裡照片本身已經模糊過，
    // 面板只需要疊一層半透明白色，看起來就是同一套毛玻璃語言。
    ctx.fillStyle = "rgba(255,255,255,0.12)"
    roundRect(ctx, panel.x, panel.y, panel.width, panel.height, 32)
    ctx.fill()
    ctx.strokeStyle = "rgba(255,255,255,0.25)"
    ctx.lineWidth = 2
    roundRect(ctx, panel.x, panel.y, panel.width, panel.height, 32)
    ctx.stroke()

    const pageEntries = data.roster.slice(page * perPage, (page + 1) * perPage)
    const colWidth = (panel.width - COL_GAP * (COLUMNS - 1)) / COLUMNS
    const rowsInCol = Math.ceil(pageEntries.length / COLUMNS) || 1

    ctx.textAlign = "left"
    ctx.textBaseline = "top"
    pageEntries.forEach((entry, i) => {
      const col = Math.floor(i / rowsInCol)
      const row = i % rowsInCol
      const x = panel.x + 48 + col * (colWidth + COL_GAP)
      const y = panel.y + ROW_GAP_TOP + row * ROW_HEIGHT

      ctx.font = `600 26px -apple-system, "PingFang TC", sans-serif`
      ctx.fillStyle = "#ffffff"
      ctx.fillText(`${page * perPage + i + 1}. ${entry.name}`, x, y)

      ctx.font = `22px -apple-system, "PingFang TC", sans-serif`
      ctx.fillStyle = "rgba(255,255,255,0.65)"
      ctx.fillText(entry.church, x, y + 30)
    })

    canvases.push(canvas)
  }

  return canvases
}

export async function downloadWorkshopRosterImages(data: WorkshopRosterData, filenamePrefix: string) {
  const canvases = await renderWorkshopRosterSlides(data)

  for (let i = 0; i < canvases.length; i++) {
    const blob = await new Promise<Blob | null>((resolve) => canvases[i].toBlob(resolve, "image/png"))
    if (!blob) continue

    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = canvases.length > 1 ? `${filenamePrefix}-${i + 1}.png` : `${filenamePrefix}.png`
    link.click()
    URL.revokeObjectURL(url)

    // 瀏覽器對短時間內連續觸發的多次下載常有節流／攔截，串行間隔一下
    // 比較不會被當成一次可疑的批次下載擋掉。
    if (i < canvases.length - 1) await new Promise((resolve) => setTimeout(resolve, 400))
  }
}
