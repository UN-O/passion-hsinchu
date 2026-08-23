import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PassionLogoHeader } from "@/components/passion-logo-header"
import { CampDevotionContent } from "@/components/camp-devotion-content"
import { CampDevotionDaySelect } from "@/components/camp-devotion-day-select"
import { DEVOTION_ENTRIES, buildDevotionContent } from "@/lib/devotion-content"
import { fetchPassage, parseReferenceString } from "@/lib/bible"

// 只預覽 Day 2 那份內容－設計預覽不用登入、不接討論串，跟真正的
// /camp/devotion/[day] 頁面不同。套 camp-theme（真正的 /camp/* 頁面都有
// 這層黃色主題，playground 沒有共用 layout，這裡自己包一層預覽才準）。
//
// 靈修內容現在是真正的 root post（見 components/camp-devotion-content.tsx），
// 但這頁刻意不去查資料庫、不建立真的 root——只是打經文 API（外部服務，
// 不是 DB）湊出跟真正頁面一樣的資料形狀，rootPostId 是假的，admin 編輯
// 存檔會失敗（這裡本來就只是預覽畫面，不是真的可以操作的頁面）。
export default async function CampDevotionPlaygroundPage() {
  const entry = DEVOTION_ENTRIES[0]
  const reference = parseReferenceString(entry.reference)
  const bibleReading = reference ? await fetchPassage(entry.version, reference) : null

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
            activeId={entry.id}
          />
        </div>
        <div className="mt-4">
          <CampDevotionContent
            entry={entry}
            isStaff
            rootPostId="playground-fake-root"
            content={buildDevotionContent(entry)}
            images={[]}
            linkPreview={null}
            bibleReading={bibleReading}
            isDiscussionAdmin
          />
        </div>
      </main>
    </div>
  )
}
