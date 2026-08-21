"use client"

import { useLayoutEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

// 液態玻璃翻頁按鈕：DAY2／DAY3 之間切換用。用 usePathname 自己判斷目前
// 在哪一天，不吃外部傳進來的 activeId（除了 playground 預覽可以覆寫）——
// 這樣這個元件才能安全掛在 app/camp/devotion/layout.tsx（動態區段 [day]
// 的「外面」），保證 day2⇄day3 換頁時它本身不會被卸載重掛，滑動玻璃底
// 的 CSS transition 才吃得到「從哪裡滑到哪裡」，真的會動。如果掛在
// [day] 自己的 layout 裡，那層本身架在會變動的動態區段上，Next.js
// 換頁時還是可能把它整層重新渲染掉，滑動效果就跳掉了——這是實測過的
// 真的問題，不是理論假設。
export function CampDevotionDaySelect({
  items,
  activeId: activeIdOverride,
}: {
  items: { id: string; label: string }[]
  // 只給 playground 預覽用：不在真正的 /camp/devotion/[day] 路徑下，
  // usePathname 抓不到正確的 day，用這個直接指定要預覽哪一天。
  activeId?: string
}) {
  const pathname = usePathname()
  const activeId = activeIdOverride ?? pathname.split("/").pop() ?? ""
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
