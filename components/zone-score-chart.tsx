"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

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

  return (
    <div className="flex h-full w-16 flex-col items-center justify-end gap-1.5">
      {displayValue > 0 && (
        <span className="text-sm font-bold tabular-nums">{displayValue.toLocaleString("en-US")}</span>
      )}
      <div
        className="w-6 rounded-t-[4px] sm:w-7"
        style={{
          height: `${Math.max((displayValue / max) * 100, displayValue > 0 ? 1 : 0)}%`,
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

  const max = niceMax(rawMax)

  return (
    <div className="pt-2">
      <div className="flex h-48 items-end justify-center gap-x-8 border-b border-foreground/10 sm:h-56 sm:gap-x-12">
        {zones.map((zone) => (
          <ZoneBar key={zone.key} zone={zone} max={max} />
        ))}
      </div>

      <div className="mt-3 flex justify-center gap-x-8 sm:gap-x-12">
        {zones.map((zone) => (
          <div key={zone.key} className="flex w-16 flex-col items-center gap-1.5">
            <Image src={zone.icon} alt="" width={48} height={48} className="size-6 rounded-full" />
            <span className="text-xs whitespace-nowrap text-muted-foreground">{zone.title}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
