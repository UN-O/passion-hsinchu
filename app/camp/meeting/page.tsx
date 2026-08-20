import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PassionLogoHeader } from "@/components/passion-logo-header"
import { DiscussionRoot } from "@/components/discussion/discussion-root"
import { campMeetingRootKey } from "@/lib/discussion/root-registry"
import { getNextCampSession } from "@/lib/opening-camp-content"
import { requireFlowAccess } from "@/lib/session"
import { genRyuMin } from "@/app/fonts/gen-ryu-min"

export const metadata: Metadata = {
  title: "聚會內容",
  robots: { index: false, follow: false },
}

// 大綱、PPT 目前沒有 CMS 可以管理，先放佔位內容，等資料確定再接上真正的內容。
// 聚會場次、名稱本身已經接上 lib/opening-camp-content.ts 的真實場次資料
// （跟首頁倒數卡片、CONF 的聚會內容頁同一套 getNextXSession 邏輯）。
const PLACEHOLDER_OUTLINE = "這裡先放佔位文字，等聚會大綱與 PPT 連結確定後補上。"

export default async function CampMeetingPage() {
  const session = await requireFlowAccess("camp")
  const nextSession = getNextCampSession()

  return (
    <main className="mx-auto max-w-2xl px-[6%] pb-16 sm:px-8 sm:pb-24">
      <PassionLogoHeader
        logoTone="dark"
        leftSlot={
          <Button asChild size="icon-sm" variant="outline" aria-label="返回" className="rounded-full">
            <Link href="/camp">
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
          <p className={`${genRyuMin.className} w-[min(74%,28rem)] text-2xl`}>{nextSession.label}</p>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-base">{PLACEHOLDER_OUTLINE}</p>
        </div>

        <div className="flex flex-col gap-1">
          <div>
            <DiscussionRoot rootKey={campMeetingRootKey()} session={session} />
          </div>
        </div>
      </div>
    </main>
  )
}
