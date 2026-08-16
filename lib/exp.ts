import { unstable_cache } from "next/cache"
import { count, desc, eq, sum } from "drizzle-orm"

import { db } from "@/db"
import { expRecord } from "@/db/schema/app"
import { EXP_REGIONS, type ExpRegion } from "./exp-regions"

export type ExpRecord = typeof expRecord.$inferSelect
export type RegionTotals = Record<ExpRegion, number>

function emptyTotals(): RegionTotals {
  return Object.fromEntries(EXP_REGIONS.map((region) => [region.key, 0])) as RegionTotals
}

// sum() 在 Postgres 回來的是 bigint，drizzle 給的是 string；沒有記錄時是 null。
function toNumber(value: string | number | null): number {
  return value === null ? 0 : Number(value)
}

export const EXP_TOTALS_TAG = "exp-totals"
const EXP_TOTALS_TTL_SECONDS = 60 * 60

// 學生端的分數頁會被重複重整（活動當下每個人都在刷），不快取的話每一次
// 重整都是一次查詢，對有額度限制的資料庫是白白消耗。
// 加分／修正／刪除時用 updateTag 失效，所以不必等 TTL 到期就會是新的。
export const getRegionTotals = unstable_cache(
  async (): Promise<RegionTotals> => {
    const rows = await db
      .select({ region: expRecord.region, total: sum(expRecord.amount) })
      .from(expRecord)
      .groupBy(expRecord.region)

    const totals = emptyTotals()
    for (const row of rows) totals[row.region] = toNumber(row.total)
    return totals
  },
  ["exp-region-totals"],
  { tags: [EXP_TOTALS_TAG], revalidate: EXP_TOTALS_TTL_SECONDS }
)

export type RegionStat = {
  region: ExpRegion
  total: number
  records: number
}

// 後台的統計。刻意不共用學生端那份快取：後台是加完分馬上要看到結果的地方，
// 這裡讀到舊值會讓人以為加分沒成功而重複再加一次。
// 只有 staff 進得來，流量跟學生端不是同一個量級。
export async function getRegionStats(): Promise<RegionStat[]> {
  const rows = await db
    .select({
      region: expRecord.region,
      total: sum(expRecord.amount),
      records: count(),
    })
    .from(expRecord)
    .groupBy(expRecord.region)

  const byRegion = new Map(rows.map((row) => [row.region, row]))

  // 沒有任何記錄的區也要出現在圖表上（顯示 0），不然三區會變兩區
  return EXP_REGIONS.map(({ key }) => {
    const row = byRegion.get(key)
    return {
      region: key,
      total: toNumber(row?.total ?? null),
      records: row?.records ?? 0,
    }
  })
}

export async function listExpRecords(limit: number): Promise<ExpRecord[]> {
  return db.select().from(expRecord).orderBy(desc(expRecord.createdAt)).limit(limit)
}

export async function countExpRecords(): Promise<number> {
  const [row] = await db.select({ value: count() }).from(expRecord)
  return row?.value ?? 0
}

export type AwardInput = {
  regions: ExpRegion[]
  amount: number
  reason: string | null
  createdBy: string
  createdByName: string
}

// 多選分區時一區寫一列。一次 insert 多筆，不要在迴圈裡逐筆送。
export async function createExpRecords(input: AwardInput): Promise<number> {
  if (input.regions.length === 0) return 0

  const rows = await db
    .insert(expRecord)
    .values(
      input.regions.map((region) => ({
        region,
        amount: input.amount,
        reason: input.reason,
        createdBy: input.createdBy,
        createdByName: input.createdByName,
      }))
    )
    .returning({ id: expRecord.id })

  return rows.length
}

export type ExpRecordPatch = {
  region: ExpRegion
  amount: number
  reason: string | null
}

// 修正打錯的那一列。因為不用扣分，直接改這一列就好，不需要沖銷。
export async function updateExpRecord(id: string, patch: ExpRecordPatch): Promise<boolean> {
  const rows = await db
    .update(expRecord)
    .set({ region: patch.region, amount: patch.amount, reason: patch.reason })
    .where(eq(expRecord.id, id))
    .returning({ id: expRecord.id })

  return rows.length > 0
}

export async function deleteExpRecord(id: string): Promise<boolean> {
  const rows = await db
    .delete(expRecord)
    .where(eq(expRecord.id, id))
    .returning({ id: expRecord.id })

  return rows.length > 0
}
