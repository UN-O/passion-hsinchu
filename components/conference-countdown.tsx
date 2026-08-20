"use client"

import { Fragment, useEffect, useState } from "react"

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
    return <div className="h-[52px] w-full sm:h-[60px]" aria-hidden />
  }

  if (remaining.done) {
    return (
      <p className="rounded-xl bg-white/30 px-4 py-3 text-xl font-bold text-black backdrop-blur-md">
        聚會進行中
      </p>
    )
  }

  const segments = [
    { label: "時", value: remaining.hours },
    { label: "分", value: remaining.minutes },
    { label: "秒", value: remaining.seconds },
  ]

  return (
    // @container：讓數字用 cqw（容器寬度百分比）等比例縮放，縮放基準是這張卡片
    // 本身的寬度，不是整個視窗寬度，這樣卡片多寬，數字就跟著等比例放多大。
    // cqw 尺寸都寫在 globals.css 的 .conf-countdown-* class 裡，帶了舊瀏覽器
    // 看不懂 container query 時的固定尺寸備援（避免退回瀏覽器預設字級跑版）。
    <div className="@container w-full">
      {/* 三個數字框直接各自 flex-1 佔同一列的等分寬度，冒號是獨立的兄弟元素、
          不佔彈性空間，這樣不管有沒有冒號夾在旁邊，三個框框的寬度都會一致
          （之前冒號跟框框綁在同一個 flex-1 容器裡，最後一組沒有冒號分走空間，
          框框會比前兩組寬）。數字框疊在聚會照片上面，底改成真正的液態玻璃
          折射（.conf-glass-surface，濾鏡定義掛在 ConferenceMissionHome，見
          conference-mission-home.tsx），照片會透過玻璃真的扭曲，不只是模糊。
          這個元件也被 CAMP 的 CampCountdownCard 重用，那邊頁面沒有掛 CONF
          的濾鏡，會自動退回 .conf-glass-surface 裡的純模糊備援，不會壞。 */}
      <div className="conf-countdown-row flex items-stretch">
        {segments.map((segment, index) => (
          <Fragment key={segment.label}>
            <div className="conf-countdown-box relative flex flex-1 flex-col items-center overflow-hidden rounded-xl">
              <div className="conf-glass-surface absolute inset-0 bg-white/10" />
              <span className="conf-countdown-digit relative leading-none font-bold tabular-nums text-black">
                {pad(segment.value)}
              </span>
              <span className="conf-countdown-label relative text-black/60">{segment.label}</span>
            </div>
            {index < segments.length - 1 && (
              <span className="conf-countdown-colon flex items-center font-bold text-black/30">:</span>
            )}
          </Fragment>
        ))}
      </div>
    </div>
  )
}
