import { and, eq, sql } from "drizzle-orm"

import { db } from "@/db"
import { conferenceDinnerRegistration, enrollment } from "@/db/schema/app"

export type DinnerMealType = "meat" | "veggie"

export type DinnerRegistrationState = {
  attending: boolean | null
  mealType: DinnerMealType | null
}

const EMPTY_STATE: DinnerRegistrationState = { attending: null, mealType: null }

// 這個人（用報名 id，不是帳號 id）填過的晚餐回覆；還沒填過回傳 EMPTY_STATE，
// attending 是 null（不是 false）才分得出「還沒填」跟「填了不參加」。
export async function getDinnerRegistration(enrollmentId: string): Promise<DinnerRegistrationState> {
  const [row] = await db
    .select({ attending: conferenceDinnerRegistration.attending, mealType: conferenceDinnerRegistration.mealType })
    .from(conferenceDinnerRegistration)
    .where(eq(conferenceDinnerRegistration.enrollmentId, enrollmentId))
    .limit(1)

  if (!row) return EMPTY_STATE
  return { attending: row.attending, mealType: row.mealType as DinnerMealType | null }
}

export type SaveDinnerInput = { attending: boolean; mealType: DinnerMealType | null }

// 使用者自己在系統上填／改晚餐回覆，永遠可以覆蓋掉前一次的選擇。
// 不參加就不需要葷素，mealType 一律寫 null，不留上一次選過的舊值。
export async function saveMyDinnerSelection(
  enrollmentId: string,
  userId: string,
  input: SaveDinnerInput
): Promise<DinnerRegistrationState> {
  if (input.attending && input.mealType === null) throw new Error("請選擇葷素")

  const mealType = input.attending ? input.mealType : null

  await db
    .insert(conferenceDinnerRegistration)
    .values({ enrollmentId, attending: input.attending, mealType, updatedBy: userId })
    .onConflictDoUpdate({
      target: conferenceDinnerRegistration.enrollmentId,
      set: { attending: input.attending, mealType, updatedBy: userId, updatedAt: new Date() },
    })

  return { attending: input.attending, mealType }
}

export type DinnerStats = {
  totalConferenceEnrolled: number
  attendingCount: number
  notAttendingCount: number
  notRespondedCount: number
  meatCount: number
  veggieCount: number
}

// 後台統計：CONFERENCE 報名人數當分母，回覆過的人依「參加與否」「葷素」
// 分組加總——用一次 group by 撈完，不是分別下好幾支查詢。
export async function getDinnerStats(): Promise<DinnerStats> {
  const [[enrolledRow], groups] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(enrollment).where(eq(enrollment.conference, true)),
    db
      .select({
        attending: conferenceDinnerRegistration.attending,
        mealType: conferenceDinnerRegistration.mealType,
        count: sql<number>`count(*)::int`,
      })
      .from(conferenceDinnerRegistration)
      .groupBy(conferenceDinnerRegistration.attending, conferenceDinnerRegistration.mealType),
  ])

  const totalConferenceEnrolled = enrolledRow?.count ?? 0
  let attendingCount = 0
  let notAttendingCount = 0
  let meatCount = 0
  let veggieCount = 0
  for (const row of groups) {
    if (!row.attending) {
      notAttendingCount += row.count
      continue
    }
    attendingCount += row.count
    if (row.mealType === "meat") meatCount += row.count
    if (row.mealType === "veggie") veggieCount += row.count
  }

  return {
    totalConferenceEnrolled,
    attendingCount,
    notAttendingCount,
    notRespondedCount: Math.max(totalConferenceEnrolled - attendingCount - notAttendingCount, 0),
    meatCount,
    veggieCount,
  }
}

export type DinnerRosterEntry = { name: string; church: string }

// 訂便當用的名單，依葷素分開撈，只列出「參加＋選了這個葷素」的人。
export async function getDinnerRoster(mealType: DinnerMealType): Promise<DinnerRosterEntry[]> {
  const rows = await db
    .select({ name: enrollment.name, church: enrollment.church })
    .from(conferenceDinnerRegistration)
    .innerJoin(enrollment, eq(enrollment.id, conferenceDinnerRegistration.enrollmentId))
    .where(
      and(eq(conferenceDinnerRegistration.attending, true), eq(conferenceDinnerRegistration.mealType, mealType))
    )
    .orderBy(enrollment.name)

  return rows
}
