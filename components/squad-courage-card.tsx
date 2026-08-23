"use client"

import { useEffect, useState } from "react"
import { ArrowUp, RefreshCw } from "lucide-react"

import { mantouSans } from "@/app/fonts/mantou-sans"
import { dinEngschrift } from "@/app/fonts/din-engschrift"
import { AnimatedDigits } from "@/components/animated-digits"
import { Button } from "@/components/ui/button"

// 記錄「上次看到的勇氣值」，跟 zone-score-chart.tsx 的計分動畫同一套邏輯：
// 有加分（目前總分 > 上次看到的總分）才顯示綠色徽章，顯示過一次就把總分存回去，
// 下次開頁面沒有新增分數就不會再顯示——只在「這次開頁面比上次看到時多了分數」才出現。
const STORAGE_KEY = "squad-courage-total"

// 首頁本身沒有輪詢：total 是 server component render 當下查到的值，使用者
// 停留在頁面時不會自動變。這裡改成「上次更新是 X 前」+ 手動重新查詢按鈕，
// 讓使用者自己決定要不要打 /api/camp/squad-courage 拿最新值，不用整頁重整。
function formatElapsed(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return "剛剛"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} 分鐘前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小時前`
  return `${Math.floor(hours / 24)} 天前`
}

export function SquadCourageCard({ squadName, total: initialTotal }: { squadName: string; total: number }) {
  const [total, setTotal] = useState(initialTotal)
  const [gain, setGain] = useState(0)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  const [now, setNow] = useState<number | null>(null)
  const [refreshing, setRefreshing] = useState(false)

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

  // 「上次更新」記的是「上次成功查過一次」，不是「上次數字有變」——這裡故意
  // 跟上面那個 gain 徽章的 effect 分開：查了但分數沒變，也要算查過，不然
  // 使用者按了重新查詢卻看不到時間變化，會以為按鈕沒反應。掛載時當作
  // server render 當下就查過一次；之後每次 handleRefresh 成功各自更新。
  useEffect(() => {
    const seenAt = Date.now()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLastUpdated(seenAt)
    setNow(seenAt)
  }, [])

  // 只是讓「X 分鐘前」這行文字隨時間跳動，不是重新打 API——資料要不要更新
  // 完全交給使用者按重新查詢按鈕決定。
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  async function handleRefresh() {
    if (refreshing) return
    setRefreshing(true)
    try {
      const res = await fetch("/api/camp/squad-courage")
      if (res.ok) {
        const data = await res.json()
        if (typeof data.total === "number") setTotal(data.total)
        const seenAt = Date.now()
        setLastUpdated(seenAt)
        setNow(seenAt)
      }
    } catch {
      // 查詢失敗就維持畫面上原本的數字跟上次更新時間，按鈕還在，使用者可以再按一次。
    } finally {
      setRefreshing(false)
    }
  }

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

      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {lastUpdated !== null && now !== null ? `上次更新是 ${formatElapsed(now - lastUpdated)}` : " "}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={handleRefresh}
          disabled={refreshing}
          aria-label="重新查詢勇氣值"
        >
          <RefreshCw className="size-3.5" />
        </Button>
      </div>
    </>
  )
}
