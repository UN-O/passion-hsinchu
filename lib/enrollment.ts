import { and, asc, eq, ilike, or, sql } from "drizzle-orm"

import { db } from "@/db"
import { enrollment } from "@/db/schema/app"
import type { Diff, ExistingRow } from "./enrollment-csv"
import { normalizeChurch, normalizeName } from "./normalize"

export type Enrollment = typeof enrollment.$inferSelect

// 登入與認領都走這個函式。姓名是使用者手打的，一定要經過正規化再比對。
export async function findEnrollment(name: string, church: string): Promise<Enrollment | null> {
  const nameNorm = normalizeName(name)
  const churchNorm = normalizeChurch(church)
  if (!nameNorm || !churchNorm) return null

  const [found] = await db
    .select()
    .from(enrollment)
    .where(and(eq(enrollment.nameNorm, nameNorm), eq(enrollment.churchNorm, churchNorm)))
    .limit(1)

  return found ?? null
}

export async function getEnrollmentById(id: string): Promise<Enrollment | null> {
  const [found] = await db.select().from(enrollment).where(eq(enrollment.id, id)).limit(1)
  return found ?? null
}

// 簽到頁的教會下拉選單。只列出該場次真的有人報名的教會，
// 所以名冊上沒有的教會不可能被選到。
export async function listChurches(flow: "camp" | "conference"): Promise<string[]> {
  const column = flow === "camp" ? enrollment.camp : enrollment.conference
  const rows = await db
    .selectDistinct({ church: enrollment.church })
    .from(enrollment)
    .where(eq(column, true))
    .orderBy(asc(enrollment.church))

  return rows.map((r) => r.church)
}

export async function searchEnrollments(query: string, limit = 50): Promise<Enrollment[]> {
  const trimmed = query.trim()
  if (!trimmed) {
    return db.select().from(enrollment).orderBy(asc(enrollment.church), asc(enrollment.name)).limit(limit)
  }

  // 用正規化後的值做前綴比對，這樣後台搜尋跟登入比對的行為一致
  const nameNorm = normalizeName(trimmed)
  const churchNorm = normalizeChurch(trimmed)

  return db
    .select()
    .from(enrollment)
    .where(
      or(
        ilike(enrollment.nameNorm, `%${nameNorm}%`),
        ilike(enrollment.churchNorm, `%${churchNorm}%`)
      )
    )
    .orderBy(asc(enrollment.church), asc(enrollment.name))
    .limit(limit)
}

export async function getAllForDiff(): Promise<ExistingRow[]> {
  const rows = await db
    .select({
      id: enrollment.id,
      name: enrollment.name,
      church: enrollment.church,
      camp: enrollment.camp,
      conference: enrollment.conference,
      nameNorm: enrollment.nameNorm,
      churchNorm: enrollment.churchNorm,
    })
    .from(enrollment)

  return rows
}

export type ApplyResult = { created: number; updated: number; unchanged: number }

// 套用 CSV 差異。只做新增與更新，不刪除任何既有列。
export async function applyDiff(diff: Diff): Promise<ApplyResult> {
  const toWrite = diff.entries.filter((e) => e.action !== "unchanged")
  if (toWrite.length === 0) {
    return { created: 0, updated: 0, unchanged: diff.unchangedCount }
  }

  const values = toWrite.map((e) => ({
    name: e.row.name,
    nameNorm: e.row.nameNorm,
    church: e.row.church,
    churchNorm: e.row.churchNorm,
    camp: e.row.camp,
    conference: e.row.conference,
  }))

  // 以 (name_norm, church_norm) 這個 unique index 做 upsert
  await db
    .insert(enrollment)
    .values(values)
    .onConflictDoUpdate({
      target: [enrollment.nameNorm, enrollment.churchNorm],
      set: {
        name: sql`excluded.name`,
        church: sql`excluded.church`,
        camp: sql`excluded.camp`,
        conference: sql`excluded.conference`,
        updatedAt: new Date(),
      },
    })

  return {
    created: diff.createCount,
    updated: diff.updateCount,
    unchanged: diff.unchangedCount,
  }
}

export type EnrollmentInput = {
  name: string
  church: string
  camp: boolean
  conference: boolean
  note?: string | null
}

// 現場救援用：工作人員手動新增一筆（現場報名）
export async function createEnrollment(input: EnrollmentInput): Promise<Enrollment> {
  const [row] = await db
    .insert(enrollment)
    .values({
      name: input.name.trim(),
      nameNorm: normalizeName(input.name),
      church: input.church.trim(),
      churchNorm: normalizeChurch(input.church),
      camp: input.camp,
      conference: input.conference,
      note: input.note ?? null,
    })
    .returning()

  return row
}

// 現場救援用：工作人員改掉打錯的名字
export async function updateEnrollment(id: string, input: EnrollmentInput): Promise<Enrollment> {
  const [row] = await db
    .update(enrollment)
    .set({
      name: input.name.trim(),
      nameNorm: normalizeName(input.name),
      church: input.church.trim(),
      churchNorm: normalizeChurch(input.church),
      camp: input.camp,
      conference: input.conference,
      note: input.note ?? null,
      updatedAt: new Date(),
    })
    .where(eq(enrollment.id, id))
    .returning()

  return row
}
