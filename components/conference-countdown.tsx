"use client"

import { Fragment, useEffect, useState } from "react"
import { dinEngschrift } from "@/app/fonts/din-engschrift"

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
      <p className="rounded-xl border border-white/50 bg-white/30 px-4 py-3 text-xl font-bold text-black shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),0_1px_4px_rgba(0,0,0,0.12)] backdrop-blur-md">
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
      {/* 底下的玻璃底改成一整條，不再是三個各自獨立的框框：一個 absolute
          inset-0 蓋滿整列，三組數字／兩個冒號都是同一個矩形上面的內容，
          不是各自貼一塊玻璃再拼起來。玻璃樣式跟 CAMP 靈修內容 DAY1／DAY2
          切換按鈕同一種（border-white/50 + bg-white/30 + 內緣高光陰影 +
          backdrop-blur-md），不是 CONF 工作坊卡片那種 SVG 折射液態玻璃。
          數字用 tracking 讓同一組裡的兩個數字（例如「00」）貼緊一點，
          照使用者提供的數位鐘參考圖那種字距。 */}
      <div className="conf-countdown-row relative flex items-stretch overflow-hidden rounded-xl">
        <div className="absolute inset-0 rounded-xl border border-white/50 bg-white/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),0_1px_4px_rgba(0,0,0,0.12)] backdrop-blur-md" />
        {segments.map((segment, index) => (
          <Fragment key={segment.label}>
            {/* label 改成 absolute 疊在數字右下角，不再是 flex-col 疊在數字
                下面：拿掉 label 這個 flow 元素之後，數字在 flex-col 裡就是
                唯一的排版對象，位置不會因為 label 移走而跟著往下（或往上）
                挪動，維持原本的位置。label 定位在 segment 的右下角，跟數字
                共用同一塊玻璃底（segment 本身撐滿整條的高度），不是另外
                疊一塊底色。 */}
            <div className="conf-countdown-segment relative flex flex-1 flex-col items-center">
              <span
                className={`${dinEngschrift.className} conf-countdown-digit leading-none font-bold tabular-nums text-black`}
              >
                {pad(segment.value)}
              </span>
              <span className="conf-countdown-label absolute right-[8cqw] bottom-0 text-black/60">{segment.label}</span>
            </div>
            {index < segments.length - 1 && (
              <span
                className={`${dinEngschrift.className} conf-countdown-colon relative flex items-center font-bold text-black/30`}
              >
                :
              </span>
            )}
          </Fragment>
        ))}
      </div>
    </div>
  )
}
