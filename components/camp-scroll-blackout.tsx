"use client"

import { createContext, useContext, useEffect, useRef, useState } from "react"

// 首頁背景滑到某個位置就整個變黑、往回滑過那個位置又變回黃色——不是照
// 卡片在文件裡的高度百分比畫一條固定漸層帶（那種做法卡片高度一變位置
// 就跟著跑，而且只能單向漸變，滑回去不會變回黃色）。這裡改成量實際
// scroll 位置：有沒有滑過 <ScrollBlackoutTrigger /> 那個節點，整個
// viewport 的背景用 transition-colors 在黃／黑兩色之間切換。
const TriggerContext = createContext<(node: HTMLDivElement | null) => void>(() => {})

export function ScrollBlackout({ children }: { children: React.ReactNode }) {
  const [isBlack, setIsBlack] = useState(false)
  const triggerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function onScroll() {
      const el = triggerRef.current
      if (!el) return
      const triggerTop = el.getBoundingClientRect().top + window.scrollY
      setIsBlack(window.scrollY >= triggerTop)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <TriggerContext.Provider value={(node) => (triggerRef.current = node)}>
      <div
        className="pointer-events-none fixed inset-0 -z-10 transition-colors duration-700"
        style={{ backgroundColor: isBlack ? "#000000" : "#feed74" }}
        aria-hidden
      />
      {children}
    </TriggerContext.Provider>
  )
}

// 放在想讓背景開始變黑的位置正上方，本身不佔版面（h-0）。
export function ScrollBlackoutTrigger() {
  const setTriggerEl = useContext(TriggerContext)
  return <div ref={setTriggerEl} aria-hidden className="h-0" />
}
