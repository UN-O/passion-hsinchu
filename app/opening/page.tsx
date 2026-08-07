import Link from "next/link"
import { redirect } from "next/navigation"

import { Button } from "@/components/ui/button"
import { camp, conference } from "@/lib/site-config"
import { postSignInPath, requireClaimedSession } from "@/lib/session"

// 兩場都報名的人在這裡選要進哪一個流程。
export default async function OpeningChooserPage() {
  const session = await requireClaimedSession()

  const both = session.enrollment?.camp && session.enrollment?.conference
  if (!both) redirect(postSignInPath(session))

  const done = session.completedFlows

  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">你報名了兩個場次</h1>
        <p className="mt-3 text-sm text-muted-foreground">選擇要開始哪一個。</p>

        <div className="mt-8 flex flex-col gap-4">
          <Link
            href="/opening/camp/welcome"
            className="flex flex-col gap-1 rounded-2xl border border-border p-5 transition-colors hover:border-foreground/40"
          >
            <span className="font-medium">{camp.label}</span>
            <span className="text-sm text-muted-foreground">
              {done.includes("camp") ? "已完成，可以再看一次" : camp.audience}
            </span>
          </Link>

          <Link
            href="/opening/conference/welcome"
            className="flex flex-col gap-1 rounded-2xl border border-border p-5 transition-colors hover:border-foreground/40"
          >
            <span className="font-medium">{conference.label}</span>
            <span className="text-sm text-muted-foreground">
              {done.includes("conference") ? "已完成，可以再看一次" : conference.audience}
            </span>
          </Link>
        </div>

        <Button asChild variant="outline" size="sm" className="mt-8">
          <Link href="/">回首頁</Link>
        </Button>
      </div>
    </main>
  )
}
