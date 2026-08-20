import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PassionLogoHeader } from "@/components/passion-logo-header"
import { CampDevotionContent } from "@/components/camp-devotion-content"

export default function CampDevotionPlaygroundPage() {
  return (
    <main className="mx-auto max-w-2xl px-[6%] pb-16 sm:px-8 sm:pb-24">
      <PassionLogoHeader logoTone="dark" />
      <Button asChild size="icon" variant="outline" aria-label="返回" className="mt-10 rounded-full">
        <Link href="/playground/camp-mission-home">
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
