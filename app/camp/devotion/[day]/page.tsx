import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PassionLogoHeader } from "@/components/passion-logo-header"
import { CampDevotionContent } from "@/components/camp-devotion-content"
import { DiscussionRoot } from "@/components/discussion/discussion-root"
import { CampDevotionDaySelect } from "@/components/camp-devotion-day-select"
import { DEVOTION_ENTRIES } from "@/lib/devotion-content"
import { campDevotionRootKey } from "@/lib/discussion/root-registry"
import { getOrCreateDevotionRoot } from "@/lib/discussion/root"
import { requireFlowAccess } from "@/lib/session"

export const metadata: Metadata = {
  title: "靈修內容",
  robots: { index: false, follow: false },
}

export default async function CampDevotionDayPage({ params }: { params: Promise<{ day: string }> }) {
  const { day } = await params
  const entry = DEVOTION_ENTRIES.find((e) => e.id === day)
  if (!entry) notFound()

  const session = await requireFlowAccess("camp")
  // 工作人員不受 DAY2／DAY3 公布時間限制，隨時能看到完整靈修內容方便備稿確認。
  const isStaff = session.user.role !== "attendee"

  // 引導問題＝這個 root 底下置頂的官方回覆，只在 root 第一次建立時種一次
  // （見 lib/discussion/root.ts）。
  const rootKey = campDevotionRootKey(entry.id)
  await getOrCreateDevotionRoot(rootKey, entry.questions)

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
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">靈修內容</p>
          <CampDevotionDaySelect
            items={DEVOTION_ENTRIES.map((e) => ({ id: e.id, label: e.id.toUpperCase() }))}
            activeId={entry.id}
          />
        </div>

        <DiscussionRoot rootKey={rootKey} session={session} header={<CampDevotionContent entry={entry} isStaff={isStaff} />} />
      </div>
    </main>
  )
}
