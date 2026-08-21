"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

import { dinEngschrift } from "@/app/fonts/din-engschrift"

export type ZoneScore = {
  key: string
  title: string
  icon: string
  total: number
  color: string
}

// 抓一個「好看的整數」當長條圖的量尺上限（1, 2, 5 × 10 的次方），
// 讓最高的長條不會頂到圖表上緣。
const NICE_STEPS = [1, 2, 5, 10]
const ANIMATION_MS = 900
const STORAGE_PREFIX = "zone-score:"

function niceMax(value: number): number {
  if (value <= 0) return 10
  const magnitude = 10 ** Math.floor(Math.log10(value))
  for (const step of NICE_STEPS) {
    const candidate = step * magnitude
    if (candidate >= value) return candidate
  }
  return 10 * magnitude
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3
}

// 每次進到儀表板都從「上次看到的分數」往上衝到目前分數，而不是直接跳出結果，
// 讓加分有感。上次的分數存在 localStorage（沒有就當作 0，也就是第一次一定從 0 開始）。
function useCountUp(target: number, storageKey: string): number {
  const [value, setValue] = useState(0)

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey)
    const start = stored ? Number(stored) : 0
    const startTime = performance.now()
    let frame: number

    function tick(now: number) {
      const progress = Math.min((now - startTime) / ANIMATION_MS, 1)
      const eased = easeOutCubic(progress)
      setValue(Math.round(start + (target - start) * eased))
      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      } else {
        window.localStorage.setItem(storageKey, String(target))
      }
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, storageKey])

  return value
}

function ZoneBar({ zone, max }: { zone: ZoneScore; max: number }) {
  const displayValue = useCountUp(zone.total, `${STORAGE_PREFIX}${zone.key}`)
  // 長條最高只長到 84%，幫上面的數字標籤固定留頭部空間——分數再高
  // （占滿量尺）長條也不會頂到數字，數字不會被裁切掉。數字字級加大
  // 後（clamp 最大到 1.75rem）比原本的 text-sm/base 占的高度更多，
  // 90% 留的空間不夠，往下調成 84% 多留一點。
  const heightPct = Math.min((displayValue / max) * 84, 84)

  return (
    <div className="flex h-full flex-col items-center justify-end gap-1.5">
      {displayValue > 0 && (
        <span
          className={`${dinEngschrift.className} text-[clamp(1.125rem,4.5vw,1.75rem)] leading-none font-bold tracking-wide tabular-nums`}
          style={{ transform: "skewX(-5deg)" }}
        >
          {displayValue.toLocaleString("en-US")}
        </span>
      )}
      <div
        className="w-full max-w-16 rounded-t-[4px] sm:max-w-20"
        style={{
          height: `${Math.max(heightPct, displayValue > 0 ? 1 : 0)}%`,
          backgroundColor: zone.color,
        }}
      />
    </div>
  )
}

export function ZoneScoreChart({ zones }: { zones: ZoneScore[] }) {
  const rawMax = Math.max(...zones.map((zone) => zone.total), 0)

  if (rawMax === 0) {
    return <p className="text-base text-muted-foreground">還沒有開始計分。</p>
  }

  // 量尺上限以「三區平均」抓一個好看的整數，而不是直接看最高分那區——
  // 三區分數如果都差不多高（例如都在 1000 上下），量尺就會跟著拉低，
  // 長條看起來才會飽滿，不會因為湊到下一個整數量級（1000 → 2000）
  // 就整批看起來只有一半高。用 Math.max 保底，確保最高分那區不會超出圖表頂端。
  const average = zones.reduce((sum, zone) => sum + zone.total, 0) / zones.length
  const max = Math.max(niceMax(average), rawMax)

  return (
    <div className="pt-2">
      {/* grid-cols-3：每個長條各佔容器寬度的三分之一，跟著卡片寬度等比例
          縮放（不是固定的 w-10/12 px 值），寬螢幕時長條、圖示都會跟著變
          大。高度用 clamp() 讓圖表本身也跟著螢幕寬度平滑縮放，不是卡在
          兩個斷點之間硬跳。 */}
      <div className="grid h-[clamp(12rem,45vw,16rem)] grid-cols-3 items-end gap-4 border-b border-foreground/10">
        {zones.map((zone) => (
          <ZoneBar key={zone.key} zone={zone} max={max} />
        ))}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-4">
        {zones.map((zone) => (
          <div key={zone.key} className="flex flex-col items-center gap-1.5">
            <Image
              src={zone.icon}
              alt=""
              width={80}
              height={80}
              className="aspect-square w-full max-w-16 rounded-full object-cover sm:max-w-20"
            />
            <span className="text-xs whitespace-nowrap text-muted-foreground sm:text-sm">{zone.title}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
