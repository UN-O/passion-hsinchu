import type { Metadata } from "next"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { getRegionTotals } from "@/lib/exp"
import { EXP_REGIONS } from "@/lib/exp-regions"
import { requireFlowAccess } from "@/lib/session"

export const metadata: Metadata = {
  title: "分區積分",
  robots: { index: false, follow: false },
}

export default async function CampPointsPage() {
  // 授權放在讀資料的這一頁，不是只靠上層。/camp 底下目前沒有共用 layout，
  // 就算之後加了，這一行也還是要在。
  await requireFlowAccess("camp")

  // 這頁會被重複重整，所以總分走 unstable_cache + tag；
  // 加分／修正／刪除時由 server action 用 updateTag 失效。
  const totals = await getRegionTotals()

  // 名次照分數排，同分維持三區的固定順序
  const ranked = EXP_REGIONS.map((region) => ({
    ...region,
    total: totals[region.key],
  })).sort((a, b) => b.total - a.total)

  const max = Math.max(...ranked.map((region) => region.total), 0)

  return (
    <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
      <p className="text-sm tracking-[0.2em] text-muted-foreground">CAMP</p>
      <h1 className="font-heading mt-3 text-3xl font-bold tracking-tight sm:text-4xl">分區積分</h1>

      {max === 0 ? (
        <p className="mt-10 text-base text-muted-foreground">還沒有開始計分。</p>
      ) : (
        <ol className="mt-12 flex flex-col gap-10">
          {ranked.map((region) => (
            <li key={region.key} className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-lg sm:text-xl">{region.label}</span>
                <span className="text-3xl font-bold text-primary sm:text-4xl">
                  {region.total.toLocaleString("en-US")}
                </span>
              </div>
              <div className="h-2 rounded-r-[4px] bg-foreground/5">
                {/* 0 分不要畫出一小截棒子，那看起來像已經有分了 */}
                <div
                  className={`h-full rounded-r-[4px] bg-chart-1 ${
                    region.total > 0 ? "min-w-0.5" : ""
                  }`}
                  style={{ width: `${(region.total / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}

      <Button asChild size="xl" variant="outline" className="mt-16 w-full sm:w-auto">
        <Link href="/camp">回 CAMP</Link>
      </Button>
    </main>
  )
}
