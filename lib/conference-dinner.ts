import { eq } from "drizzle-orm"

import { db } from "@/db"
import { conferenceDinnerRegistration } from "@/db/schema/app"

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
