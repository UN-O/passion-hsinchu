"use client"

import { useEffect, useState } from "react"
import { ArrowUp } from "lucide-react"

import { mantouSans } from "@/app/fonts/mantou-sans"
import { dinEngschrift } from "@/app/fonts/din-engschrift"

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
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-muted-foreground">勇氣值</p>
        {gain > 0 && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-bold text-emerald-400">
            <ArrowUp className="size-3.5" />
            {gain.toLocaleString("en-US")}
          </span>
        )}
      </div>
      <div className="mt-1 flex items-end justify-between gap-4">
        <p
          className={`${dinEngschrift.className} text-5xl font-bold text-primary sm:text-6xl`}
          style={{ transform: "skewX(-5deg)" }}
        >
          {total.toLocaleString("en-US")}
        </p>
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
