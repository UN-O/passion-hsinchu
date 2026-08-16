import Link from "next/link"

import { Button } from "@/components/ui/button"
import type { AppSession, Flow } from "@/lib/session"
import { siteConfig, type Program } from "@/lib/site-config"

type ProgramPortalProps = {
  flow: Flow
  program: Program
  session: AppSession
}

// /camp 與 /conference 的參加者入口。授權在各自的 page 用 requireFlowAccess 擋掉，
// 這裡只負責畫面。
export function ProgramPortal({ flow, program, session }: ProgramPortalProps) {
  const isStaff = session.user.role !== "attendee"
  const enrolled = flow === "camp" ? session.enrollment?.camp : session.enrollment?.conference
  const completed = session.completedFlows.includes(flow)

  return (
    <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
      {isStaff && !enrolled && (
        <p className="mb-10 border-b border-border pb-4 text-sm text-muted-foreground">
          你以工作人員身分檢視這個頁面，你本人沒有報名這個場次。
        </p>
      )}

      <p className="text-sm tracking-[0.2em] text-muted-foreground">{program.name}</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{program.label}</h1>
      <p className="mt-4 text-base text-muted-foreground">{program.audience}</p>

      <dl className="mt-12 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <dt className="text-sm text-muted-foreground">日期</dt>
          <dd className="text-base">
            {program.dateLabel}
            {program.durationLabel ? `（${program.durationLabel}）` : ""}
          </dd>
        </div>

        <div className="flex flex-col gap-1">
          <dt className="text-sm text-muted-foreground">時間</dt>
          <dd className="flex flex-col gap-1 text-base">
            {program.timeEntries.map((entry) => (
              <span key={entry}>{entry}</span>
            ))}
          </dd>
        </div>

        <div className="flex flex-col gap-1">
          <dt className="text-sm text-muted-foreground">地點</dt>
          <dd className="text-base">
            {siteConfig.venue}
            <span className="mt-1 block text-sm text-muted-foreground">
              {siteConfig.venueAddress}
            </span>
          </dd>
        </div>
      </dl>

      <div className="mt-12 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="xl" className="w-full sm:w-auto">
          <Link href={`/opening/${flow}/welcome`}>
            {completed ? "再看一次開場" : "開始開場"}
          </Link>
        </Button>
        {/* 加分只有 CAMP 有，CONFERENCE 沒有這個部分 */}
        {flow === "camp" && (
          <Button asChild size="xl" variant="outline" className="w-full sm:w-auto">
            <Link href="/camp/points">分區積分</Link>
          </Button>
        )}
        <Button asChild size="xl" variant="outline" className="w-full sm:w-auto">
          <Link href="/">回首頁</Link>
        </Button>
      </div>
    </main>
  )
}
