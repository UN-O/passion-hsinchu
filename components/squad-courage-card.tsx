"use client"

import { useEffect, useState } from "react"
import { ArrowUp } from "lucide-react"

import { mantouSans } from "@/app/fonts/mantou-sans"
import { dinEngschrift } from "@/app/fonts/din-engschrift"
import { AnimatedDigits } from "@/components/animated-digits"

// 記錄「上次看到的勇氣值」，跟 zone-score-chart.tsx 的計分動畫同一套邏輯：
// 有加分（目前總分 > 上次看到的總分）才顯示綠色徽章，顯示過一次就把總分存回去，
// 下次開頁面沒有新增分數就不會再顯示——只在「這次開頁面比上次看到時多了分數」才出現。
const STORAGE_KEY = "squad-courage-total"

export function SquadCourageCard({ squadName, total }: { squadName: string; total: number }) {
  const [gain, setGain] = useState(0)

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    const lastSeen = stored ? Number(stored) : total
    const delta = total - lastSeen
    // localStorage 是瀏覽器才有的東西，SSR 一律先渲染成 0（沒有徽章），掛載後
    // 才讀得到真正的值——這裡的 setState 就是把「讀到的結果」同步進畫面，
    // 不是可以搬進 render 期間算的衍生值，跟一般「effect 裡不要 setState」的情境不同。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (delta > 0) setGain(delta)
    window.localStorage.setItem(STORAGE_KEY, String(total))
  }, [total])

  return (
    <>
      {gain > 0 && (
        <div className="flex justify-end">
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-bold text-emerald-400">
            <ArrowUp className="size-3.5" />
            {gain.toLocaleString("en-US")}
          </span>
        </div>
      )}
      {/* 「勇氣值」標籤改成貼在數字右下角、跟數字同一條基線，不是獨立
          一行的標題文字。數字有 skewX(-5deg)：transform 不影響版面計算
          （flex gap 還是照未傾斜的框算），但傾斜後字glyph 的視覺右緣會
          往右凸出一截，字級愈大凸出愈多，gap 太小的話「勇氣值」會被
          蓋到一部分——gap-2 sm:gap-3 比原本的 1.5 留多一點，跟著
          text-5xl/6xl 兩個字級分別給夠的緩衝。flex-wrap 是最後一道防線：
          萬一小隊名稱以後換成更長的字串，寧可整排跳成兩行，也不要硬擠
          到重疊或被裁掉。 */}
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <div className="flex items-end gap-2 sm:gap-3">
          {/* 用獨立的 storageKey（-digits 後綴）：AnimatedDigits 自己內部
              也會讀寫 localStorage 記上次的值來做滾動動畫，跟上面判斷要
              不要顯示綠色徽章用的 STORAGE_KEY 分開，兩邊互不干擾。 */}
          <AnimatedDigits
            value={total}
            storageKey={`${STORAGE_KEY}-digits`}
            className={`${dinEngschrift.className} text-5xl font-bold tracking-wider text-primary sm:text-6xl`}
            style={{ transform: "skewX(-5deg)" }}
          />
          <span className="pb-1 text-sm text-muted-foreground sm:pb-1.5">勇氣值</span>
        </div>
        <p
          className={`${mantouSans.className} shrink-0 text-2xl tracking-wide sm:text-3xl`}
          style={{ color: "#ffffff", WebkitTextStroke: "1px #000000" }}
        >
          {squadName}
        </p>
      </div>
    </>
  )
}
