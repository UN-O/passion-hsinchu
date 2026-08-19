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
  await requireFlowAccess("camp")

  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 sm:px-6 sm:pb-24">
      <PassionLogoHeader logoTone="dark" />

      <Button asChild size="icon" variant="outline" aria-label="返回" className="mt-10 rounded-full">
        <Link href="/camp">
          <ArrowLeft />
        </Link>
      </Button>

      <div className="mt-10">
        <p className="text-sm text-muted-foreground">靈修內容</p>
        <div className="mt-4">
          <CampDevotionContent />
        </div>
      </div>
    </main>
  )
}
