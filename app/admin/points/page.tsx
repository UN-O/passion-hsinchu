import Link from "next/link"

import { ExpRegionChart } from "@/components/exp-region-chart"
import { countExpRecords, getRegionStats, listExpRecords } from "@/lib/exp"
import { requireStaff } from "@/lib/session"
import { AwardFlow } from "./award-flow"
import { RecordRow } from "./record-row"

const DEFAULT_LIMIT = 50
// 「顯示全部」仍然設上限：每一列都是一個 client component 表單，
// 活動幾天下來記錄會很多，不要一次塞爆整頁。
const MAX_LIMIT = 500

// 記錄列表要照時間排，時區固定用台北，不要用瀏覽器的。
const timeFormatter = new Intl.DateTimeFormat("zh-TW", {
  timeZone: "Asia/Taipei",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
})

export default async function AdminPointsPage({
  searchParams,
}: {
  searchParams: Promise<{ all?: string }>
}) {
  // layout 也擋了一層，但權限檢查要放在讀資料的地方，不要只靠上層 layout。
  await requireStaff()

  const { all } = await searchParams
  const showAll = all === "1"

  const [stats, records, total] = await Promise.all([
    getRegionStats(),
    listExpRecords(showAll ? MAX_LIMIT : DEFAULT_LIMIT),
    countExpRecords(),
  ])
  const truncated = records.length < total

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">CAMP 加分</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        分數是區的總分，不記到個人。只有 CAMP 有加分，不會有扣分。
      </p>

      <section className="mt-12">
        <h2 className="text-lg font-medium">加分</h2>
        <AwardFlow />
      </section>

      <section className="mt-16">
        <h2 className="text-lg font-medium">三區總分</h2>
        <ExpRegionChart rows={stats} />
      </section>

      <section className="mt-16">
        <h2 className="text-lg font-medium">
          加分記錄{" "}
          <span className="text-muted-foreground">
            （{truncated ? `顯示 ${records.length} / 共 ${total}` : total}）
          </span>
        </h2>

        {records.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">還沒有任何加分記錄。</p>
        ) : (
          <>
            {truncated && (
              <p className="mt-4 text-sm text-muted-foreground">
                只顯示最新 {records.length} 筆。
                <Link
                  href={{ pathname: "/admin/points", query: { all: "1" } }}
                  className="ml-1 font-medium text-foreground underline underline-offset-4"
                >
                  顯示全部 {total} 筆
                </Link>
              </p>
            )}

            <div className="mt-6 flex flex-col gap-6">
              {records.map((record) => (
                <RecordRow
                  key={record.id}
                  row={{
                    id: record.id,
                    region: record.region,
                    amount: record.amount,
                    reason: record.reason,
                    createdByName: record.createdByName,
                    createdAt: timeFormatter.format(record.createdAt),
                  }}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  )
}
