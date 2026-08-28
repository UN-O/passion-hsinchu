import { db } from "@/db"
import { conferenceWorkshopCapacity, conferenceWorkshopRegistration, enrollment } from "@/db/schema/app"
import { and, eq, sql } from "drizzle-orm"

import { conferenceWorkshops, isWorkshopSelectionClosed, type ConferenceWorkshopRound } from "./opening-conference-content"

export type WorkshopRegistrationState = Record<ConferenceWorkshopRound, string | null>

const EMPTY_STATE: WorkshopRegistrationState = { R1: null, R2: null }

// 這個人（用報名 id，不是帳號 id）在兩場各選了哪個工作坊。
export async function getWorkshopRegistration(enrollmentId: string): Promise<WorkshopRegistrationState> {
  const rows = await db
    .select({ round: conferenceWorkshopRegistration.round, workshopId: conferenceWorkshopRegistration.workshopId })
    .from(conferenceWorkshopRegistration)
    .where(eq(conferenceWorkshopRegistration.enrollmentId, enrollmentId))

  const state = { ...EMPTY_STATE }
  for (const row of rows) state[row.round as ConferenceWorkshopRound] = row.workshopId
  return state
}

// key 是 `${workshopId}:${round}`，後台容量表跟即時人數共用同一個 key 格式，
// 兩份地圖對得起來才好比對。
function slotKey(workshopId: string, round: string): string {
  return `${workshopId}:${round}`
}

// 每個工作坊＋場次目前報名人數（不分來源，匯入跟自選都算）。
export async function getWorkshopCounts(): Promise<Map<string, number>> {
  const rows = await db
    .select({
      workshopId: conferenceWorkshopRegistration.workshopId,
      round: conferenceWorkshopRegistration.round,
      count: sql<number>`count(*)::int`,
    })
    .from(conferenceWorkshopRegistration)
    .groupBy(conferenceWorkshopRegistration.workshopId, conferenceWorkshopRegistration.round)

  return new Map(rows.map((r) => [slotKey(r.workshopId, r.round), r.count]))
}

// 有設上限的工作坊＋場次。沒有列在這裡＝不限人數。
export async function getWorkshopCapacities(): Promise<Map<string, number>> {
  const rows = await db
    .select({
      workshopId: conferenceWorkshopCapacity.workshopId,
      round: conferenceWorkshopCapacity.round,
      capacity: conferenceWorkshopCapacity.capacity,
    })
    .from(conferenceWorkshopCapacity)

  return new Map(rows.map((r) => [slotKey(r.workshopId, r.round), r.capacity]))
}

// 給前台用：算出目前額滿、不能再選的工作坊＋場次組合（`${workshopId}:${round}`）。
// 已經選在裡面的人不受這個限制（見 saveMyWorkshopSelection 的說明），這裡只
// 回傳「陌生人現在點會被擋」的組合，畫面上要不要放行自己的既有選項由呼叫端
// 自己比對 initialRegistration 處理。
export async function getFullWorkshopSlots(): Promise<Set<string>> {
  const [counts, capacities] = await Promise.all([getWorkshopCounts(), getWorkshopCapacities()])
  const full = new Set<string>()
  for (const [key, capacity] of capacities) {
    if ((counts.get(key) ?? 0) >= capacity) full.add(key)
  }
  return full
}

function findWorkshop(workshopId: string) {
  return conferenceWorkshops.find((w) => w.id === workshopId)
}

export type SaveSelectionInput = { R1: string; R2: string }

// 使用者自己在系統上選／改工作坊。兩場一起送出（跟原本 Google 表單一樣，
// 一次填完兩場），永遠可以覆蓋掉前一次的選擇，不管前一次是自己選的還是
// CSV 匯入既有 Google 表單回覆進來的。
export async function saveMyWorkshopSelection(
  enrollmentId: string,
  userId: string,
  selections: SaveSelectionInput
): Promise<WorkshopRegistrationState> {
  // 前端會把選擇按鈕整個鎖住（見 ConferenceWorkshopPicker），但那只是 UI，
  // 真正擋人的一定要在伺服器端再驗一次——不然直接打這支 server action 就
  // 繞過去了。
  if (isWorkshopSelectionClosed()) {
    throw new Error("已超過選工作坊的更改期限（場次一開始前 30 分鐘截止）")
  }

  const rounds: ConferenceWorkshopRound[] = ["R1", "R2"]

  for (const round of rounds) {
    const workshopId = selections[round]
    const workshop = findWorkshop(workshopId)
    if (!workshop) throw new Error("選到不存在的工作坊")
    if (!workshop.rounds.includes(round)) throw new Error(`${workshop.topic || workshop.speaker} 沒有開放這個場次`)
  }

  const [counts, capacities] = await Promise.all([getWorkshopCounts(), getWorkshopCapacities()])
  const current = await getWorkshopRegistration(enrollmentId)

  for (const round of rounds) {
    const workshopId = selections[round]
    // 已經是自己這場的選擇＝沒有新增人數，不受上限擋
    if (current[round] === workshopId) continue

    const capacity = capacities.get(slotKey(workshopId, round))
    if (capacity === undefined) continue
    const count = counts.get(slotKey(workshopId, round)) ?? 0
    if (count >= capacity) {
      const workshop = findWorkshop(workshopId)!
      throw new Error(`${workshop.topic || workshop.speaker}已額滿，請選其他工作坊`)
    }
  }

  await db.transaction(async (tx) => {
    for (const round of rounds) {
      await tx
        .insert(conferenceWorkshopRegistration)
        .values({
          enrollmentId,
          round,
          workshopId: selections[round],
          source: "self",
          updatedBy: userId,
        })
        .onConflictDoUpdate({
          target: [conferenceWorkshopRegistration.enrollmentId, conferenceWorkshopRegistration.round],
          set: {
            workshopId: selections[round],
            source: "self",
            updatedBy: userId,
            updatedAt: new Date(),
          },
        })
    }
  })

  return { ...selections }
}

