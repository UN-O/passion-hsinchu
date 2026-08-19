import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PassionLogoHeader } from "@/components/passion-logo-header"
import { requireFlowAccess } from "@/lib/session"

export const metadata: Metadata = {
  title: "聚會流程表",
  robots: { index: false, follow: false },
}

// 真正的聚會細流還沒有地方持久化，先放佔位文字，等流程表資料確定後補上。
const PLACEHOLDER_TEXT = "這裡先放佔位文字，等聚會流程表確定後補上。"

export default async function CampSchedulePage() {
  await requireFlowAccess("camp")

  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 sm:px-6 sm:pb-24">
      <PassionLogoHeader />

      <Button asChild size="icon" variant="outline" aria-label="返回" className="mt-10 rounded-full">
        <Link href="/camp">
          <ArrowLeft />
        </Link>
      </Button>

      <div className="mt-10 flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">聚會流程表</p>
        <p className="text-base">{PLACEHOLDER_TEXT}</p>
      </div>
    </main>
  )
}
