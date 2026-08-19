"use client"

import { useEffect, useState } from "react"

function getRemaining(targetISO: string) {
  const diffMs = new Date(targetISO).getTime() - Date.now()
  const totalSeconds = Math.floor(Math.max(diffMs, 0) / 1000)

  return {
    // 不顯示「天」這個單位，超過 24 小時就讓小時數往上累加（例如 220 小時）。
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    done: diffMs <= 0,
  }
}

function pad(value: number) {
  return value.toString().padStart(2, "0")
}

// 目前只有整場特會的起訖時間，還沒有逐場聚會的排程資料，先倒數到特會開始。
// 等聚會排程資料表定案後，改成倒數到「下一場還沒開始的聚會」。
export function ConferenceCountdown({ targetISO }: { targetISO: string }) {
  // 初始值故意留 null（不要在第一次 render 就用 Date.now() 算）：伺服器算出來的
  // 秒數跟瀏覽器 hydrate 那一刻的秒數幾乎一定不同，會被 React 判定成 hydration
  // mismatch。改成掛載後才在 client 算第一次，SSR 那次只吐一個固定的空殼。
  const [remaining, setRemaining] = useState<ReturnType<typeof getRemaining> | null>(null)

  useEffect(() => {
    const tick = () => setRemaining(getRemaining(targetISO))
    // 用 setTimeout(tick, 0) 讓第一次更新延到下一個事件循環，避免在 effect
    // 主體內直接同步呼叫 setState（react-hooks/set-state-in-effect）。
    const timeoutId = setTimeout(tick, 0)
    const intervalId = setInterval(tick, 1000)
    return () => {
      clearTimeout(timeoutId)
      clearInterval(intervalId)
    }
  }, [targetISO])

  if (!remaining) {
    return <div className="mt-3 h-[52px] sm:h-[60px]" aria-hidden />
  }

  if (remaining.done) {
    return <p className="mt-3 text-xl font-bold text-black">聚會進行中</p>
  }

  const segments = [
    { label: "時", value: remaining.hours },
    { label: "分", value: remaining.minutes },
    { label: "秒", value: remaining.seconds },
  ]

  return (
    <div className="mt-3 flex items-center gap-1.5 sm:gap-2">
      {segments.map((segment, index) => (
        <div key={segment.label} className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex flex-col items-center gap-0.5 rounded-xl bg-white/70 px-2.5 py-1.5 sm:px-3 sm:py-2">
            <span className="text-lg font-bold tabular-nums text-black sm:text-2xl">{pad(segment.value)}</span>
            <span className="text-[10px] text-black/60">{segment.label}</span>
          </div>
          {index < segments.length - 1 && <span className="text-lg font-bold text-black/30">:</span>}
        </div>
      ))}
    </div>
  )
}
