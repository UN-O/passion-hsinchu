import Link from "next/link"

import { PassionLogoHeader } from "@/components/passion-logo-header"

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-border bg-muted/20 p-6 ${className}`}>{children}</div>
  )
}

export function ConferenceMissionHome({
  workshopsHref = "/conference/workshops",
  meetingHref = "/conference/meeting",
}: {
  workshopsHref?: string
  meetingHref?: string
} = {}) {
  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 sm:px-6 sm:pb-24">
      <PassionLogoHeader />

      <Link href={workshopsHref} className="mt-10 block">
        <SectionCard className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">工作坊</p>
          <p className="text-xl font-bold">查看工作坊介紹</p>
        </SectionCard>
      </Link>

      {/* 工作坊報名目前還沒有後端可以存選擇結果，先連到同一個介紹頁。 */}
      <Link href={workshopsHref} className="mt-6 block">
        <SectionCard className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">工作坊</p>
          <p className="text-xl font-bold">工作坊報名</p>
        </SectionCard>
      </Link>

      <Link href={meetingHref} className="mt-6 block">
        <SectionCard className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">聚會內容</p>
          <p className="text-xl font-bold">查看這場聚會的大綱與筆記</p>
        </SectionCard>
      </Link>

      <SectionCard className="mt-6 flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">下場聚會倒數</p>
        <p className="text-xl font-bold">時間尚未公布</p>
      </SectionCard>
    </main>
  )
}
