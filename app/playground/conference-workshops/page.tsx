import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PassionLogoHeader } from "@/components/passion-logo-header"
import { conferenceWorkshops } from "@/lib/opening-conference-content"

export default function ConferenceWorkshopsPlaygroundPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 sm:px-6 sm:pb-24">
      <PassionLogoHeader />

      <Button asChild size="icon" variant="outline" aria-label="返回" className="mt-10 rounded-full">
        <Link href="/playground/conference-mission-home">
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
          <Button size="lg" variant="outline" disabled>
            報名尚未開放
          </Button>
        </div>
      </div>
    </main>
  )
}
