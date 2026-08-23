import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PassionLogoHeader } from "@/components/passion-logo-header"
import { CampDevotionContent } from "@/components/camp-devotion-content"
import { CampDevotionDaySelect } from "@/components/camp-devotion-day-select"
import { DEVOTION_ENTRIES } from "@/lib/devotion-content"

// 只預覽 Day 2 那份內容－設計預覽不用登入、不接討論串，跟真正的
// /camp/devotion/[day] 頁面不同。套 camp-theme（真正的 /camp/* 頁面都有
// 這層黃色主題，playground 沒有共用 layout，這裡自己包一層預覽才準）。
//
// 自建版聖經模組（和合本／現代中文譯本／NIV，三種模式）改在
// /playground/bible-module 單獨比較——這頁還是原本 YouVersion 版的
// CampDevotionContent，兩邊還沒合併，等授權確認後再決定要不要換。
export default function CampDevotionPlaygroundPage() {
  return (
    <div className="camp-theme min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-2xl px-[6%] pb-16 sm:px-8 sm:pb-24">
        <PassionLogoHeader logoTone="dark" />
        <Button asChild size="icon" variant="outline" aria-label="返回" className="mt-10 rounded-full">
          <Link href="/playground/camp-mission-home">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="mt-10 flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">靈修內容</p>
          <CampDevotionDaySelect
            items={DEVOTION_ENTRIES.map((e) => ({ id: e.id, label: e.id.toUpperCase() }))}
            activeId={DEVOTION_ENTRIES[0].id}
          />
        </div>
        <div className="mt-4">
          <CampDevotionContent entry={DEVOTION_ENTRIES[0]} isStaff />
        </div>
      </main>
    </div>
  )
}
