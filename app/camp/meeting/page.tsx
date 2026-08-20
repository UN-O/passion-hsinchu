import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PassionLogoHeader } from "@/components/passion-logo-header"
import { DiscussionRoot } from "@/components/discussion/discussion-root"
import { campMeetingRootKey } from "@/lib/discussion/root-registry"
import { requireFlowAccess } from "@/lib/session"

export const metadata: Metadata = {
  title: "聚會內容",
  robots: { index: false, follow: false },
}

// 聚會場次、大綱、PPT 目前沒有 CMS 可以管理，先放佔位內容，
// 等聚會排程資料表定案再接上真正的內容。
const PLACEHOLDER_SESSION_TITLE = "場次名稱尚未公布"
const PLACEHOLDER_OUTLINE = "這裡先放佔位文字，等聚會大綱與 PPT 連結確定後補上。"

export default async function CampMeetingPage() {
  const session = await requireFlowAccess("camp")

  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 sm:px-6 sm:pb-24">
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
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">聚會場次、名稱</p>
          <p className="text-2xl font-bold">{PLACEHOLDER_SESSION_TITLE}</p>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">主要大綱、PPT</p>
          <p className="text-base">{PLACEHOLDER_OUTLINE}</p>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">討論與心得</p>
          <div className="mt-4">
            <DiscussionRoot rootKey={campMeetingRootKey()} session={session} />
          </div>
        </div>
      </div>
    </main>
  )
}
