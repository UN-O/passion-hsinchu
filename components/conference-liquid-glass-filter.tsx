"use client"

import { useEffect, useRef } from "react"

// 液態玻璃的位移貼圖：改寫自 MIT 授權的 https://github.com/childrentime/liquid-glass
// （作者致謝原始技巧來自 https://github.com/shuding/liquid-glass），跟 CAMP 那邊的
// CampLiquidGlassFilter 同一套做法（同一個 signed distance field 演算法），差別
// 只在扭曲帶的參數：CAMP 模擬 Apple 原版 demo 置中的橢圓玻璃（0.3／0.2／0.6），
// CONF 這裡用「貼齊邊緣」的扭曲帶（0.42／0.42／0.18），因為 CONF 的玻璃面（工作坊
// 卡片、倒數數字框）本身就是整張卡片，不是卡片裡飄浮的一小塊玻璃。
//
// 只在掛載時算一次（不跟著滑鼠即時重算），位移貼圖畫布固定在低解析度
// （96×64），SVG 濾鏡會自動把貼圖拉伸貼合每個套用這個濾鏡的元素各自的實際
// 大小——不用替每張卡片、每個倒數框各自生成一份貼圖，一個共用的 <filter>
// 定義就能套到所有不同尺寸的玻璃面。
//
// 這個元件只掛一次（見 conference-mission-home.tsx），filterId 是文件內唯一的
// SVG id；CONF 頁面上所有玻璃面（含 ConferenceCountdown 的數字框）都透過
// .conf-glass-surface（見 globals.css）引用同一個 filterId。CampCountdownCard
// 重用 ConferenceCountdown 元件放在 CAMP 頁面時，因為 CAMP 頁面沒有掛這個
// filter，backdrop-filter 的漸進增強會自動退回純模糊，不會壞。
const MAP_WIDTH = 96
const MAP_HEIGHT = 64

function smoothStep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

function roundedRectSDF(x: number, y: number, width: number, height: number, radius: number): number {
  const qx = Math.abs(x) - width + radius
  const qy = Math.abs(y) - height + radius
  return Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - radius
}

function displacementAt(px: number, py: number): { dx: number; dy: number } {
  const ix = px / MAP_WIDTH - 0.5
  const iy = py / MAP_HEIGHT - 0.5
  const distanceToEdge = roundedRectSDF(ix, iy, 0.42, 0.42, 0.18)
  const displacement = smoothStep(0.8, 0, distanceToEdge - 0.15)
  const scaled = smoothStep(0, 1, displacement)
  const tx = ix * scaled + 0.5
  const ty = iy * scaled + 0.5
  return { dx: tx * MAP_WIDTH - px, dy: ty * MAP_HEIGHT - py }
}

export function ConferenceLiquidGlassFilter({ filterId }: { filterId: string }) {
  const feImageRef = useRef<SVGFEImageElement>(null)
  const feDisplacementMapRef = useRef<SVGFEDisplacementMapElement>(null)

  useEffect(() => {
    const feImage = feImageRef.current
    const feDisplacementMap = feDisplacementMapRef.current
    if (!feImage || !feDisplacementMap) return

    const canvas = document.createElement("canvas")
    canvas.width = MAP_WIDTH
    canvas.height = MAP_HEIGHT
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const raw: number[] = []
    let maxScale = 0
    for (let py = 0; py < MAP_HEIGHT; py++) {
      for (let px = 0; px < MAP_WIDTH; px++) {
        const { dx, dy } = displacementAt(px, py)
        maxScale = Math.max(maxScale, Math.abs(dx), Math.abs(dy))
        raw.push(dx, dy)
      }
    }
    maxScale *= 0.5

    const data = new Uint8ClampedArray(MAP_WIDTH * MAP_HEIGHT * 4)
    let i = 0
    for (let index = 0; index < raw.length; index += 2) {
      data[i++] = (raw[index] / maxScale + 0.5) * 255
      data[i++] = (raw[index + 1] / maxScale + 0.5) * 255
      data[i++] = 0
      data[i++] = 255
    }

    ctx.putImageData(new ImageData(data, MAP_WIDTH, MAP_HEIGHT), 0, 0)
    feImage.setAttributeNS("http://www.w3.org/1999/xlink", "href", canvas.toDataURL())
    feDisplacementMap.setAttribute("scale", String(maxScale))
  }, [])

  return (
    <svg aria-hidden width="0" height="0" className="absolute -left-full">
      <defs>
        <filter id={filterId} colorInterpolationFilters="sRGB">
          <feImage ref={feImageRef} result="displacementMap" width={MAP_WIDTH} height={MAP_HEIGHT} />
          <feDisplacementMap
            ref={feDisplacementMapRef}
            in="SourceGraphic"
            in2="displacementMap"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  )
}
