import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PassionLogoHeader } from "@/components/passion-logo-header"
import { getConferenceWorkshop, conferenceWorkshops } from "@/lib/opening-conference-content"
import { requireFlowAccess } from "@/lib/session"

export function generateStaticParams() {
  return conferenceWorkshops.map((workshop) => ({ id: workshop.id }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const workshop = getConferenceWorkshop(id)
  return { title: workshop?.title ?? "工作坊", robots: { index: false, follow: false } }
}

export default async function ConferenceWorkshopDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireFlowAccess("conference")

  const { id } = await params
  const workshop = getConferenceWorkshop(id)
  if (!workshop) notFound()

  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 sm:px-6 sm:pb-24">
      <PassionLogoHeader />

      <Button asChild size="icon" variant="outline" aria-label="返回" className="mt-10 rounded-full">
        <Link href="/conference">
          <ArrowLeft />
        </Link>
      </Button>

      <div className="mt-10 flex flex-col gap-6">
        {/* 工作坊主視覺尚未提供圖片，先放色塊佔位 */}
        <div className="aspect-video w-full rounded-3xl bg-[#3B82F6]" />

        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">工作坊介紹</p>
          <h1 className="font-heading text-2xl font-bold">{workshop.title}</h1>
          <p className="mt-2 text-base">{workshop.body}</p>
        </div>
      </div>
    </main>
  )
}
