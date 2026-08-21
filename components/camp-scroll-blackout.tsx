"use client"

import { createContext, useContext, useEffect, useRef, useState } from "react"

// 首頁背景在「每場聚會」那張卡片整個露出來（不被 sticky logo 列蓋到、也
// 沒有被畫面下緣切到）才整片變黑；往上滑只要卡片開始被切掉一點（不管是
// 被 sticky 列蓋住還是被畫面下緣切掉）就變回黃色。用 getBoundingClientRect
// 量卡片跟 sticky 列（見 passion-logo-header.tsx 的 data-scroll-blackout-header）
// 的實際位置，不是猜一個固定門檻。
const TriggerContext = createContext<(node: HTMLDivElement | null) => void>(() => {})

export function ScrollBlackout({ children }: { children: React.ReactNode }) {
  const [isBlack, setIsBlack] = useState(false)
  const triggerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function onScroll() {
      const el = triggerRef.current
      if (!el) return
      const headerEl = document.querySelector<HTMLElement>("[data-scroll-blackout-header]")
      const headerBottom = headerEl ? headerEl.getBoundingClientRect().bottom : 0
      const rect = el.getBoundingClientRect()
      setIsBlack(rect.top >= headerBottom && rect.bottom <= window.innerHeight)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [])

  return (
    <TriggerContext.Provider value={(node) => (triggerRef.current = node)}>
      {/* z-index 特意不用負值：main 自己有 relative z-0，會另外建立一個
          stacking context，Safari／WebKit 對「fixed + 負 z-index」在有
          相鄰 stacking context 的情況下有已知的算繪錯誤（整層直接消失、
          蓋不到內容），Chrome 系瀏覽器測不出來。這裡改成不設 z-index，
          單純靠這個 div 在 DOM 順序上排在 children 前面來確保疊在最底層。 */}
      <div
        className="pointer-events-none fixed inset-0 transition-colors duration-700"
        style={{ backgroundColor: isBlack ? "#000000" : "#feed74" }}
        aria-hidden
      />
      {children}
    </TriggerContext.Provider>
  )
}

// 包住想追蹤「有沒有整個露出來」的區塊（例如整張卡片），本身不影響版面
// （純粹是量尺寸用的容器，沒有自己的間距／樣式）。
export function ScrollBlackoutTrigger({ children }: { children: React.ReactNode }) {
  const setTriggerEl = useContext(TriggerContext)
  return <div ref={setTriggerEl}>{children}</div>
}
