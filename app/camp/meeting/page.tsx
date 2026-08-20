import { redirect } from "next/navigation"

import { getNextCampMeetingSession } from "@/lib/opening-camp-content"
import { requireFlowAccess } from "@/lib/session"

// 沒帶場次 id 進來：導去目前這一場的正式網址。真正的頁面在
// [sessionId]/page.tsx——場次一律用路徑裡的 id 定位，不是 query string。
export default async function CampMeetingIndexPage() {
  await requireFlowAccess("camp")
  redirect(`/camp/meeting/${getNextCampMeetingSession().id}`)
}
