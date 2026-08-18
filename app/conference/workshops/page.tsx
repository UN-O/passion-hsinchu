import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PassionLogoHeader } from "@/components/passion-logo-header"
import { conferenceWorkshops } from "@/lib/opening-conference-content"
import { requireFlowAccess } from "@/lib/session"

export const metadata: Metadata = {
  title: "工作坊",
  robots: { index: false, follow: false },
}

export default async function ConferenceWorkshopsPage() {
  await requireFlowAccess("conference")

  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 sm:px-6 sm:pb-24">
      <PassionLogoHeader />

      <Button asChild size="icon" variant="outline" aria-label="返回" className="mt-10 rounded-full">
        <Link href="/conference">
          <ArrowLeft />
        </Link>
      </Button>

      <div className="mt-10 flex flex-col gap-10">
        {conferenceWorkshops.map((workshop) => (
          <div key={workshop.title} className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">工作坊介紹</p>
            <p className="text-2xl font-bold">{workshop.title}</p>
            <p className="mt-1 text-base">{workshop.body}</p>
          </div>
        ))}

        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">工作坊報名</p>
          {/* 報名還沒有後端資料模型可以存選擇結果，先停用。 */}
          <Button size="lg" variant="outline" disabled>
            報名尚未開放
          </Button>
        </div>
      </div>
    </main>
  )
}
