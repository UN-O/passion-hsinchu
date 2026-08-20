import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PassionLogoHeader } from "@/components/passion-logo-header"
import { MeetingNotes } from "@/components/meeting-notes"

export default function CampMeetingPlaygroundPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 sm:px-6 sm:pb-24">
      <PassionLogoHeader
        leftSlot={
          <Button asChild size="icon-sm" variant="outline" aria-label="返回" className="rounded-full">
            <Link href="/playground/camp-mission-home">
              <ArrowLeft />
            </Link>
          </Button>
        }
      />

      <div className="mt-10 flex flex-col gap-10">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">聚會場次、名稱</p>
          <p className="text-2xl font-bold">場次名稱尚未公布</p>
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
  )
}
