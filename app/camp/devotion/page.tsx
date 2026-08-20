import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PassionLogoHeader } from "@/components/passion-logo-header"
import { CampDevotionContent } from "@/components/camp-devotion-content"
import { requireFlowAccess } from "@/lib/session"

export const metadata: Metadata = {
  title: "靈修內容",
  robots: { index: false, follow: false },
}

export default async function CampDevotionPage() {
  const session = await requireFlowAccess("camp")
  // 工作人員不受 DAY2／DAY3 公布時間限制，隨時能看到完整靈修內容方便備稿確認。
  const isStaff = session.user.role !== "attendee"

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

      <div className="mt-10">
        <p className="text-sm text-muted-foreground">靈修內容</p>
        <div className="mt-4">
          <CampDevotionContent isStaff={isStaff} />
        </div>
      </div>
    </main>
  )
}
