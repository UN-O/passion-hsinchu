import { redirect } from "next/navigation"

import { getNextConferenceSession } from "@/lib/opening-conference-content"
import { requireFlowAccess } from "@/lib/session"

// 沒帶場次 id 進來（舊的 ?session= 連結、或直接點「聚會內容」）：導去目前
// 這一場的正式網址。真正的頁面在 [sessionId]/page.tsx——場次一律用路徑
// 裡的 id 定位，不是 query string（查詢參數可以被拿掉/改掉，路徑 id 才是
// 這則討論真正的識別）。
export default async function ConferenceMeetingIndexPage() {
  await requireFlowAccess("conference")
  redirect(`/conference/meeting/${getNextConferenceSession().id}`)
}
