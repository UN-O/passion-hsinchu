"use client"

import { useEffect, useRef } from "react"

// 液態玻璃的位移貼圖：改寫自 MIT 授權的 https://github.com/childrentime/liquid-glass
// （作者致謝原始技巧來自 https://github.com/shuding/liquid-glass）。原版是跟著滑鼠
// 即時重算、可拖曳的浮動玻璃球；我們只需要卡片固定不動的靜態折射，所以拿掉拖曳／
// 滑鼠追蹤，只在掛載時算一次。原版逐像素跑在卡片實際渲染尺寸（例如 300×200 = 6 萬次
// 迴圈），這裡把位移貼圖畫布縮到固定的低解析度（96×64 = 6 千多次），SVG 濾鏡會自動
// 把貼圖拉伸貼合卡片實際大小——折射看的是形狀本身的漸層走向，不需要逐像素對齊，
// 解析度調低視覺上看不出差別，運算量壓到原本的幾十分之一，手機不會卡。
const MAP_WIDTH = 96
const MAP_HEIGHT = 64

function smoothStep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

// 圓角矩形的 signed distance field：圖形內部是負值、外部是正值，數值大小是離邊界的距離。
function roundedRectSDF(x: number, y: number, width: number, height: number, radius: number): number {
  const qx = Math.abs(x) - width + radius
  const qy = Math.abs(y) - height + radius
  return Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - radius
}

// 每個座標點要往哪裡「拉」：離邊界越近拉得越多，中心區塊幾乎不動，
// 做出鏡片邊緣把周圍畫面吸過來的折射感。
function displacementAt(px: number, py: number): { dx: number; dy: number } {
  const ix = px / MAP_WIDTH - 0.5
  const iy = py / MAP_HEIGHT - 0.5
  const distanceToEdge = roundedRectSDF(ix, iy, 0.3, 0.2, 0.6)
  const displacement = smoothStep(0.8, 0, distanceToEdge - 0.15)
  const scaled = smoothStep(0, 1, displacement)
  const tx = ix * scaled + 0.5
  const ty = iy * scaled + 0.5
  return { dx: tx * MAP_WIDTH - px, dy: ty * MAP_HEIGHT - py }
}

export function CampLiquidGlassFilter({ filterId }: { filterId: string }) {
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

    // 先算一輪找出最大位移量，才能把 dx／dy 標準化進 0-255 的色階（R／G 通道）。
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
