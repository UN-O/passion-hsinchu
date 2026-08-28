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

export type WorkshopRosterOptions = {
  // 一頁分幾欄，後台預覽對話框可以調（見 roster-preview-dialog.tsx）。
  columns: number
}

export const DEFAULT_ROSTER_OPTIONS: WorkshopRosterOptions = { columns: 4 }

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

// 標題／副標左靠、LOGO 右靠、同一排——不是 LOGO 置中疊在標題正上方，
// 這樣頭部只需要一行文字的高度，省下來的空間讓下面名單面板可以更高
// （見 HEADER_HEIGHT、ROW_GAP_TOP 一起調小）。
const HEADER_TOP = PADDING * 0.6

// conference-hero-logo.webp 這個檔案本身四周留了大量透明留白（實測：真正
// 有內容的字樣只佔整張圖 3356×630 裡的 959×110，從 (1249,260) 開始）——
// 這是給網站頁首那種「LOGO 置中、上下都要留白」的排版用的，直接整張圖
// 等比縮放來畫，畫出來的字樣會比預期小很多、右邊界也對不齊，因為留白
// 也被一起縮放進去了。這裡改成只裁真正的字樣範圍來畫，才能做到「置右
// 對齊面板邊緣」跟「看起來夠大」。
const LOGO_CROP = { sx: 1249, sy: 260, sWidth: 959, sHeight: 110 }

function drawHeader(ctx: CanvasRenderingContext2D, logo: HTMLImageElement, data: WorkshopRosterData) {
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

  ctx.font = `700 44px ${genRyuMin.style.fontFamily}, "PingFang TC", sans-serif`
  ctx.fillStyle = "#ffffff"
  ctx.fillText(data.title, PADDING, HEADER_TOP + 6)

  ctx.font = `26px -apple-system, "PingFang TC", sans-serif`
  ctx.fillStyle = "rgba(255,255,255,0.75)"
  const subtitle = `${data.speaker}｜${data.location}｜${data.dateLabel} ${data.roundLabel}｜${data.roundTimeLabel}｜共 ${data.roster.length} 人`
  ctx.fillText(subtitle, PADDING, HEADER_TOP + 62)
}

// 頁碼放在投影片右下角，跟主標題那排的「共 N 人」分開——PPT 常見的頁碼
// 位置，人多分好幾張投影片時才看得出目前是第幾張、總共幾張。
function drawPageNumber(ctx: CanvasRenderingContext2D, page: number, pageCount: number) {
  if (pageCount <= 1) return
  ctx.textAlign = "right"
  ctx.textBaseline = "bottom"
  ctx.font = `24px -apple-system, "PingFang TC", sans-serif`
  ctx.fillStyle = "rgba(255,255,255,0.6)"
  ctx.fillText(`${page + 1} / ${pageCount}`, WIDTH - PADDING * 0.6, HEIGHT - PADDING * 0.5)
}

// 姓名跟教會現在畫在同一行、同一欄裡（不是姓名一行、教會另起一行），
// 一列的高度只要夠放一行字，人多的名單同一張投影片能放更多人。
const ROW_HEIGHT = 52
const COL_GAP = 48
const ROW_GAP_TOP = 56 // 面板頂端到第一列名字的距離，面板本身沒有標題，只留基本呼吸空間

function panelRect(headerHeight: number) {
  const y = headerHeight
  const height = HEIGHT - headerHeight - PADDING
  return { x: PADDING, y, width: WIDTH - PADDING * 2, height }
}

function rowsPerPage(panelHeight: number, columns: number): number {
  const usable = panelHeight - ROW_GAP_TOP - 40
  return Math.max(1, Math.floor(usable / ROW_HEIGHT)) * columns
}

export async function renderWorkshopRosterSlides(
  data: WorkshopRosterData,
  options: WorkshopRosterOptions = DEFAULT_ROSTER_OPTIONS
): Promise<HTMLCanvasElement[]> {
  const columns = Math.max(1, Math.min(6, Math.round(options.columns)))
  const [logo, background] = await Promise.all([loadImage(LOGO_SRC), loadImage(BACKGROUND_SRC)])
  await document.fonts.load(`700 44px ${genRyuMin.style.fontFamily}`).catch(() => {})

  const headerHeight = 210
  const panel = panelRect(headerHeight)
  const perPage = data.roster.length > 0 ? rowsPerPage(panel.height, columns) : 1
  const pageCount = Math.max(1, Math.ceil(data.roster.length / perPage))

  const canvases: HTMLCanvasElement[] = []

  for (let page = 0; page < pageCount; page++) {
    const canvas = document.createElement("canvas")
    canvas.width = WIDTH
    canvas.height = HEIGHT
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("無法取得 2d context")

    drawBlurredBackground(ctx, background)
    drawHeader(ctx, logo, data)
    drawPageNumber(ctx, page, pageCount)

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
    const colWidth = (panel.width - COL_GAP * (columns - 1)) / columns
    const rowsInCol = Math.ceil(pageEntries.length / columns) || 1

    ctx.textAlign = "left"
    ctx.textBaseline = "top"
    pageEntries.forEach((entry, i) => {
      const col = Math.floor(i / rowsInCol)
      const row = i % rowsInCol
      const x = panel.x + 48 + col * (colWidth + COL_GAP)
      const y = panel.y + ROW_GAP_TOP + row * ROW_HEIGHT

      const namePart = `${entry.name}　`
      ctx.font = `600 28px -apple-system, "PingFang TC", sans-serif`
      ctx.fillStyle = "#ffffff"
      ctx.fillText(namePart, x, y)

      const nameWidth = ctx.measureText(namePart).width
      ctx.font = `24px -apple-system, "PingFang TC", sans-serif`
      ctx.fillStyle = "rgba(255,255,255,0.65)"
      ctx.fillText(entry.church, x + nameWidth, y + 2)
    })

    canvases.push(canvas)
  }

  return canvases
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("轉換圖片失敗"))), "image/png")
  })
}

// 只有一張投影片：直接下載那一張 PNG。多張投影片：打包成一個 zip
// （「整個資料夾下載」在瀏覽器端能做到的等價形式），一次下載、裡面每張
// 投影片各是一個檔案，不用像之前那樣一張一張跳出多次下載。
export async function downloadWorkshopRosterImages(
  data: WorkshopRosterData,
  filenamePrefix: string,
  options: WorkshopRosterOptions = DEFAULT_ROSTER_OPTIONS
) {
  const canvases = await renderWorkshopRosterSlides(data, options)

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
