import type { CanvasDraw } from "@/components/immersive/backgrounds/canvas-background"

export type ShaderPalette = [string, string, string]

export const openingGradients = {
  campWelcome: ["#f6ed8e", "#33270f", "#141008"] as ShaderPalette,
  campQuiz: ["#8ee6f6", "#132433", "#0a141d"] as ShaderPalette,
  campOnboarding: ["#c9d6c2", "#20261d", "#0e120d"] as ShaderPalette,
  conferenceWelcome: ["#f6ed8e", "#2b2410", "#12100a"] as ShaderPalette,
  conferenceHeartSelect: ["#9aa6c9", "#181c2b", "#0c0e16"] as ShaderPalette,
  conferenceOnboarding: ["#f0d9a6", "#241f14", "#100d09"] as ShaderPalette,
}

// 只套用在 conference heart-select 這一步的類別方塊／展開項目 chip，其餘介面維持素色
export const conferenceCategoryColors: Record<"A" | "B" | "C" | "D", string> = {
  A: "#ff6a3d",
  B: "#2f9bff",
  C: "#b855f0",
  D: "#2ecc71",
}

type CategoryKey = "A" | "B" | "C" | "D"

// verse-and-prayer 步驟：每個類別各自的深色調背景（跟 heart-select 的強調色同一個色相家族，
// 但壓暗以維持文字可讀性），忽略 time、每幀畫同一張靜態放射狀漸層，
// 讓 html-to-image 能穩定擷取（即時 WebGL shader 的 canvas 緩衝不保證能被讀取）
const versePrayerCategoryPalettes: Record<CategoryKey, [string, string]> = {
  A: ["#3a1a10", "#120906"],
  B: ["#0f2438", "#080d14"],
  C: ["#2a1338", "#0e0814"],
  D: ["#123322", "#08140b"],
}

export function versePrayerCategoryDraw(categoryKey?: CategoryKey): CanvasDraw {
  const [center, edge] = versePrayerCategoryPalettes[categoryKey ?? "B"]
  return (ctx, { width, height }) => {
    const gradient = ctx.createRadialGradient(
      width / 2,
      height * 0.35,
      0,
      width / 2,
      height * 0.35,
      Math.max(width, height) * 0.9
    )
    gradient.addColorStop(0, center)
    gradient.addColorStop(1, edge)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
  }
}

// export-card.tsx（「儲存圖片」擷取用的隱藏卡片）專用：跟上面 versePrayerCategoryDraw
// 同一組色票、同一個放射狀漸層算式，但輸出成 CSS radial-gradient 字串直接當
// background 用，不透過 <canvas> 畫。手機瀏覽器（尤其真機 iOS Safari）在
// canvas 長期用 opacity-0 藏在背景時會不定期把畫面內容釋放掉，toDataURL()
// 讀到空的，html-to-image 擷取到的背景就整片消失；CSS background 是宣告式的，
// 沒有「畫的時機」這回事，html-to-image 序列化 DOM 時直接讀 computed style，
// 不存在讀到空畫布的問題。540×675 是 export-card.tsx 卡片固定的實際尺寸
// （見該檔案關於寬度 540px 的說明），這裡的漸層半徑直接按這個尺寸算死，
// 卡片尺寸不會變動。
export function versePrayerCategoryBackgroundCss(categoryKey?: CategoryKey): string {
  const [center, edge] = versePrayerCategoryPalettes[categoryKey ?? "B"]
  const cardWidth = 540
  const cardHeight = 675
  const radius = Math.max(cardWidth, cardHeight) * 0.9
  return `radial-gradient(circle ${radius}px at 50% 35%, ${center} 0%, ${edge} 100%)`
}

// camp result（ProfileCard 那一頁）專用：深色但不是全黑，中心稍微亮一點，不搶 ProfileCard 的風采
export const staticDarkCanvasDraw: CanvasDraw = (ctx, { width, height }) => {
  const gradient = ctx.createRadialGradient(
    width / 2,
    height / 2,
    0,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.8
  )
  gradient.addColorStop(0, "#2a2620")
  gradient.addColorStop(1, "#0d0d0d")
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
}
