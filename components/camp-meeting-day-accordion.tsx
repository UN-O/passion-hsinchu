"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

import { genRyuMin } from "@/app/fonts/gen-ryu-min"

export type CampMeetingDaySection = {
  id: string
  label: string
  defaultOpen: boolean
  children: React.ReactNode
}

// 手風琴：DAY1／DAY2／DAY3 各自獨立展開收合，可以同時展開好幾天，不是
// 分頁式互斥切換。defaultOpen 由外層 camp-meeting-sessions.tsx 算好（哪一
// 天有正在進行／即將開始的場次）傳進來，只在第一次 render 當初始值，不會
// 因為 props 之後變動又跳回去蓋掉使用者自己展開/收合的操作。
export function CampMeetingDayAccordion({ days }: { days: CampMeetingDaySection[] }) {
  const [openIds, setOpenIds] = useState<Set<string>>(
    () => new Set(days.filter((day) => day.defaultOpen).map((day) => day.id))
  )

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {days.map((day) => {
        const isOpen = openIds.has(day.id)
        return (
          <div key={day.id} className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => toggle(day.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-2 text-left"
            >
              {/* text-muted-foreground 不是 text-foreground：這個標題疊在會變
                  黃底／黑底切換的首頁背景上（見 camp-scroll-blackout.tsx），
                  --foreground 在 camp-theme 是給黃底配的深色，黑底時沒有跟著
                  被覆寫會整個看不見；--muted-foreground 才是黑底時會自動反白
                  的那個變數（見 globals.css 的 [data-blackout="true"]），跟
                  上面「活動筆記」小標題同一個做法。 */}
              <span className={`${genRyuMin.className} text-xl text-muted-foreground`}>{day.label}</span>
              {isOpen ? (
                <ChevronUp className="size-5 text-muted-foreground" aria-hidden />
              ) : (
                <ChevronDown className="size-5 text-muted-foreground" aria-hidden />
              )}
            </button>
            {isOpen && <div className="flex flex-col gap-4">{day.children}</div>}
          </div>
        )
      })}
    </div>
  )
}
