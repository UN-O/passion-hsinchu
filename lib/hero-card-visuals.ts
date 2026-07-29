// 勇者卡（CampProfileCard）用到的視覺素材產生器：全息 icon pattern、噪點 grain、
// 頭像 placeholder。抽出成純函式，讓正式卡片元件與 /playground/profile-card 除錯頁共用同一套邏輯，
// 每次調參數不用兩邊各改一次。

export type HeroIconTileConfig = {
    scale: number
    tileWidth: number
    tileHeight: number
    positions: { x: number; y: number }[]
}

export const DEFAULT_ICON_TILE: HeroIconTileConfig = {
    scale: 0.5,
    tileWidth: 112,
    tileHeight: 152,
    positions: [
        { x: 28, y: 24 },
        { x: 84, y: 24 },
        { x: 0, y: 58 },
        { x: 56, y: 58 },
        { x: 112, y: 58 },
        { x: 28, y: 92 },
        { x: 84, y: 92 },
        { x: 0, y: 126 },
        { x: 56, y: 126 },
        { x: 122, y: 126 },
    ],
}

// 每種勇者結果都用自己的紋章圖樣，對應 lib/opening-camp-content.ts 的 aCount 0~4。
export const HERO_ICON_GLYPHS: Record<number, string> = {
    // 4 衝鋒勇者：閃電
    4: "M13 2 4 14h6l-1 8 9-12h-6z",
    // 3 信念勇者：心
    3: "M12 21s-7.2-4.5-10-9.6C-.3 7 2.6 3 6.5 3c2.2 0 4 1.1 5.5 3 1.5-1.9 3.3-3 5.5-3 3.9 0 6.8 4 4.5 8.4C19.2 16.5 12 21 12 21z",
    // 2 智慧勇者：星芒
    2: "M12 2c0 5 2.5 7.5 7.5 7.5-5 0-7.5 2.5-7.5 7.5 0-5-2.5-7.5-7.5-7.5 5 0 7.5-2.5 7.5-7.5z",
    // 1 策略勇者：菱形
    1: "M12 1 22.5 12 12 23 1.5 12z",
    // 0 守護勇者：盾牌
    0: "M12 2 20 5.5v6c0 6.2-4 9.8-8 11.5-4-1.7-8-5.3-8-11.5v-6z",
}

export const HERO_ICON_LABELS: Record<number, string> = {
    4: "衝鋒勇者・閃電",
    3: "信念勇者・心",
    2: "智慧勇者・星芒",
    1: "策略勇者・菱形",
    0: "守護勇者・盾牌",
}

// encodeURIComponent 不會跳脫括號，但這些 data URI 會被包在 CSS 的 url(...) 裡；
// 若 SVG 內容含未跳脫的 ( )（例如 filter="url(#n)"），CSS 會判定成 bad-url-token 並整條
// custom property 失效，因此這裡額外跳脫括號。
export function svgDataUri(svg: string) {
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg).replace(/\(/g, "%28").replace(/\)/g, "%29")}`
}

export function heroAvatarDataUri(heroName: string) {
    const char = heroName.trim().charAt(0) || "勇"
    return svgDataUri(
        `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="#f6ed8e"/><text x="48" y="49" text-anchor="middle" dominant-baseline="central" font-family="sans-serif" font-size="44" font-weight="700" fill="#141008">${char}</text></svg>`
    )
}

// 卡片全息光澤所需的遮罩圖樣，vendor 元件預設沒有這個 asset 就不會顯示 icon pattern。
// tile 內用固定大小、固定角度的紋章排成交錯（磚牆式）網格，不是左右對稱的對齊網格。
// tile 邊緣故意讓紋章被裁半，靠 mask-repeat 平鋪時左右自然接起來。
export function heroIconPatternUri(aCount: number, config: HeroIconTileConfig = DEFAULT_ICON_TILE) {
    const path = HERO_ICON_GLYPHS[aCount] ?? HERO_ICON_GLYPHS[2]
    const shapes = config.positions
        .map(
            ({ x, y }) =>
                `<g transform="translate(${x} ${y}) scale(${config.scale})"><path d="${path}" transform="translate(20, 0)"/></g>`
        )
        .join("")
    return svgDataUri(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${config.tileWidth}" height="${config.tileHeight}"><g fill="#fff">${shapes}</g></svg>`
    )
}

export type GrainConfig = {
    baseFrequency: number
    numOctaves: number
    alphaSlope: number
    opacity: number
}

export const DEFAULT_GRAIN: GrainConfig = {
    baseFrequency: 0.84,
    numOctaves: 1,
    alphaSlope: 0.5,
    opacity: 1,
}

export function heroGrainUri(config: GrainConfig = DEFAULT_GRAIN) {
    return svgDataUri(
        `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="${config.baseFrequency}" numOctaves="${config.numOctaves}" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope="${config.alphaSlope}"/></feComponentTransfer></filter><rect width="100%" height="100%" filter="url(#n)" opacity="${config.opacity}"/></svg>`
    )
}

// 大頭照 placeholder：public/images/placeholder.png
export const HERO_AVATAR_PLACEHOLDER_URI = "/images/placeholder.png"

// #rrggbb + 0~1 透明度 -> "rgba(r, g, b, a)"，playground 的 color input 只能給 hex，
// 但 innerGradient / behindGlowColor 都需要可調透明度的顏色字串。
export function campHexToRgba(hex: string, alpha: number) {
    const normalized = hex.replace("#", "")
    const r = parseInt(normalized.slice(0, 2), 16)
    const g = parseInt(normalized.slice(2, 4), 16)
    const b = parseInt(normalized.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
