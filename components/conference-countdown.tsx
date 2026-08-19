"use client"

import { useEffect, useState } from "react"

function getRemaining(targetISO: string) {
  const diffMs = new Date(targetISO).getTime() - Date.now()
  const totalSeconds = Math.floor(Math.max(diffMs, 0) / 1000)

  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
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
  const [remaining, setRemaining] = useState(() => getRemaining(targetISO))

  useEffect(() => {
    const id = setInterval(() => setRemaining(getRemaining(targetISO)), 1000)
    return () => clearInterval(id)
  }, [targetISO])

  if (remaining.done) {
    return <p className="mt-3 text-xl font-bold text-black">聚會進行中</p>
  }

  const segments = [
    { label: "天", value: remaining.days },
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
