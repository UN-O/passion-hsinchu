import Image from "next/image"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PassionLogoHeader } from "@/components/passion-logo-header"
import { MeetingNotes } from "@/components/meeting-notes"
import { getNextCampSession } from "@/lib/opening-camp-content"
import { genRyuMin } from "@/app/fonts/gen-ryu-min"

// 真正的 /camp/* 頁面都套了 app/camp/layout.tsx 的 .camp-theme（淺黃色底），
// playground 沒有共用的 layout，這裡自己包一層維持視覺一致，預覽才準。
export default function CampMeetingPlaygroundPage() {
  const nextSession = getNextCampSession()

  return (
    <div className="camp-theme min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-2xl px-[6%] pb-16 sm:px-8 sm:pb-24">
        <PassionLogoHeader
          logoTone="dark"
          leftSlot={
            <Button asChild size="icon-sm" variant="outline" aria-label="返回" className="rounded-full">
              <Link href="/playground/camp-mission-home">
                <ArrowLeft />
              </Link>
            </Button>
          }
        />

        <div className="mt-10 flex flex-col gap-10">
          {/* 聚會視覺圖用有字版 nextSession.infoImage（跟首頁卡片／倒數計時縮圖
              用的無字版 image 是不同兩張圖），16:9 滿版圓角（跟 CONF 的聚會內容頁
              同一個排版）。 */}
          <div className="relative aspect-video w-full overflow-hidden rounded-3xl">
            <Image
              src={nextSession.infoImage}
              alt={`${nextSession.label}視覺`}
              fill
              sizes="(min-width: 640px) 672px, 100vw"
              className="object-cover"
              style={{ objectPosition: "50% 30%" }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">聚會場次、名稱</p>
            <p className={`${genRyuMin.className} text-2xl`}>{nextSession.label}</p>
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">主要大綱、PPT</p>
            <p className="text-base">這裡先放佔位文字，等聚會大綱與 PPT 連結確定後補上。</p>
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">心得筆記欄</p>
            <div className="mt-2">
              <MeetingNotes />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
