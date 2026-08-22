import { eq } from "drizzle-orm"

import { db } from "@/db"
import { campTeamMember } from "@/db/schema/app"

// 房號目前只有 CampLodgingInfo 用，先只查這一欄；之後如果要顯示分區／
// 隊名，直接在這裡加欄位就好，不用另外開一個函式。
export async function getCampRoomNumber(enrollmentId: string | null): Promise<string | null> {
  if (!enrollmentId) return null
  const [row] = await db
    .select({ room: campTeamMember.room })
    .from(campTeamMember)
    .where(eq(campTeamMember.enrollmentId, enrollmentId))
    .limit(1)
  return row?.room ?? null
}
