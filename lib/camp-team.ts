import { eq } from "drizzle-orm"

import { db } from "@/db"
import { campTeamMember } from "@/db/schema/app"

export type CampTeamInfo = {
  room: string | null
  teamName: string | null
}

// CampMissionHome 的房號／隊名同一列資料，一次查完給兩邊用。
export async function getCampTeamInfo(enrollmentId: string | null): Promise<CampTeamInfo> {
  if (!enrollmentId) return { room: null, teamName: null }
  const [row] = await db
    .select({ room: campTeamMember.room, teamName: campTeamMember.teamName })
    .from(campTeamMember)
    .where(eq(campTeamMember.enrollmentId, enrollmentId))
    .limit(1)
  return { room: row?.room ?? null, teamName: row?.teamName ?? null }
}
