"use client"

import { createContext, useContext, useEffect, useRef, useState } from "react"

// 首頁背景在「每場聚會」那張卡片整個露出來（不被 sticky logo 列蓋到、也
// 沒有被畫面下緣切到）才變黑，之後卡片以下的區域一路都維持黑色——包括
// 繼續往下滑、卡片頂端被 sticky 列蓋住捲出畫面之後也一樣，不會因為卡片
// 不再「整個」露出來就跳回黃色。只有往上滑、卡片的底部又被畫面下緣切到
// （代表已經滑回卡片還沒完全進來的那個位置）才變回黃色。用
// getBoundingClientRect 量卡片跟 sticky 列（見 passion-logo-header.tsx 的
// data-scroll-blackout-header）的實際位置，不是猜一個固定門檻。
const TriggerContext = createContext<(node: HTMLDivElement | null) => void>(() => {})

// 目前是不是黑底狀態，給 sticky logo 列、側邊欄按鈕這些「要跟著背景同步
// 反白」的元件讀。預設 false（沒有包在 ScrollBlackout 裡面時，例如其他
// 頁面共用同一顆 PassionLogoHeader／CampSidebar，維持原本樣子）。
const IsBlackContext = createContext(false)

export function useScrollBlackout() {
  return useContext(IsBlackContext)
}

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
      const fullyVisible = rect.top >= headerBottom && rect.bottom <= window.innerHeight
      if (fullyVisible) {
        setIsBlack(true)
      } else if (rect.bottom > window.innerHeight) {
        // 卡片底部還沒進到畫面下緣以內：還沒滑到（或往上滑退回了）卡片
        // 完全露出來之前的狀態。
        setIsBlack(false)
      } else {
        // 卡片底部已經在畫面內、只是頂端被 sticky 列蓋住了：代表已經滑
        // 過這張卡片，維持黑色。
        setIsBlack(true)
      }
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
      <IsBlackContext.Provider value={isBlack}>
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
        {/* data-blackout：黑底時把 --muted-foreground 這個 CSS 變數整個
            改成白色系，讓底下所有卡片本來就用 text-muted-foreground 的
            小字（副標題、標籤文字）自動一起反白，不用一個一個元件加
            條件判斷。覆寫規則見 globals.css 的 [data-blackout="true"]。
            黑底狀態下這一層以上的卡片（各區積分等）本來就已經捲出畫面，
            不會有「還在黃底、卻被反白」的問題。 */}
        <div data-blackout={isBlack || undefined} className="contents">
          {children}
        </div>
      </IsBlackContext.Provider>
    </TriggerContext.Provider>
  )
}

// 包住想追蹤「有沒有整個露出來」的區塊（例如整張卡片），本身不影響版面
// （純粹是量尺寸用的容器，沒有自己的間距／樣式）。
export function ScrollBlackoutTrigger({ children }: { children: React.ReactNode }) {
  const setTriggerEl = useContext(TriggerContext)
  return <div ref={setTriggerEl}>{children}</div>
}
