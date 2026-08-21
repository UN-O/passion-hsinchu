"use client"

import { useLayoutEffect, useRef, useState } from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"

// 液態玻璃翻頁按鈕：DAY2／DAY3 之間切換用，跟舊版（同一頁用 client state
// 切換 tab）視覺一樣，但現在每天是獨立路由（/camp/devotion/[day]），所以
// 用 Link 導頁取代 onClick 狀態切換。滑動玻璃底是量按鈕在容器內的
// offsetLeft／offsetWidth，掛載時跟 activeId 變動時都要重算一次
// （activeId 變動只會發生在跨頁重新掛載那一刻，不會有同頁動畫過場，
// 但初次進站時仍會對齊到正確位置）。
export function CampDevotionDaySelect({
  items,
  activeId,
}: {
  items: { id: string; label: string }[]
  activeId: string
}) {
  const buttonRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null)
  const activeIndex = items.findIndex((item) => item.id === activeId)

  useLayoutEffect(() => {
    const button = buttonRefs.current[activeIndex]
    if (button) setIndicator({ left: button.offsetLeft, width: button.offsetWidth })
  }, [activeIndex])

  if (items.length <= 1) return null

  return (
    <div className="relative inline-flex w-fit gap-2">
      {indicator && (
        <div
          aria-hidden
          className="absolute inset-y-0 rounded-full border border-white/50 bg-white/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),0_1px_4px_rgba(0,0,0,0.12)] backdrop-blur-md transition-[left,width] duration-300 ease-out"
          style={{ left: indicator.left, width: indicator.width }}
        />
      )}
      {items.map((item, index) => (
        <Link
          key={item.id}
          ref={(el) => {
            buttonRefs.current[index] = el
          }}
          href={`/camp/devotion/${item.id}`}
          aria-pressed={item.id === activeId}
          className={cn(
            "relative z-10 rounded-full border px-4 py-1.5 text-sm transition-colors",
            item.id === activeId
              ? "border-transparent font-semibold text-foreground"
              : "border-border text-foreground hover:border-foreground/40"
          )}
        >
          {item.label}
        </Link>
      ))}
    </div>
  )
}
