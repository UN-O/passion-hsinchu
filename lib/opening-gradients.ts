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