// 後台容量設定。capacity 是 null 時代表「不限」，直接把那一列刪掉——
// 沒有列＝不限，是這張表既有的規則（見 db/schema/app.ts 的說明）。
export async function setWorkshopCapacity(
  workshopId: string,
  round: ConferenceWorkshopRound,
  capacity: number | null
): Promise<void> {
  if (capacity === null) {
    await db
      .delete(conferenceWorkshopCapacity)
      .where(and(eq(conferenceWorkshopCapacity.workshopId, workshopId), eq(conferenceWorkshopCapacity.round, round)))
    return
  }

  await db
    .insert(conferenceWorkshopCapacity)
    .values({ workshopId, round, capacity, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [conferenceWorkshopCapacity.workshopId, conferenceWorkshopCapacity.round],
      set: { capacity, updatedAt: new Date() },
    })
}

export type ExistingWorkshopRow = {
  enrollmentId: string
  round: ConferenceWorkshopRound
  workshopId: string
  source: "import" | "self"
}

// CSV 匯入比對用：目前資料庫裡每個人兩場各自的選擇（用來算「這筆匯入資料
// 有沒有變化」），跟 lib/enrollment.ts 的 getAllForDiff 是同樣的用途。
export async function getAllRegistrationsForDiff(): Promise<ExistingWorkshopRow[]> {
  const rows = await db
    .select({
      enrollmentId: conferenceWorkshopRegistration.enrollmentId,
      round: conferenceWorkshopRegistration.round,
      workshopId: conferenceWorkshopRegistration.workshopId,
      source: conferenceWorkshopRegistration.source,
    })
    .from(conferenceWorkshopRegistration)

  return rows.map((r) => ({ ...r, round: r.round as ConferenceWorkshopRound, source: r.source as "import" | "self" }))
}

export type ImportEntry = { enrollmentId: string; round: ConferenceWorkshopRound; workshopId: string }

export type WorkshopRosterEntry = { name: string; church: string }

// 後台下載名單用：這個工作坊＋場次目前報了誰（姓名＋教會），照姓名排序。
// CONFERENCE 是「20 歲以上社青」，不是未成年人名冊，但仍然是個資，只能
// 從 requireStaff() 擋過的後台頁面呼叫。
export async function getWorkshopRoster(workshopId: string, round: ConferenceWorkshopRound): Promise<WorkshopRosterEntry[]> {
  const rows = await db
    .select({ name: enrollment.name, church: enrollment.church })
    .from(conferenceWorkshopRegistration)
    .innerJoin(enrollment, eq(enrollment.id, conferenceWorkshopRegistration.enrollmentId))
    .where(and(eq(conferenceWorkshopRegistration.workshopId, workshopId), eq(conferenceWorkshopRegistration.round, round)))
    .orderBy(enrollment.name)

  return rows
}

export type WorkshopRegistrationStats = {
  totalConferenceEnrolled: number
  completedCount: number
  notCompletedCount: number
}

// 後台報名狀況總覽：報 CONFERENCE 的人裡面，兩場都選完的有幾個、還有幾個
// 一場都還沒選或只選了一場（notCompletedCount 沒有再細分成「完全沒選」跟
// 「選一半」，因為兩者都算「還沒完成報名」，後台真正在意的是這個總數）。
export async function getWorkshopRegistrationStats(): Promise<WorkshopRegistrationStats> {
  const [[enrolledRow], [completedRow]] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(enrollment).where(eq(enrollment.conference, true)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(
        db
          .select({ enrollmentId: conferenceWorkshopRegistration.enrollmentId })
          .from(conferenceWorkshopRegistration)
          .groupBy(conferenceWorkshopRegistration.enrollmentId)
          .having(sql`count(distinct ${conferenceWorkshopRegistration.round}) = 2`)
          .as("completed")
      ),
  ])

  const totalConferenceEnrolled = enrolledRow?.count ?? 0
  const completedCount = completedRow?.count ?? 0
  return {
    totalConferenceEnrolled,
    completedCount,
    notCompletedCount: Math.max(totalConferenceEnrolled - completedCount, 0),
  }
}

// CSV 匯入套用：只做新增與更新，來源一律標成 import。跟 enrollment 的
// applyDiff 同一個原則——匯入不會刪除任何既有資料。
//
// setWhere 擋掉一種情況：這個人已經在系統上自己選過（source = "self"），
// 這次匯入的是比較舊的 Google 表單快照，不該把使用者自己改過的選擇蓋掉。
// 沒有既有列（新報名）或既有列本來就是 import 來源時才會真的寫入。
export async function applyImportedRegistrations(entries: ImportEntry[]): Promise<void> {
  if (entries.length === 0) return

  await db
    .insert(conferenceWorkshopRegistration)
    .values(entries.map((e) => ({ ...e, source: "import" as const, updatedBy: null })))
    .onConflictDoUpdate({
      target: [conferenceWorkshopRegistration.enrollmentId, conferenceWorkshopRegistration.round],
      set: {
        workshopId: sql`excluded.workshop_id`,
        source: sql`excluded.source`,
        updatedBy: sql`excluded.updated_by`,
        updatedAt: new Date(),
      },
      setWhere: eq(conferenceWorkshopRegistration.source, "import"),
    })
}
