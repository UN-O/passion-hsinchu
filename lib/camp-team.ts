import { eq } from "drizzle-orm"

import { db } from "@/db"
import { campTeamMember } from "@/db/schema/app"
import type { ExpRegion } from "./exp-regions"

export type CampTeamInfo = {
  room: string | null
  teamName: string | null
  zone: ExpRegion | null
}

// CampMissionHome 的房號／隊名／分區同一列資料，一次查完給三邊用
// （房號卡片、勇氣值卡片的隊名、首頁分區排序要知道自己在哪一區）。
export async function getCampTeamInfo(enrollmentId: string | null): Promise<CampTeamInfo> {
  if (!enrollmentId) return { room: null, teamName: null, zone: null }
  const [row] = await db
    .select({ room: campTeamMember.room, teamName: campTeamMember.teamName, zone: campTeamMember.zone })
    .from(campTeamMember)
    .where(eq(campTeamMember.enrollmentId, enrollmentId))
    .limit(1)
  return { room: row?.room ?? null, teamName: row?.teamName ?? null, zone: row?.zone ?? null }
}
