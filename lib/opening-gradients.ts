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

// aCount 0~4，由冷到暖漸進；待勇者人設定稿後再微調
export const campResultGradients: ShaderPalette[] = [
  ["#9ad6f6", "#132433", "#0a141d"],
  ["#a6e6c9", "#16261d", "#0a140e"],
  ["#d6d68e", "#26260f", "#141408"],
  ["#f6c98e", "#33200f", "#141008"],
  ["#f68e8e", "#331313", "#140a0a"],
]

export function getCampResultGradient(aCount: number): ShaderPalette {
  return campResultGradients[aCount] ?? campResultGradients[2]
}

// 只套用在 conference heart-select 這一步的類別方塊／展開項目 chip，其餘介面維持素色
export const conferenceCategoryColors: Record<"A" | "B" | "C" | "D", string> = {
  A: "#f2836b",
  B: "#7fb8e6",
  C: "#c9a6f2",
  D: "#8fd4a8",
}

// verse-and-prayer 步驟專用：忽略 time、每幀畫同一張靜態放射狀漸層，
// 讓 html-to-image 能穩定擷取（即時 WebGL shader 的 canvas 緩衝不保證能被讀取）
export const versePrayerCanvasDraw: CanvasDraw = (ctx, { width, height }) => {
  const gradient = ctx.createRadialGradient(
    width / 2,
    height / 2,
    0,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.75
  )
  gradient.addColorStop(0, "#c9c2d6")
  gradient.addColorStop(1, "#0c0a12")
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
}
