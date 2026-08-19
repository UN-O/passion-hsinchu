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
    // @container：讓數字用 cqw（容器寬度百分比）等比例縮放，縮放基準是這張卡片
    // 本身的寬度，不是整個視窗寬度，這樣卡片多寬，數字就跟著等比例放多大。
    <div className="@container mt-3 w-full">
      <div className="flex items-center gap-[2cqw]">
        {segments.map((segment, index) => (
          <div key={segment.label} className="flex flex-1 items-center gap-[2cqw]">
            <div className="flex flex-1 flex-col items-center gap-[0.5cqw] rounded-xl bg-white/70 py-[3cqw]">
              <span className="text-[11cqw] leading-none font-bold tabular-nums text-black">
                {pad(segment.value)}
              </span>
              <span className="text-[2.5cqw] text-black/60">{segment.label}</span>
            </div>
            {index < segments.length - 1 && (
              <span className="text-[7cqw] font-bold text-black/30">:</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
